"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ContinueButton, BackToIsland } from "@/components/RealmNav";
import { useProgress } from "@/components/ProgressProvider";
import { useRealmGate } from "@/hooks/useRealmGate";
import { STARS_TO_COMPLETE } from "@/lib/progress";

const LAKE_MEMORIES: {
  type: "photo" | "audio";
  title: string;
  caption: string;
  /** Drop files into /public/memories/ using these paths */
  src: string;
}[] = [
    {
      type: "photo",
      title: "A Calm Chaos",
      caption: "Frankly one of the first ever photo to have a place in my gallery.",
      src: "/memories/photo-1.jpg",
    },
    {
      type: "audio",
      title: "Feeble singing",
      caption: "Even your quietest melodies have a way of finding their way into people's hearts.",
      src: "/memories/audio-1.mp3",
    },
    {
      type: "photo",
      title: "kissy kisses",
      caption: "Somehow, even through a picture, your kiss carries a little magic.",
      src: "/memories/photo-2.jpg",
    },
    {
      type: "audio",
      title: "Lullaby",
      caption: "Lullaby at 3am first, later took me whole year to realise the pain in the lyrics.",
      src: "/memories/audio-2.mp3",
    },
    {
      type: "photo",
      title: "Star Lake Wish",
      caption: "Seems like a little piece of heaven that found its way to Earth.",
      src: "/memories/photo-3.jpg",
    },
  ];

