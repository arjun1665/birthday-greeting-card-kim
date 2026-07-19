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
    message: "The constellation represents a centaur archer from Greek mythology, aiming an arrow toward Scorpius.",
    stars: [
      { x: 13, y: 81 },
      { x: 12.7, y: 70.5 },
      { x: 4.3, y: 75 },
      { x: 2.3, y: 57.8 },
      { x: 0.65, y: 38 },
      { x: 9, y: 30 },
      { x: 18, y: 38.5 },
      { x: 19.25, y: 44 },
      { x: 29.4, y: 57.4 },
      { x: 31.3, y: 46.4 },
      { x: 24.5, y: 38 },
      { x: 30.3, y: 35 },
      { x: 35.5, y: 26.5 },
      { x: 35.3, y: 49.3 },
      { x: 41.4, y: 45.5 },
      { x: 30.6, y: 63.3 },
      { x: 21.8, y: 35.4 },
      { x: 21.8, y: 22.8 },
      { x: 19.5, y: 23.5 },
      { x: 15.5, y: 15.8 },
      { x: 14.3, y: 13 },
    ],
    connections: [
      [0, 2],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [7, 10],
      [8, 9],
      [9, 10],
      [9, 11],
      [10, 11],
      [11, 12],
      [9, 13],
      [13, 14],
      [13, 8],
      [15, 8],
      [10, 16],
      [6, 16],
      [16, 17],
      [17, 18],
      [18, 19],
      [19, 20],
    ],

  },
  {
    name: "Scorpius",
    message: "Its brilliant red heart is Antares, a massive red supergiant nearly 700 times larger than our Sun.",
    stars: [
      { x: 42, y: 69 },
      { x: 39.3, y: 72.4 },
      { x: 37.5, y: 74.1 },
      { x: 39, y: 82.3 },
      { x: 45, y: 85.4 },
      { x: 49.4, y: 86 },
      { x: 52.3, y: 77.2 },
      { x: 54.3, y: 69 },
      { x: 60.9, y: 58.0 },
      { x: 63.7, y: 55.2, accent: true }, // Antares
      { x: 72.2, y: 61.7 },
      { x: 74, y: 53.3 },
      { x: 74, y: 46 },
    ],
    connections: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [9, 11],
      [9, 12],
    ],
  },
  {
    name: "Libra",
    message: "It symbolizes the scales of justice, balance, and harmony.",
    stars: [
      { x: 79.3, y: 42 },
      { x: 86, y: 42.2 },
      { x: 95., y: 35.7 },
      { x: 98.4, y: 58.6 },
      { x: 87.5, y: 74.5 },
    ],
    connections: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
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
  const [hoveredConstellation, setHoveredConstellation] = useState<string | null>(null);

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

          {/* Connected lines for constellations */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {CONSTELLATIONS.map((c) => {
              const found = progress.observatoryFound.includes(c.name);
              const isHovered = hoveredConstellation === c.name;

              // Support user-defined connections, fallback to consecutive connection
              const connections = "connections" in c
                ? (c.connections as readonly (readonly [number, number])[])
                : c.stars.slice(0, -1).map((_, idx) => [idx, idx + 1] as const);

              return (
                <g key={`lines-${c.name}`}>
                  {connections.map(([startIdx, endIdx], i) => {
                    const star = c.stars[startIdx];
                    const nextStar = c.stars[endIdx];
                    if (!star || !nextStar) return null;
                    return (
                      <line
                        key={`line-${c.name}-${i}`}
                        x1={`${star.x}%`}
                        y1={`${star.y}%`}
                        x2={`${nextStar.x}%`}
                        y2={`${nextStar.y}%`}
                        className={`constellation-line ${found ? "line-found" : ""} ${isHovered ? "line-hovered" : ""}`}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

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
                  className={`obs-star absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full touch-manipulation cursor-pointer border-0 p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-tertiary focus-visible:outline-offset-2 ${pulseKey === key ? "obs-star-pulse" : ""
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
                  onMouseEnter={() => setHoveredConstellation(c.name)}
                  onMouseLeave={() => setHoveredConstellation(null)}
                  onFocus={() => setHoveredConstellation(c.name)}
                  onBlur={() => setHoveredConstellation(null)}
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
        className={`fixed bottom-[max(1rem,var(--safe-bottom))] left-1/2 -translate-x-1/2 z-30 w-full max-w-[min(400px,94vw)] px-3 transition-all duration-700 ${panelVisible
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
        .constellation-line {
          stroke: rgba(255, 255, 255, 0.15);
          stroke-width: 1.5;
          stroke-dasharray: 4 2;
          transition: stroke 0.4s ease, stroke-width 0.4s ease, filter 0.4s ease;
        }
        .constellation-line.line-hovered {
          stroke: rgba(233, 195, 73, 0.85);
          stroke-width: 2;
          stroke-dasharray: none;
          filter: drop-shadow(0 0 5px rgba(233, 195, 73, 0.9));
        }
        .constellation-line.line-found {
          stroke: rgba(233, 195, 73, 0.7);
          stroke-width: 2;
          stroke-dasharray: none;
          filter: drop-shadow(0 0 3px rgba(233, 195, 73, 0.6));
        }
      `}</style>
    </div>
  );
}
