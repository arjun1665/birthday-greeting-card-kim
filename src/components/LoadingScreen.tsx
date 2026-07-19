"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Wait for the window to finish loading fully
    const handleLoad = () => {
      const timer = setTimeout(() => {
        setFadeOut(true);
        const removeTimer = setTimeout(() => setVisible(false), 1000);
        return () => clearTimeout(removeTimer);
      }, 1500); // 1.5 seconds minimum show time for smooth transition
      return () => clearTimeout(timer);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#121414] text-white transition-opacity duration-1000 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-live="polite"
      aria-label="Loading application"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-24 h-24 flex items-center justify-center" aria-hidden="true">
          {/* Orbital and starry premium loading animation */}
          <div className="absolute inset-0 rounded-full border border-tertiary/10 animate-[spin_6s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border border-secondary/20 border-t-secondary/60 animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-4 rounded-full border border-primary/20 border-b-primary/60 animate-[spin_1.5s_linear_infinite_reverse]" />
          {/* Pulsing center star */}
          <span
            className="material-symbols-outlined text-tertiary text-2xl animate-pulse"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
        </div>

        <p className="font-label-caps text-[12px] uppercase tracking-[0.25em] text-tertiary/80 animate-pulse mt-4">
          Preparing your little universe...
        </p>
      </div>
    </div>
  );
}
