"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BackToIsland } from "@/components/RealmNav";
import { useProgress } from "@/components/ProgressProvider";
import { useRealmGate } from "@/hooks/useRealmGate";
import { getPixelRatioCap, useLiteGraphics } from "@/hooks/useViewport";

export default function FinaleClient() {
  const { ready, allowed } = useRealmGate("finale");
  const { progress, completeFinale } = useProgress();
  const lite = useLiteGraphics();
  const [isOpened, setIsOpened] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const threeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ready && progress.finaleComplete) {
      setIsOpened(true);
      setShowMessage(true);
    }
  }, [ready, progress.finaleComplete]);

  useEffect(() => {
    const starfield = document.getElementById("starfield");
    if (starfield) {
      const numStars = lite ? 36 : 80;
      for (let i = 0; i < numStars; i++) {
        const star = document.createElement("div");
        star.classList.add("star");

        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;

        const size = Math.random() * 3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;

        star.style.setProperty("--duration", `${2 + Math.random() * 4}s`);
        star.style.animationDelay = `${Math.random() * 2}s`;

        const colors = ["#ffffff", "#dde2f9", "#ffe088"];
        star.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        starfield.appendChild(star);
      }
    }

    return () => {
      if (starfield) starfield.innerHTML = "";
    };
  }, [lite]);

  // Three.js Giant Present Scene
  useEffect(() => {
    const container = threeContainerRef.current;
    if (!container || !(window as any).THREE) return;

    const THREE = (window as any).THREE;
    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(getPixelRatioCap(lite));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const spotLight = new THREE.SpotLight(0xffd700, 2);
    spotLight.position.set(5, 10, 5);
    scene.add(spotLight);

    const giftGroup = new THREE.Group();

    const boxGeo = new THREE.BoxGeometry(3, 3, 3);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x4b0082 }); // Indigo
    const box = new THREE.Mesh(boxGeo, boxMat);
    giftGroup.add(box);

    const ribbonGeo = new THREE.BoxGeometry(3.1, 0.5, 3.1);
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xffd700 }); // Gold
    const ribbonH = new THREE.Mesh(ribbonGeo, ribbonMat);
    const ribbonV = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonV.rotation.y = Math.PI / 2;
    giftGroup.add(ribbonH, ribbonV);

    scene.add(giftGroup);

    const particleCount = lite ? 80 : 200;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 15;
      colors[i] = Math.random();
    }
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMaterial = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, opacity: 0.8 });
    const points = new THREE.Points(particles, pMaterial);
    scene.add(points);

    let animationFrameId: number;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      giftGroup.rotation.y += 0.01;
      giftGroup.position.y = Math.sin(Date.now() * 0.002) * 0.2;
      points.rotation.y -= 0.002;
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(getPixelRatioCap(lite));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lite]);

  const createFireworks = (x: number, y: number) => {
    const colors = ['#e9c349', '#ffe088', '#ffffff'];
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.classList.add('firework');
      document.body.appendChild(particle);

      const angle = Math.random() * Math.PI * 2;
      const velocity = 100 + Math.random() * 200;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;

      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

      particle.animate([
        { transform: `translate(0, 0) scale(1)`, opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
      ], {
        duration: 1000 + Math.random() * 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      });

      setTimeout(() => particle.remove(), 2000);
    }
  };

  const handleOpenPresent = (e: React.MouseEvent | React.PointerEvent) => {
    if (isOpened || !allowed) return;
    e.preventDefault();
    e.stopPropagation();
    setIsOpened(true);
    completeFinale();
    createFireworks(e.clientX, e.clientY);
    setTimeout(() => {
      setShowMessage(true);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-surface flex flex-col dark selection:bg-secondary-container selection:text-on-secondary-container">
      <div className="absolute inset-0 z-0 pointer-events-none" id="starfield"></div>

      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center gap-3 pt-[max(1rem,var(--safe-top))] px-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))] py-4 bg-transparent pointer-events-none">
        <div className={`pointer-events-auto transition-opacity duration-500 ${isOpened ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <BackToIsland className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full glass-panel text-on-surface-variant hover:text-tertiary transition-colors" />
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 font-display-story text-[clamp(1.25rem,3.5vw,2.5rem)] text-primary tracking-tight truncate pointer-events-none">
          Astra for Kim
        </span>
        <span
          className="material-symbols-outlined text-tertiary text-[22px] sm:text-[28px] shrink-0 pointer-events-none"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          redeem
        </span>
      </header>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-4 sm:px-margin-desktop pt-[max(5rem,calc(var(--safe-top)+4rem))] pb-[max(1.5rem,var(--safe-bottom))] h-full overflow-hidden">
        <div
          className={`relative w-full max-w-4xl aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] max-h-[min(58dvh,520px)] rounded-2xl sm:rounded-3xl overflow-hidden glass-panel flex items-center justify-center present-container z-20 shadow-[0_0_50px_rgba(233,195,73,0.1)] ${isOpened ? "pointer-events-none" : "cursor-pointer"
            }`}
          onPointerDown={handleOpenPresent}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleOpenPresent(e as unknown as React.MouseEvent);
            }
          }}
          role="button"
          tabIndex={isOpened ? -1 : 0}
          aria-label="Open your final gift present"
        >
          <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
            <div ref={threeContainerRef} className="absolute inset-0 w-full h-full" />
          </div>

          <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/40 backdrop-blur-sm transition-opacity duration-1000 px-4 pointer-events-none ${isOpened ? "opacity-0" : "opacity-100"
              }`}
          >
            <span
              className="material-symbols-outlined text-5xl sm:text-6xl text-tertiary mb-4 sm:mb-6 animate-pulse"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              redeem
            </span>
            <h1 className="font-display-story text-[clamp(1.75rem,5vw,4rem)] text-on-surface text-center max-w-2xl glow-text">
              The Journey Concludes
            </h1>
            <p className="font-body-lg text-[15px] sm:text-[18px] text-on-surface-variant mt-3 sm:mt-4 opacity-80 text-center">
              Tap to open your final gift.
            </p>
          </div>
        </div>

        <div
          className={`message-reveal absolute inset-0 z-40 flex flex-col items-center justify-center w-full p-4 sm:p-8 ${showMessage ? "active pointer-events-auto" : "pointer-events-none"
            }`}
          role="dialog"
          aria-modal="true"
          aria-hidden={!showMessage}
          aria-labelledby="birthday-heading"
        >
          <div className="glass-panel p-6 sm:p-10 rounded-2xl sm:rounded-3xl text-center shadow-[0_0_100px_rgba(233,195,73,0.2)] border border-tertiary/20 flex flex-col items-center max-w-2xl max-h-[min(85dvh,720px)] overflow-y-auto hide-scrollbar">
            <h2 id="birthday-heading" className="font-display-story text-[clamp(1.75rem,5vw,3.5rem)] text-tertiary glow-text mb-4 sm:mb-6">
              Happy Birthday, Kim.
            </h2>
            <p className="font-body-lg text-[13px] sm:text-[15px] text-on-surface-variant leading-relaxed mb-6 sm:mb-8">
              There are people who pass through our lives like seasons, and then there are those who quietly become a part of it so naturally that it's hard to imagine life without them. You're one of those people.
              <br /><br />

              Thank you for being the kind of person who makes ordinary conversations feel meaningful, ordinary days feel lighter, and ordinary moments worth remembering. Your kindness has a way of reaching people even across the country, and that's something truly special.
              <br /><br />

              I hope this year brings you everything you deserve, new adventures to explore, dreams worth chasing, and countless little moments that make you stop and smile. I hope you continue to find happiness in the simplest things, and that life is as gentle with you as you've been with the people around you.
              <br /><br />

              No matter where life takes you, I hope you never lose the parts of yourself that make you who you are your warmth, your curiosity, your quiet strength, and the way you make people feel comfortable just by being yourself.
              <br /><br />

              If this website managed to make you smile, even for a moment, then everything I did was completely worth it.
              <br /><br />

              Because some people deserve more than just a simple "Happy Birthday." They deserve something created with time, patience, and care.
              <br /><br />

              Happy Birthday, Kim.
              <br /><br />

              May this year bring you more joy than you expect, more memories than you can count, and more reasons to smile than ever before.
            </p>
            <Link
              href="/?island=true"
              className={`group relative z-50 flex items-center justify-center px-8 py-3 rounded-full bg-surface-container border border-white/10 hover:border-tertiary/50 transition-all duration-500 ${showMessage
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
                }`}
              tabIndex={showMessage ? 0 : -1}
              aria-hidden={!showMessage}
            >
              <span className="font-label-caps text-[12px] text-on-surface tracking-widest uppercase group-hover:text-tertiary transition-colors">
                Return to Island
              </span>
            </Link>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .star {
            position: absolute;
            background-color: white;
            border-radius: 50%;
            opacity: 0;
            animation: twinkle var(--duration, 4s) infinite ease-in-out;
            box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
        }
        @keyframes twinkle {
            0%, 100% { opacity: 0.1; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
        }
        .message-reveal {
            opacity: 0;
            transform: translateY(20px);
            transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .message-reveal.active {
            opacity: 1;
            transform: translateY(0);
        }
        .firework {
            position: absolute;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #e9c349;
            animation: explode 1s ease-out forwards;
            pointer-events: none;
        }
        @keyframes explode {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0); opacity: 0; }
        }
        .present-container {
            transition: transform 0.3s ease;
        }
        @media (hover: hover) and (pointer: fine) {
          .present-container:hover {
              transform: scale(1.02);
          }
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
}
