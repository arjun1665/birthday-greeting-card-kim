"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ContinueButton, BackToIsland } from "@/components/RealmNav";
import { useProgress } from "@/components/ProgressProvider";
import { useRealmGate } from "@/hooks/useRealmGate";
import { STARS_TO_COMPLETE } from "@/lib/progress";

const COMPLIMENTS = [
  "You make ordinary days memorable.",
  "You make people smile.",
  "Your presence brings peace.",
  "You have a gentle spirit.",
  "Your kindness radiates like starlight.",
  "You are a quiet kind of wonderful.",
  "The world is softer with you in it.",
  "You have a way of making people feel seen.",
  "You leave little bits of happiness wherever you go.",
  "Your smile has a way of brightening even the longest days.",
  "You make life feel a little lighter.",
  "You carry warmth without even trying.",
  "Your heart is one of your greatest strengths.",
  "You inspire kindness simply by being yourself.",
  "You turn simple moments into beautiful memories.",
  "You have a calm that makes everything feel okay.",
  "You remind people that goodness still exists.",
  "Your laughter is the kind people never forget.",
  "You have an effortless way of making others feel welcome.",
  "You make the people around you better.",
  "You bring comfort without saying a word.",
  "You have a beautiful way of caring for others.",
  "Your optimism is quietly contagious.",
  "You make the ordinary feel extraordinary.",
  "You have a light that doesn't ask for attention, yet everyone notices.",
  "You make every conversation worth having.",
  "You have a soul that feels like home.",
];

