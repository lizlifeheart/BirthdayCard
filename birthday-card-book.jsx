import React, { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Camera, Volume2, VolumeX, Plus, X, RotateCcw, Music, Trash2 } from "lucide-react";

const LEAF_COUNT = 3;

export default function BirthdayCardBook() {
  const [openIndex, setOpenIndex] = useState(0); // 0..LEAF_COUNT, how many leaves are flipped
  const [muted, setMuted] = useState(false);
  const [name, setName] = useState("Someone Wonderful");
  const [message, setMessage] = useState(
    "Another year older, another year more wonderful. I hope today is full of cake, laughter, and everything you love. Here's to the year ahead \u2014 make it a good one."
  );
  const [wishes, setWishes] = useState([
    "Wishing you the happiest of days!",
    "Cheers to you \u2014 enjoy every minute!",
  ]);
  const [photos, setPhotos] = useState({ p1: null, p2: null });
  const [captions, setCaptions] = useState({ p1: "", p2: "" });

  const audioCtxRef = useRef(null);
  const touchStartX = useRef(null);
  const customAudioRef = useRef(null);
  const [customSoundUrl, setCustomSoundUrl] = useState(null);
  const [customSoundName, setCustomSoundName] = useState("");

  const ensureCtx = () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  };

  // Layered synthesized paper sound: a soft low "thump" of the sheet lifting
  // plus a brighter high sweep of the edge dragging past, closer to a real turn.
  const playSynthTurn = useCallback((ctx) => {
    const now = ctx.currentTime;

    const mkNoise = (dur) => {
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      return src;
    };

    // Layer 1: quick low-mid "lift"
    const lift = mkNoise(0.14);
    const liftFilter = ctx.createBiquadFilter();
    liftFilter.type = "bandpass";
    liftFilter.frequency.value = 500;
    liftFilter.Q.value = 0.6;
    const liftGain = ctx.createGain();
    liftGain.gain.setValueAtTime(0.0001, now);
    liftGain.gain.linearRampToValueAtTime(0.35, now + 0.01);
    liftGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    lift.connect(liftFilter).connect(liftGain).connect(ctx.destination);

    // Layer 2: the sweeping edge drag, slightly delayed, longer
    const drag = mkNoise(0.4);
    const dragFilter = ctx.createBiquadFilter();
    dragFilter.type = "bandpass";
    dragFilter.frequency.setValueAtTime(1400, now + 0.05);
    dragFilter.frequency.linearRampToValueAtTime(3200, now + 0.42);
    dragFilter.Q.value = 0.9;
    const dragGain = ctx.createGain();
    dragGain.gain.setValueAtTime(0.0001, now + 0.05);
    dragGain.gain.linearRampToValueAtTime(0.3, now + 0.09);
    dragGain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
    drag.connect(dragFilter).connect(dragGain).connect(ctx.destination);

    // Layer 3: tiny high-frequency "settle" tick at the end
    const settle = mkNoise(0.08);
    const settleFilter = ctx.createBiquadFilter();
    settleFilter.type = "highpass";
    settleFilter.frequency.value = 4000;
    const settleGain = ctx.createGain();
    settleGain.gain.setValueAtTime(0.0001, now + 0.42);
    settleGain.gain.linearRampToValueAtTime(0.12, now + 0.44);
    settleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    settle.connect(settleFilter).connect(settleGain).connect(ctx.destination);

    lift.start(now);
    lift.stop(now + 0.16);
    drag.start(now + 0.05);
    drag.stop(now + 0.47);
    settle.start(now + 0.42);
    settle.stop(now + 0.53);
  }, []);

  const playPageTurn = useCallback(() => {
    if (muted) return;
    if (customSoundUrl && customAudioRef.current) {
      try {
        customAudioRef.current.currentTime = 0;
        customAudioRef.current.play();
        return;
      } catch (e) {
        /* fall through to synth */
      }
    }
    try {
      const ctx = ensureCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      playSynthTurn(ctx);
    } catch (e) {
      /* ignore audio errors */
    }
  }, [muted, customSoundUrl, playSynthTurn]);

  const handleCustomSound = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomSoundUrl(url);
    setCustomSoundName(file.name);
  };

  useEffect(() => {
    return () => {
      if (customSoundUrl) URL.revokeObjectURL(customSoundUrl);
    };
  }, [customSoundUrl]);

  const goNext = () => {
    setOpenIndex((i) => {
      if (i >= LEAF_COUNT) return i;
      playPageTurn();
      return i + 1;
    });
  };
  const goPrev = () => {
    setOpenIndex((i) => {
      if (i <= 0) return i;
      playPageTurn();
      return i - 1;
    });
  };

  const handleBookClick = (e) => {
    if (e.target.closest(".no-flip")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width / 2) goNext();
    else goPrev();
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 45) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const handlePhoto = (key, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotos((p) => ({ ...p, [key]: reader.result }));
    reader.readAsDataURL(file);
  };

  const updateWish = (idx, val) =>
    setWishes((w) => w.map((line, i) => (i === idx ? val : line)));
  const addWish = () => setWishes((w) => [...w, ""]);
  const removeWish = (idx) => setWishes((w) => w.filter((_, i) => i !== idx));

  const leaves = [
    { front: "cover", back: "titlepage" },
    { front: "message", back: "photo1" },
    { front: "photo2", back: "wishes" },
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(circle at 30% 20%, #2f2138 0%, #1c1420 55%, #120d15 100%)",
        fontFamily: "'EB Garamond', serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Caveat:wght@500;600;700&display=swap');
        .book-perspective { perspective: 2400px; }
        .leaf {
          position: absolute; inset: 0;
          transform-style: preserve-3d;
          transform-origin: left center;
          transition: transform 0.62s cubic-bezier(.22,.61,.16,1);
          will-change: transform;
          cursor: pointer;
          transform: rotateY(0deg) translateZ(0);
          backface-visibility: hidden;
        }
        .leaf.flipped { transform: rotateY(-180deg) translateZ(0); }
        .face {
          position: absolute; inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          overflow: hidden;
          border-radius: 0 14px 14px 0;
          transform: translateZ(0);
        }
        .face.back { transform: rotateY(180deg) translateZ(0); }
        .leaf::before {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(90deg, rgba(0,0,0,0.35), transparent 35%);
          opacity: 0;
          transition: opacity 0.62s cubic-bezier(.22,.61,.16,1);
          pointer-events: none;
          z-index: 5;
        }
        .leaf.flipped::before { opacity: 1; }
        .polaroid {
          background: #fbf6ec;
          padding: 10px 10px 34px 10px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.25);
          border-radius: 2px;
        }
        .wish-line { font-family: 'Caveat', cursive; }
        .confetti-dot { position: absolute; border-radius: 50%; opacity: 0.55; }
      `}</style>

      <div className="mb-4 flex items-center gap-3 no-flip">
        <button
          onClick={() => setOpenIndex(0)}
          className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-[#C9A227]/50 text-[#E8D48B] hover:bg-white/5 transition"
        >
          <RotateCcw size={14} /> Restart
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-[#C9A227]/50 text-[#E8D48B] hover:bg-white/5 transition"
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          {muted ? "Sound off" : "Sound on"}
        </button>
        <label className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-[#C9A227]/50 text-[#E8D48B] hover:bg-white/5 transition cursor-pointer">
          <Music size={14} />
          {customSoundUrl ? "Sound loaded" : "Use my own sound"}
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleCustomSound(e.target.files?.[0])}
          />
        </label>
        {customSoundUrl && (
          <button
            onClick={() => {
              setCustomSoundUrl(null);
              setCustomSoundName("");
            }}
            title="Remove custom sound"
            className="flex items-center gap-1 text-sm px-2 py-1.5 rounded-full border border-[#a23e48]/50 text-[#e79aa0] hover:bg-white/5 transition"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {customSoundUrl && (
        <audio ref={customAudioRef} src={customSoundUrl} preload="auto" className="hidden" />
      )}
      {customSoundName && (
        <p className="text-[10px] text-[#c9b8cf]/50 -mt-2 mb-3 no-flip">Playing: {customSoundName}</p>
      )}

      <div
        className="book-perspective relative"
        style={{ width: "min(90vw, 400px)", height: "min(74vh, 540px)" }}
        onClick={handleBookClick}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* spine shadow */}
        <div
          className="absolute -left-2 top-2 bottom-2 w-4 rounded-l-lg"
          style={{ background: "linear-gradient(90deg,#1a0f16,#3B1F2B)" }}
        />

        {leaves.map((leaf, i) => {
          const flipped = i < openIndex;
          const z = flipped ? i + 1 : leaves.length - i;
          return (
            <div
              key={i}
              className={`leaf ${flipped ? "flipped" : ""}`}
              style={{ zIndex: z, boxShadow: "2px 4px 18px rgba(0,0,0,0.35)" }}
            >
              <div className="face front">
                <PageContent kind={leaf.front} ctx={{ name, setName, message, setMessage, photos, captions, setCaptions, handlePhoto, wishes, updateWish, addWish, removeWish }} />
              </div>
              <div className="face back">
                <PageContent kind={leaf.back} ctx={{ name, setName, message, setMessage, photos, captions, setCaptions, handlePhoto, wishes, updateWish, addWish, removeWish }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-4 no-flip">
        <button
          onClick={goPrev}
          disabled={openIndex === 0}
          className="p-2 rounded-full border border-[#C9A227]/50 text-[#E8D48B] disabled:opacity-30 hover:bg-white/5 transition"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: LEAF_COUNT + 1 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: i === openIndex ? "#C9A227" : "rgba(233,212,139,0.25)" }}
            />
          ))}
        </div>
        <button
          onClick={goNext}
          disabled={openIndex === LEAF_COUNT}
          className="p-2 rounded-full border border-[#C9A227]/50 text-[#E8D48B] disabled:opacity-30 hover:bg-white/5 transition"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <p className="mt-3 text-xs text-[#c9b8cf]/60 text-center max-w-xs no-flip">
        Swipe, tap the page edges, or use the arrows to turn the page. Tap the photo frames to add your own pictures.
      </p>
    </div>
  );
}

function PageContent({ kind, ctx }) {
  const { name, setName, message, setMessage, photos, captions, setCaptions, handlePhoto, wishes, updateWish, addWish, removeWish } = ctx;

  if (kind === "cover") {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center px-8 text-center relative"
        style={{ background: "linear-gradient(160deg,#4a2438,#2A1620)" }}
      >
        <div className="absolute inset-3 border border-[#C9A227]/40 rounded-md pointer-events-none" />
        {[...Array(10)].map((_, i) => (
          <span
            key={i}
            className="confetti-dot"
            style={{
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              background: i % 2 ? "#C9A227" : "#2F6F62",
              top: `${(i * 37) % 90}%`,
              left: `${(i * 53) % 90}%`,
            }}
          />
        ))}
        <p className="text-[#E8D48B] tracking-[0.3em] text-[10px] uppercase mb-3">A little book of wishes</p>
        <h1
          className="text-[#F7EFD8] text-4xl leading-tight mb-4"
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
        >
          Happy Birthday
        </h1>
        <input
          className="no-flip bg-transparent text-center text-[#E8D48B] text-xl border-b border-dotted border-[#C9A227]/60 focus:outline-none px-2 py-1"
          style={{ fontFamily: "'Playfair Display', serif" }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Their name"
        />
        <div className="mt-8 w-10 h-10 rounded-full border-2 border-[#C9A227] flex items-center justify-center text-[#C9A227] text-[10px]">
          tap &rarr;
        </div>
      </div>
    );
  }

  if (kind === "titlepage") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-8 text-center" style={{ background: "#FBF6EC" }}>
        <p className="text-[#7a6a4f] text-xs uppercase tracking-[0.25em] mb-2">For</p>
        <h2 className="text-2xl mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#2B2320" }}>
          {name || "you"}
        </h2>
        <p className="text-[#5c5142] italic text-sm max-w-[220px]">
          Turn the page for a note, a couple of memories, and some well-wishes.
        </p>
      </div>
    );
  }

  if (kind === "message") {
    return (
      <div className="w-full h-full flex flex-col px-7 py-8" style={{ background: "#FBF6EC" }}>
        <p className="text-[#7a6a4f] text-[10px] uppercase tracking-[0.25em] mb-2">A note for you</p>
        <div className="w-8 h-px bg-[#C9A227] mb-4" />
        <textarea
          className="no-flip flex-1 bg-transparent resize-none focus:outline-none text-[#2B2320] leading-relaxed text-[15px]"
          style={{ fontFamily: "'EB Garamond', serif" }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
    );
  }

  if (kind === "photo1" || kind === "photo2") {
    const key = kind === "photo1" ? "p1" : "p2";
    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-6 py-8" style={{ background: "#FBF6EC" }}>
        <p className="text-[#7a6a4f] text-[10px] uppercase tracking-[0.25em] mb-4">
          {kind === "photo1" ? "Memories" : "More memories"}
        </p>
        <div className="polaroid no-flip" style={{ width: "78%", transform: kind === "photo1" ? "rotate(-2deg)" : "rotate(2deg)" }}>
          <label className="block w-full aspect-square bg-[#e4d9c0] flex items-center justify-center cursor-pointer overflow-hidden">
            {photos[key] ? (
              <img src={photos[key]} alt="Memory" className="w-full h-full object-cover" />
            ) : (
              <span className="flex flex-col items-center text-[#8a7a5f] text-xs gap-1">
                <Camera size={22} />
                Add a photo
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhoto(key, e.target.files?.[0])}
            />
          </label>
        </div>
        <input
          className="no-flip mt-4 bg-transparent text-center border-b border-dotted border-[#C9A227]/60 focus:outline-none text-[#5c5142] text-sm px-2 py-1 w-[70%]"
          style={{ fontFamily: "'Caveat', cursive", fontSize: "18px" }}
          placeholder="Write a caption..."
          value={captions[key]}
          onChange={(e) => setCaptions((c) => ({ ...c, [key]: e.target.value }))}
        />
      </div>
    );
  }

  if (kind === "wishes") {
    return (
      <div className="w-full h-full flex flex-col px-7 py-8" style={{ background: "#FBF6EC" }}>
        <p className="text-[#7a6a4f] text-[10px] uppercase tracking-[0.25em] mb-3">Well-wishes</p>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {wishes.map((w, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <input
                className="no-flip wish-line flex-1 bg-transparent focus:outline-none text-[#2B2320] text-lg border-b border-[#e4d9c0]"
                style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 0.6}deg)` }}
                value={w}
                onChange={(e) => updateWish(i, e.target.value)}
                placeholder="Write a wish..."
              />
              <button
                className="no-flip opacity-0 group-hover:opacity-100 text-[#a23e48] transition"
                onClick={() => removeWish(i)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addWish}
          className="no-flip mt-3 self-start flex items-center gap-1 text-xs text-[#2F6F62] border border-[#2F6F62]/40 rounded-full px-3 py-1.5 hover:bg-[#2F6F62]/5 transition"
        >
          <Plus size={12} /> Add a wish
        </button>
      </div>
    );
  }

  return null;
}
