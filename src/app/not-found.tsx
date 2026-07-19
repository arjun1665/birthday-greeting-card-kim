"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotFound() {
  const [stars, setStars] = useState<{ id: number; left: string; top: string; size: string; duration: string; delay: string }[]>([]);

  useEffect(() => {
    const generatedStars = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 2}s`,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#121414] flex flex-col justify-center items-center text-center p-6 text-on-surface dark">
      {/* Starfield Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full opacity-60"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animation: `twinkle ${star.duration} infinite ease-in-out`,
              animationDelay: star.delay,
              boxShadow: "0 0 4px rgba(255, 255, 255, 0.8)",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md flex flex-col items-center">
        <span className="material-symbols-outlined text-[64px] text-tertiary mb-6 animate-pulse" style={{ fontVariationSettings: "'FILL' 0" }}>
          explore_off
        </span>
        <h1 className="font-display-story text-[32px] sm:text-[40px] text-tertiary mb-4 leading-tight glow-text">
          404 - Lost in Space
        </h1>
        <p className="font-body-lg text-[16px] sm:text-[18px] text-on-surface-variant mb-10 max-w-sm leading-relaxed">
          Looks like this star wandered off...
        </p>
        <Link
          href="/"
          className="group relative flex items-center justify-center px-8 py-3 rounded-full bg-gradient-to-r from-secondary-container/80 to-primary-container/80 backdrop-blur-md border border-white/10 overflow-hidden transition-all duration-700 hover:scale-105 pulse-ring"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-tertiary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-overlay"></div>
          <span className="font-label-caps text-[12px] text-tertiary tracking-widest uppercase relative z-10">
            Back to Home
          </span>
        </Link>
      </div>

      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