export default function StarLakeClient() {
  useRealmGate("lake");
  const { ready, progress, setLakeStars } = useProgress();
  const threeContainerRef = useRef<HTMLDivElement>(null);

  const [starsCollected, setStarsCollected] = useState(0);
  const [starPositions, setStarPositions] = useState<{ id: number, startX: number, startY: number, endX: number, endY: number }[]>([]);
  const [panelVisible, setPanelVisible] = useState(false);
  const [memoryIndex, setMemoryIndex] = useState(0);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const maxStars = STARS_TO_COMPLETE;
  const starIdCounter = useRef(0);
  const starsRef = useRef(0);
  const setLakeStarsRef = useRef(setLakeStars);
  setLakeStarsRef.current = setLakeStars;

  useEffect(() => {
    if (ready) {
      starsRef.current = progress.lakeStars;
      setStarsCollected(progress.lakeStars);
    }
  }, [ready, progress.lakeStars]);

  const activeMemory = LAKE_MEMORIES[memoryIndex];

  useEffect(() => {
    setPhotoFailed(false);
    setAudioPlaying(false);
    setAudioReady(false);
    setAudioError(false);
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  }, [memoryIndex, panelVisible]);

  useEffect(() => {
    if (!panelVisible) {
      const el = audioRef.current;
      if (el) {
        el.pause();
        setAudioPlaying(false);
      }
    }
  }, [panelVisible]);

  const toggleAudio = async () => {
    const el = audioRef.current;
    if (!el || audioError) return;
    try {
      if (el.paused) {
        await el.play();
        setAudioPlaying(true);
      } else {
        el.pause();
        setAudioPlaying(false);
      }
    } catch {
      setAudioError(true);
      setAudioPlaying(false);
    }
  };

  // Three.js Boat Scene
  useEffect(() => {
    const container = threeContainerRef.current;
    if (!container || !(window as any).THREE) return;

    const THREE = (window as any).THREE;
    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffd700, 1, 50);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    const boatGroup = new THREE.Group();
    const boatCount = 5;

    function createBoat() {
      const group = new THREE.Group();
      const bodyGeo = new THREE.ConeGeometry(0.5, 1, 4);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = Math.PI;
      body.scale.set(1, 0.5, 2);
      group.add(body);

      const lanternGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.y = 0.5;
      group.add(lantern);

      return group;
    }

    for (let i = 0; i < boatCount; i++) {
      const boat = createBoat();
      boat.position.set((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10);
      boat.userData = {
        speed: 0.005 + Math.random() * 0.01,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01
      };
      // Invisible touch helper for phones
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 8, 8),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      hit.position.y = 0.2;
      boat.add(hit);
      boatGroup.add(boat);
    }
    scene.add(boatGroup);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const setPointerFromEvent = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (event: PointerEvent) => {
      setPointerFromEvent(event.clientX, event.clientY);
    };

    const onPointerDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest("a, button, #star-hud, nav")) return;

      setPointerFromEvent(event.clientX, event.clientY);
      raycaster.setFromCamera(pointer, camera);

      const meshes: any[] = [];
      boatGroup.children.forEach((group: any) => {
        if (!group.userData.collected) {
          meshes.push(...group.children);
        }
      });

      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && obj.parent !== boatGroup) {
          obj = obj.parent;
        }

        if (obj && !obj.userData.collected) {
          obj.userData.collected = true;

          const lantern = obj.children.find(
            (c: any) => c.geometry && c.geometry.type === "SphereGeometry"
          );
          if (lantern) {
            lantern.scale.set(2, 2, 2);
            setTimeout(() => {
              if (lantern) lantern.scale.set(0, 0, 0);
            }, 200);
          }

          window.dispatchEvent(
            new CustomEvent("boatClicked", {
              detail: { x: event.clientX, y: event.clientY },
            })
          );
        }
      }
    };

    const canvasEl = renderer.domElement;
    canvasEl.style.touchAction = "none";
    canvasEl.addEventListener("pointermove", onPointerMove);
    canvasEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);

    let animationFrameId: number;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      boatGroup.children.forEach((b: any) => {
        b.position.y = Math.sin(time + b.userData.phase) * 0.1;
        b.rotation.z = Math.sin(time * 0.5 + b.userData.phase) * 0.05;
        b.position.x += Math.cos(time * 0.2 + b.userData.phase) * 0.01;
        b.rotation.y += b.userData.rotSpeed;
      });

      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvasEl.removeEventListener("pointermove", onPointerMove);
      canvasEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const handleBoatClickedEvent = (e: any) => {
      handleBoatClick(e.detail.x, e.detail.y);
    };
    window.addEventListener('boatClicked', handleBoatClickedEvent);
    return () => window.removeEventListener('boatClicked', handleBoatClickedEvent);
  }, [starsCollected]);

  const handleBoatClick = (clientX: number, clientY: number) => {
    if (starsCollected >= maxStars) return;

    const hudEl = document.getElementById('star-hud');
    if (!hudEl) return;

    const startX = clientX;
    const startY = clientY;

    const hudRect = hudEl.getBoundingClientRect();
    const endX = hudRect.left + (hudRect.width / 2);
    const endY = hudRect.top + (hudRect.height / 2);

    const id = starIdCounter.current++;
    const nextMemory = Math.min(starsCollected, LAKE_MEMORIES.length - 1);
    setMemoryIndex(nextMemory);
    setPanelVisible(true);
    setStarPositions(prev => [...prev, { id, startX, startY, endX, endY }]);

    setTimeout(() => {
      const next = Math.min(starsRef.current + 1, maxStars);
      starsRef.current = next;
      setStarsCollected(next);
      setLakeStarsRef.current(next);
      setStarPositions(prev => prev.filter(p => p.id !== id));

      hudEl.classList.add('scale-110', 'bg-tertiary-fixed/10');
      setTimeout(() => {
        hudEl.classList.remove('scale-110', 'bg-tertiary-fixed/10');
      }, 200);
    }, 1000);
  };

  return (
    <div className="bg-background text-on-background overflow-hidden fixed inset-0 m-0 p-0 selection:bg-tertiary-fixed-dim/30 dark">
      {/* Starfield background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/lake-sky.png"
          alt="Dreamy star-filled sky over lake"
          fill
          priority
          className="object-cover object-center select-none"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20" />
      </div>

      {/* Foreground 3D Scene Layer (Boats) */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        <div ref={threeContainerRef} className="absolute inset-0 w-full h-full pointer-events-auto" />
      </div>

      {/* UI Layer */}
      <div className="relative z-20 w-full h-full flex flex-col pointer-events-none">

        <header className="w-full flex items-start justify-between gap-2 p-margin-mobile md:p-margin-desktop pt-[max(1.25rem,var(--safe-top))] px-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))] pointer-events-auto">
          <BackToIsland className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full glass-panel hover:bg-white/5 transition-colors duration-300 text-on-surface-variant hover:text-on-surface" />
          <ContinueButton
            fromRealm="lake"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full glass-panel hover:bg-white/5 transition-colors duration-300 text-on-surface-variant hover:text-on-surface"
          />
        </header>

        <main className="flex-grow flex flex-col items-center justify-start sm:justify-center text-center px-gutter pt-2 sm:pt-0 pointer-events-none">
          <div className="lake-title-panel p-4 sm:p-8 md:p-12 rounded-2xl sm:rounded-[32px] max-w-2xl floating-element border border-white/10">
            <h1 className="font-display-story text-[clamp(1.5rem,5vw,48px)] text-on-surface mb-2 sm:mb-4 tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              Star-filled Reflections
            </h1>
            <p className="font-body-lg text-[14px] sm:text-[18px] text-on-surface-variant max-w-md mx-auto leading-relaxed">
              Touch the floating memories to gather the starlight.
            </p>
          </div>
        </main>

        <footer className="w-full flex justify-center items-center p-margin-mobile md:p-margin-desktop pb-[max(1rem,var(--safe-bottom))] pointer-events-auto">
          <div className="flex items-center gap-3 px-6 py-3 rounded-full glass-panel shadow-[0_0_20px_rgba(233,195,73,0.1)] relative transition-all duration-200" id="star-hud">
            <span className="material-symbols-outlined text-tertiary-fixed-dim drop-shadow-[0_0_8px_rgba(233,195,73,0.6)]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display-story text-[24px] text-tertiary-fixed">{starsCollected}</span>
              <span className="font-label-caps text-[12px] text-on-surface-variant">/5</span>
            </div>
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_rgba(233,195,73,0.2)] pointer-events-none"></div>
          </div>
        </footer>
      </div>

      {/* Memory panel — 3 photos + 2 audio */}
      <div
        className={`fixed bottom-[max(5.5rem,calc(var(--safe-bottom)+4.5rem))] left-1/2 -translate-x-1/2 z-40 w-full max-w-[min(400px,94vw)] px-3 transition-all duration-700 ${panelVisible
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none translate-y-5"
          }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="memory-title"
      >
        <div className="glass-panel rounded-2xl p-5 sm:p-7 text-center relative overflow-hidden border border-tertiary/15">
          {activeMemory?.type === "photo" ? (
            <div className="mx-auto mb-4 w-full max-w-[240px] aspect-[4/3] rounded-xl border border-dashed border-white/25 bg-white/5 overflow-hidden relative">
              {!photoFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={activeMemory.src}
                  src={activeMemory.src}
                  alt={`Memory photo of ${activeMemory.title}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3">
                  <span className="material-symbols-outlined text-tertiary text-3xl opacity-80">
                    photo_camera
                  </span>
                  <span className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant/70">
                    Add photo-{(memoryIndex === 0 ? 1 : memoryIndex === 2 ? 2 : 3)}.jpg
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="mx-auto mb-4 w-full max-w-[280px] rounded-xl border border-white/15 bg-white/5 p-4 sm:p-5 flex flex-col items-center gap-3">
              <span
                className="material-symbols-outlined text-tertiary text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                music_note
              </span>
              <button
                type="button"
                onClick={toggleAudio}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-full bg-tertiary/15 border border-tertiary/30 text-tertiary touch-manipulation active:scale-95 transition-transform"
                aria-label={audioPlaying ? "Pause audio note" : "Play audio note"}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {audioPlaying ? "pause" : "play_arrow"}
                </span>
                <span className="font-label-caps text-[11px] uppercase tracking-widest">
                  {audioError ? "Add audio file" : audioPlaying ? "Pause" : "Play"}
                </span>
              </button>
              {audioError && (
                <span className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant/70">
                  Drop audio-{(memoryIndex === 1 ? 1 : 2)}.mp3 in /public/memories
                </span>
              )}
              {audioReady && !audioError && (
                <span className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant/60">
                  {audioPlaying ? "Playing…" : "Ready"}
                </span>
              )}
              <audio
                ref={audioRef}
                src={activeMemory?.src}
                preload="metadata"
                playsInline
                onCanPlay={() => {
                  setAudioReady(true);
                  setAudioError(false);
                }}
                onError={() => {
                  setAudioError(true);
                  setAudioReady(false);
                  setAudioPlaying(false);
                }}
                onEnded={() => setAudioPlaying(false)}
                onPause={() => setAudioPlaying(false)}
                onPlay={() => setAudioPlaying(true)}
              />
            </div>
          )}

          <h2 id="memory-title" className="font-headline-md text-[20px] sm:text-[24px] text-tertiary mb-2">
            {activeMemory?.title}
          </h2>
          <p className="font-body-md text-[14px] sm:text-[16px] text-on-surface/90 leading-relaxed italic mb-4 px-1">
            {activeMemory?.caption}
          </p>
          <button
            type="button"
            className="font-label-caps text-[12px] text-outline hover:text-primary transition-colors tracking-widest uppercase cursor-pointer min-h-[44px] px-4 touch-manipulation"
            onClick={() => {
              const el = audioRef.current;
              if (el) el.pause();
              setAudioPlaying(false);
              setPanelVisible(false);
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Star Flying Animations */}
      {starPositions.map(star => (
        <span
          key={star.id}
          className="material-symbols-outlined star-fly-animation"
          style={{
            left: star.startX,
            top: star.startY,
            transform: `translate(${star.endX - star.startX}px, ${star.endY - star.startY}px) scale(0.5) rotate(360deg)`,
            opacity: 0,
            fontVariationSettings: "'FILL' 1"
          }}
        >
          stars
        </span>
      ))}

      <style jsx global>{`
        @keyframes gentle-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .lake-title-panel {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
}
