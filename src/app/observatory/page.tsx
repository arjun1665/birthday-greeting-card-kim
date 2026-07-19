"use client";

import { useCallback, useRef, useState } from "react";
import { ContinueButton, BackToIsland } from "@/components/RealmNav";
import { useProgress } from "@/components/ProgressProvider";
import { useRealmGate } from "@/hooks/useRealmGate";

const CONSTELLATIONS = [
  {
    name: "Sagittarius",
    message: "You make people smile just by being you.",
    /** Approximate region on the wide sky map (percent of map width/height) */
    style: {
      left: "8%",
      top: "18%",
      width: "28%",
      height: "42%",
    },
  },
  {
    name: "Scorpius",
    message: "You make ordinary days memorable.",
    style: {
      left: "38%",
      top: "28%",
      width: "32%",
      height: "52%",
    },
  },
  {
    name: "Libra",
    message: "You are stronger than you realize.",
    style: {
      left: "72%",
      top: "22%",
      width: "24%",
      height: "40%",
    },
  },
] as const;

export default function Observatory() {
  useRealmGate("observatory");
  const { discoverConstellation, progress } = useProgress();
  const skyScrollRef = useRef<HTMLDivElement>(null);

  const [panelVisible, setPanelVisible] = useState(false);
  const [constellationName, setConstellationName] = useState("");
  const [constellationMessage, setConstellationMessage] = useState("");

  const createStarDust = useCallback((x: number, y: number) => {
    for (let i = 0; i < 10; i++) {
      const dust = document.createElement("div");
      dust.className = "star-dust";
      dust.style.left = `${x + (Math.random() * 40 - 20)}px`;
      dust.style.top = `${y + (Math.random() * 40 - 20)}px`;
      dust.style.animationDelay = `${Math.random() * 2}s`;
      document.body.appendChild(dust);
      setTimeout(() => dust.remove(), 3000);
    }
  }, []);

  const discover = useCallback(
    (name: string, message: string, clientX: number, clientY: number) => {
      setConstellationName(name);
      setConstellationMessage(message);
      setPanelVisible(true);
      discoverConstellation(name);
      createStarDust(clientX, clientY);
    },
    [createStarDust, discoverConstellation]
  );

  return (
    <div className="text-on-background fixed inset-0 dark overflow-hidden selection:bg-secondary-container selection:text-on-secondary-container bg-[#050814]">
      {/* Wide sky map — pans horizontally on portrait so Libra stays reachable */}
      <div
        ref={skyScrollRef}
        className="fixed inset-0 z-0 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          className="relative h-[100dvh] min-w-full"
          style={{ width: "max(100vw, calc(100dvh * 1.85))" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/observatory-sky.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center select-none pointer-events-none"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45 pointer-events-none" />

          {CONSTELLATIONS.map((c) => (
            <button
              key={c.name}
              type="button"
              aria-label={`Discover ${c.name}`}
              className="absolute z-10 rounded-full border border-transparent bg-transparent cursor-crosshair touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-tertiary/70 focus-visible:outline-offset-2 hover:bg-white/[0.03] active:bg-tertiary/10 transition-colors"
              style={c.style}
              onClick={(e) =>
                discover(c.name, c.message, e.clientX, e.clientY)
              }
            />
          ))}
        </div>
      </div>

      {/* Top Navigation */}
      <div className="fixed top-0 left-0 w-full z-40 flex items-start justify-between gap-2 pt-[max(1rem,var(--safe-top))] px-[max(0.75rem,var(--safe-left))] pr-[max(0.75rem,var(--safe-right))] pointer-events-none">
        <div className="pointer-events-auto">
          <BackToIsland className="glow-button flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full border border-white/20 bg-surface/10 backdrop-blur-md text-primary font-label-caps uppercase" />
        </div>
        <div className="pointer-events-auto">
          <ContinueButton
            fromRealm="observatory"
            className="glow-button flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full border border-white/20 bg-surface/10 backdrop-blur-md text-primary font-label-caps uppercase"
          />
        </div>
      </div>

      <div className="fixed top-[max(4.25rem,calc(var(--safe-top)+3.25rem))] left-0 w-full z-20 pointer-events-none text-center px-gutter safe-x">
        <h1 className="font-display-story text-[clamp(1.25rem,4vw,3rem)] text-on-surface mb-1 sm:mb-2 tracking-[0.12em] sm:tracking-[0.2em] font-light drop-shadow-[0_0_15px_rgba(255,255,255,0.45)]">
          Kim&apos;s Observatory
        </h1>
        <p className="font-body-md text-[13px] sm:text-[16px] text-secondary/90 font-light tracking-wider px-2 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
          Discover Sagittarius, Scorpius, and Libra. ({progress.observatoryFound.length}/3)
        </p>
        <p className="mt-1 font-label-caps text-[10px] sm:text-[11px] uppercase tracking-widest text-on-surface-variant/70 sm:hidden">
          Swipe to explore the sky
        </p>
      </div>

      <div
        className={`fixed bottom-[max(1rem,var(--safe-bottom))] left-1/2 -translate-x-1/2 z-30 w-full max-w-[min(400px,94vw)] px-3 transition-all duration-700 ${
          panelVisible
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none translate-y-5"
        }`}
      >
        <div className="glass-panel rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute top-4 left-4 w-1 h-1 bg-tertiary rounded-full shadow-[0_0_8px_rgba(233,195,73,0.8)]" />
          <div className="absolute top-4 right-4 w-1 h-1 bg-tertiary rounded-full shadow-[0_0_8px_rgba(233,195,73,0.8)]" />
          <div className="absolute bottom-4 left-4 w-1 h-1 bg-tertiary rounded-full shadow-[0_0_8px_rgba(233,195,73,0.8)]" />
          <div className="absolute bottom-4 right-4 w-1 h-1 bg-tertiary rounded-full shadow-[0_0_8px_rgba(233,195,73,0.8)]" />

          <span
            className="material-symbols-outlined text-secondary text-4xl mb-4 opacity-80"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            auto_awesome
          </span>
          <h2 className="font-headline-md text-[20px] sm:text-[24px] text-tertiary mb-3">
            {constellationName}
          </h2>
          <p className="font-body-md text-[14px] sm:text-[16px] text-on-surface/90 leading-relaxed italic">
            {constellationMessage}
          </p>

          <button
            type="button"
            className="mt-6 font-label-caps text-[12px] text-outline hover:text-primary transition-colors tracking-widest uppercase cursor-pointer relative z-10"
            onClick={() => setPanelVisible(false)}
          >
            Close
          </button>
        </div>
      </div>

      <style jsx global>{`
        .glow-button {
          transition: all 0.5s ease;
        }
        .glow-button:hover {
          box-shadow: inset 0 0 20px rgba(210, 187, 255, 0.5);
          border-color: rgba(210, 187, 255, 0.8);
        }
        .star-dust {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          pointer-events: none;
          animation: float 3s linear infinite, fade 3s ease-in-out infinite;
          z-index: 50;
        }
        @keyframes float {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50px);
          }
        }
        @keyframes fade {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
