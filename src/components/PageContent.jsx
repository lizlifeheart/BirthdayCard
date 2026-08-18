import React from "react";
import { Camera, Plus, X } from "lucide-react";

export default function PageContent({ kind, ctx }) {
  const {
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
  } = ctx;

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
