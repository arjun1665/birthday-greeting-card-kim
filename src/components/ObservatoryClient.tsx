"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { ContinueButton, BackToIsland } from "@/components/RealmNav";
import { useProgress } from "@/components/ProgressProvider";
import { useRealmGate } from "@/hooks/useRealmGate";

/** Star positions as % of the sky PNG (2880×1588), matched to Sagittarius / Scorpius / Libra. */
const CONSTELLATIONS = [
  {
    name: "Sagittarius",
    message: "You make people smile just by being you.",
    stars: [
      { x: 16.5, y: 42.7 },
      { x: 18.9, y: 43.1 },
      { x: 21.8, y: 33.6 },
      { x: 22.1, y: 43.3 },
      { x: 23.6, y: 58.9 },
      { x: 24.5, y: 38.0 },
      { x: 26.0, y: 35.3 },
      { x: 26.9, y: 53.1 },
      { x: 27.4, y: 29.7 },
      { x: 29.9, y: 48.4 },
      { x: 30.0, y: 38.2 },
      { x: 31.3, y: 43.1 },
      { x: 32.0, y: 54.8 },
      { x: 35.3, y: 44.3 },
      { x: 35.4, y: 32.7 },
    ],
  },
  {
    name: "Scorpius",
    message: "You make ordinary days memorable.",
    stars: [
      { x: 40.8, y: 71.7 },
      { x: 44.4, y: 83.1 },
      { x: 46.6, y: 74.1 },
      { x: 50.6, y: 65.8 },
      { x: 52.7, y: 75.9 },
      { x: 57.6, y: 42.4 },
      { x: 60.9, y: 58.0 },
      { x: 64.2, y: 55.2, accent: true }, // Antares
      { x: 65.6, y: 62.3 },
      { x: 66.3, y: 49.2 },
      { x: 67.3, y: 63.2 },
      { x: 68.6, y: 42.1 },
      { x: 69.7, y: 59.6 },
      { x: 70.9, y: 53.7 },
    ],
  },
  {
    name: "Libra",
    message: "You are stronger than you realize.",
    stars: [
      { x: 79.3, y: 35.1 },
      { x: 80.9, y: 51.4 },
      { x: 82.8, y: 42.1 },
      { x: 86.2, y: 47.7 },
      { x: 89.3, y: 60.1 },
      { x: 92.2, y: 35.2 },
    ],
  },
] as const;

const SKY_ASPECT = 2880 / 1588;

export default function ObservatoryClient() {
  useRealmGate("observatory");
  const { discoverConstellation, progress } = useProgress();

  const [panelVisible, setPanelVisible] = useState(false);
  const [constellationName, setConstellationName] = useState("");
  const [constellationMessage, setConstellationMessage] = useState("");
  const [pulseKey, setPulseKey] = useState<string | null>(null);

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
    (
      name: string,
      message: string,
      starKey: string,
      clientX: number,
      clientY: number
    ) => {
      setConstellationName(name);
      setConstellationMessage(message);
      setPanelVisible(true);
      setPulseKey(starKey);
      discoverConstellation(name);
      createStarDust(clientX, clientY);
      setTimeout(() => setPulseKey(null), 600);
    },
    [createStarDust, discoverConstellation]
  );

  return (
    <div className="text-on-background fixed inset-0 dark overflow-hidden selection:bg-secondary-container selection:text-on-secondary-container bg-[#050814]">
      {/* Wide sky map — pans horizontally on portrait so Libra stays reachable */}
      <div
        className="fixed inset-0 z-0 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          className="relative h-[100dvh] min-w-full"
          style={{ width: `max(100vw, calc(100dvh * ${SKY_ASPECT}))` }}
        >
          <Image
            src="/observatory-sky.png"
            alt="Celestial sky map showing constellations Sagittarius, Scorpius, and Libra"
            fill
            priority
            className="absolute inset-0 h-full w-full object-fill select-none pointer-events-none"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none" />

          {CONSTELLATIONS.map((c) =>
            c.stars.map((star, i) => {
              const key = `${c.name}-${i}`;
              const accent = "accent" in star && star.accent;
              const found = progress.observatoryFound.includes(c.name);
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={`${c.name} star ${i + 1}`}
                  className={`obs-star absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full touch-manipulation cursor-pointer border-0 p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-tertiary focus-visible:outline-offset-2 ${
                    pulseKey === key ? "obs-star-pulse" : ""
                  } ${found ? "obs-star-found" : ""} ${accent ? "obs-star-accent" : ""}`}
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: accent ? 22 : 16,
                    height: accent ? 22 : 16,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    discover(c.name, c.message, key, e.clientX, e.clientY);
                  }}
                />
              );
            })
          )}
        </div>
      </div>

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
          Tap the stars of Sagittarius, Scorpius, and Libra. ({progress.observatoryFound.length}/3)
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="constellation-title"
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
          <h2 id="constellation-title" className="font-headline-md text-[20px] sm:text-[24px] text-tertiary mb-3">
            {constellationName}
          </h2>
          <p className="font-body-md text-[14px] sm:text-[16px] text-on-surface/90 leading-relaxed italic">
            {constellationMessage}
          </p>

          <button
            type="button"
            className="mt-6 font-label-caps text-[12px] text-outline hover:text-primary transition-colors tracking-widest uppercase cursor-pointer relative z-10 min-h-[44px] px-4"
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
        .obs-star {
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(255, 255, 255, 0.35) 45%,
            transparent 70%
          );
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.55);
          opacity: 0.55;
          transition: opacity 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
        }
        .obs-star:hover,
        .obs-star:focus-visible {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.35);
          box-shadow: 0 0 16px rgba(233, 195, 73, 0.85);
        }
        .obs-star-accent {
          background: radial-gradient(
            circle,
            rgba(255, 180, 80, 1) 0%,
            rgba(255, 140, 40, 0.45) 50%,
            transparent 72%
          );
          box-shadow: 0 0 14px rgba(255, 154, 60, 0.75);
          opacity: 0.75;
        }
        .obs-star-found {
          opacity: 0.9;
          box-shadow: 0 0 14px rgba(233, 195, 73, 0.7);
        }
        .obs-star-pulse {
          opacity: 1 !important;
          transform: translate(-50%, -50%) scale(1.8) !important;
          box-shadow: 0 0 22px rgba(255, 224, 136, 1) !important;
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