export default function AncientTreeClient() {
  useRealmGate("tree");
  const { ready, progress, setTreeStars } = useProgress();
  const [starsCollected, setStarsCollected] = useState(0);
  const maxStars = STARS_TO_COMPLETE;
  const starsRef = useRef(0);
  const setTreeStarsRef = useRef(setTreeStars);
  setTreeStarsRef.current = setTreeStars;

  useEffect(() => {
    if (ready) {
      starsRef.current = progress.treeStars;
      setStarsCollected(progress.treeStars);
    }
  }, [ready, progress.treeStars]);

  useEffect(() => {
    const container = document.getElementById("petal-container");
    if (!container) return;

    let activePetals = 0;
    let disposed = false;

    function createPetal() {
      if (disposed || !container) return;
      activePetals++;
      const petal = document.createElement("button");
      petal.type = "button";
      petal.className = "interactive-petal";
      petal.setAttribute("aria-label", "Catch a falling petal");

      const startX = Math.random() * Math.max(window.innerWidth - 56, 0);
      const duration = 18 + Math.random() * 12;
      const delay = Math.random() * 2;
      const drift = (Math.random() - 0.5) * 80;

      petal.style.left = `${startX}px`;
      petal.style.setProperty("--drift", `${drift}px`);
      petal.style.animation = `float-down ${duration}s linear ${delay}s infinite`;

      const collectPetal = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (petal.dataset.collected === "true") return;
        petal.dataset.collected = "true";

        petal.style.animationPlayState = "paused";
        petal.classList.add("petal-collected");
        petal.style.pointerEvents = "none";

        const next = Math.min(starsRef.current + 1, maxStars);
        starsRef.current = next;
        setStarsCollected(next);
        setTreeStarsRef.current(next);

        const point =
          "touches" in e && e.touches[0]
            ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
            : { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };

        const textEl = document.createElement("div");
        textEl.className =
          "compliment-reveal font-headline-md text-[16px] sm:text-[24px] text-secondary";
        textEl.style.left = `${Math.min(Math.max(point.x, 24), window.innerWidth - 24)}px`;
        textEl.style.top = `${Math.min(Math.max(point.y, 48), window.innerHeight - 48)}px`;
        textEl.style.maxWidth = "min(90vw, 22rem)";
        textEl.style.whiteSpace = "normal";
        textEl.style.textAlign = "center";
        textEl.style.padding = "0 0.5rem";

        const complimentText = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
        textEl.innerText = complimentText;

        document.body.appendChild(textEl);

        void textEl.offsetWidth;
        textEl.classList.add("compliment-active");

        setTimeout(() => {
          textEl.style.opacity = "0";
          setTimeout(() => textEl.remove(), 1000);
          petal.remove();
          activePetals--;
        }, 4000);
      };

      petal.addEventListener("pointerdown", collectPetal);

      petal.addEventListener("animationiteration", () => {
        if (petal.dataset.collected !== "true") {
          petal.style.left = `${Math.random() * Math.max(window.innerWidth - 56, 0)}px`;
        }
      });

      container.appendChild(petal);
    }

    for (let i = 0; i < 10; i++) {
      createPetal();
    }

    const intervalId = setInterval(() => {
      if (activePetals < 14) {
        createPetal();
      }
    }, 2500);

    return () => {
      disposed = true;
      clearInterval(intervalId);
      container.innerHTML = "";
    };
  }, [maxStars]);

  return (
    <div className="bg-primary-container fixed inset-0 overflow-hidden text-on-surface select-none dark selection:bg-secondary-container selection:text-on-secondary-container">
      <div className="absolute inset-0 w-full h-full z-0 opacity-60 mix-blend-screen pointer-events-none">
        <Image
          src="/tree-bg.png"
          alt="Glowing ancient tree in starlight background"
          fill
          priority
          className="object-cover object-center select-none"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-transparent to-transparent z-10 pointer-events-none"></div>

      <div className="absolute inset-0 z-30 overflow-hidden" id="petal-container"></div>

      <div className="relative z-40 w-full h-full flex flex-col justify-between p-margin-mobile md:p-margin-desktop pt-[max(1rem,var(--safe-top))] pb-[max(1rem,var(--safe-bottom))] px-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))] pointer-events-none">
        <header className="flex justify-between items-start gap-2">
          <div className="pointer-events-auto">
            <BackToIsland className="glass-panel flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full text-secondary hover:text-tertiary transition-colors duration-500" />
          </div>
          <div className="pointer-events-auto">
            <ContinueButton
              fromRealm="tree"
              className="glass-panel flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full text-secondary hover:text-tertiary transition-colors duration-500"
            />
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center pointer-events-none text-center gap-3 sm:gap-6 px-2">
          <h1 className="font-display-story text-[clamp(1.5rem,6vw,3rem)] text-primary drop-shadow-[0_0_15px_rgba(193,198,220,0.3)] tracking-tight">
            Ancient Tree
          </h1>
          <p className="font-body-lg text-[14px] sm:text-[18px] text-on-surface-variant max-w-md opacity-80 px-2">
            Catch a falling petal to reveal a quiet truth.
          </p>
        </main>

        <footer className="flex flex-col items-center gap-3 sm:gap-4 pointer-events-auto">
          <div className="glass-panel flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full pointer-events-auto">
            <span
              className="material-symbols-outlined text-tertiary star-glow"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className="font-label-caps text-[11px] sm:text-[12px] uppercase text-tertiary tracking-widest">
              {starsCollected} / {maxStars} Stars Collected
            </span>
          </div>
          <span className="font-label-caps text-[11px] sm:text-[12px] tracking-widest text-on-surface-variant uppercase opacity-50 pointer-events-none hidden sm:inline">
            The Floating Realms
          </span>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes float-down {
          0% {
            transform: translate3d(0, -10vh, 0);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          92% {
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--drift, 20px), 110vh, 0);
            opacity: 0;
          }
        }
        .interactive-petal {
          position: absolute;
          top: 0;
          width: 56px;
          height: 56px;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          z-index: 30;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .interactive-petal::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 28px;
          height: 28px;
          margin-left: -14px;
          margin-top: -14px;
          background-color: rgba(210, 187, 255, 0.55);
          border-radius: 0 50% 50% 50%;
          transform: rotate(45deg);
          box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.5),
            0 0 14px rgba(210, 187, 255, 0.45);
          transition: box-shadow 0.25s ease, background-color 0.25s ease,
            filter 0.25s ease;
          pointer-events: none;
        }
        .interactive-petal:hover::before,
        .interactive-petal:focus-visible::before {
          background-color: rgba(210, 187, 255, 0.85);
          box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.85),
            0 0 22px rgba(210, 187, 255, 0.7);
          filter: brightness(1.15);
        }
        .interactive-petal.petal-collected::before {
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .compliment-reveal {
          position: fixed;
          transform: translate(-50%, -50%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 1s ease-in-out, transform 1s ease-out;
          z-index: 60;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(210, 187, 255, 0.4);
        }
        .compliment-active {
          opacity: 1;
          transform: translate(-50%, -100%);
        }
        .star-glow {
          filter: drop-shadow(0 0 8px rgba(233, 195, 73, 0.8));
        }
      `}</style>
    </div>
  );
}
