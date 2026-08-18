import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX, RotateCcw, Music, Trash2 } from "lucide-react";
import PageContent from "./PageContent.jsx";
import usePageTurnSound from "../hooks/usePageTurnSound.js";

const LEAF_COUNT = 3;

export default function BirthdayCardBook() {
  const [openIndex, setOpenIndex] = useState(0); // 0..LEAF_COUNT, how many leaves are flipped
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

  const touchStartX = useRef(null);

  const {
    muted,
    setMuted,
    customSoundUrl,
    customSoundName,
    customAudioRef,
    playPageTurn,
    handleCustomSound,
    clearCustomSound,
  } = usePageTurnSound();

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

  const pageCtx = {
    name,
    setName,
    message,
    setMessage,
    photos,
    captions,
    setCaptions,
    handlePhoto,
    wishes,
    updateWish,
    addWish,
    removeWish,
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(circle at 30% 20%, #2f2138 0%, #1c1420 55%, #120d15 100%)",
        fontFamily: "'EB Garamond', serif",
      }}
    >
      <div className="mb-4 flex items-center gap-3 no-flip flex-wrap justify-center">
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
            onClick={clearCustomSound}
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
                <PageContent kind={leaf.front} ctx={pageCtx} />
              </div>
              <div className="face back">
                <PageContent kind={leaf.back} ctx={pageCtx} />
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
