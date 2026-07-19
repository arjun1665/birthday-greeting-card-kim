"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/components/ProgressProvider";
import { ResetJourneyButton } from "@/components/ResetJourneyButton";
import { getPixelRatioCap, useLiteGraphics } from "@/hooks/useViewport";
import type { RealmId } from "@/lib/progress";
import { REALM_PATHS } from "@/lib/progress";

const DESTINATIONS: {
  id: RealmId;
  href: string;
  label: string;
  icon: string;
  position: string;
  delayClass: string;
}[] = [
  {
    id: "cottage",
    href: REALM_PATHS.cottage,
    label: "Cottage",
    icon: "home_pin",
    position: "top-[30%] left-[16%] sm:top-[32%] sm:left-[26%] md:left-[32%]",
    delayClass: "float",
  },
  {
    id: "observatory",
    href: REALM_PATHS.observatory,
    label: "Observatory",
    icon: "visibility",
    position: "top-[20%] right-[14%] sm:top-[22%] sm:right-[26%] md:right-[32%]",
    delayClass: "float-delayed-1",
  },
  {
    id: "tree",
    href: REALM_PATHS.tree,
    label: "Ancient Tree",
    icon: "park",
    position: "bottom-[30%] left-[12%] sm:bottom-[34%] sm:left-[22%] md:left-[28%]",
    delayClass: "float-delayed-2",
  },
  {
    id: "lake",
    href: REALM_PATHS.lake,
    label: "Star Lake",
    icon: "water",
    position: "top-[54%] right-[12%] sm:top-[52%] sm:right-[20%] md:right-[24%]",
    delayClass: "float-delayed-3",
  },
  {
    id: "finale",
    href: REALM_PATHS.finale,
    label: "Giant Present",
    icon: "redeem",
    position: "bottom-[22%] right-[16%] sm:bottom-[26%] sm:right-[22%] md:right-[28%]",
    delayClass: "float-delayed-3",
  },
];

export default function Home() {
  const [activeScreen, setActiveScreen] = useState(1);
  const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const { ready, isUnlocked, isComplete } = useProgress();
  const lite = useLiteGraphics();
  const journeyComplete = ready && isComplete("finale");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("island=true")) {
      setActiveScreen(2);
    }
  }, []);

  // Background Shader
  useEffect(() => {
    const canvas = shaderCanvasRef.current;
    if (!canvas) return;

    function syncSize() {
      const w = canvas?.clientWidth || window.innerWidth;
      const h = canvas?.clientHeight || window.innerHeight;
      if (canvas && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    const resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(canvas);
    syncSize();

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    
    vec3 color = mix(vec3(0.043, 0.067, 0.129), vec3(0.02, 0.02, 0.05), uv.y);
    
    float stars = 0.0;
    for(float i = 0.0; i < 3.0; i++) {
        vec2 grid = floor(p * (20.0 + i * 15.0));
        vec2 f = fract(p * (20.0 + i * 15.0)) - 0.5;
        float h = hash(grid);
        if(h > 0.98) {
            float twinkle = sin(u_time * 2.0 + h * 6.28) * 0.5 + 0.5;
            float dist = length(f);
            stars += (0.01 / dist) * twinkle;
        }
    }
    color += stars * vec3(0.9, 0.95, 1.0);
    
    float ssTime = mod(u_time * 0.4, 10.0);
    if(ssTime < 1.0) {
        vec2 ssPos = vec2(-1.0 + ssTime * 2.0, 0.5 - ssTime * 0.5);
        float d = length(p - ssPos);
        float tail = smoothstep(0.1, 0.0, d);
        color += tail * vec3(1.0, 0.9, 0.7);
    }

    gl_FragColor = vec4(color, 1.0);
}`;

    function cs(type: any, src: any) {
      // @ts-ignore
      const s = gl.createShader(type);
      // @ts-ignore
      gl.shaderSource(s, src);
      // @ts-ignore
      gl.compileShader(s);
      return s;
    }

    // @ts-ignore
    const prog = gl.createProgram();
    // @ts-ignore
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    // @ts-ignore
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    // @ts-ignore
    gl.linkProgram(prog);
    // @ts-ignore
    gl.useProgram(prog);
    // @ts-ignore
    const buf = gl.createBuffer();
    // @ts-ignore
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    // @ts-ignore
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    // @ts-ignore
    const pos = gl.getAttribLocation(prog, "a_position");
    // @ts-ignore
    gl.enableVertexAttribArray(pos);
    // @ts-ignore
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    // @ts-ignore
    const uTime = gl.getUniformLocation(prog, "u_time");
    // @ts-ignore
    const uRes = gl.getUniformLocation(prog, "u_resolution");

    let animationFrameId: number;

    function render(t: number) {
      // @ts-ignore
      gl.viewport(0, 0, canvas.width, canvas.height);
      // @ts-ignore
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      // @ts-ignore
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      // @ts-ignore
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }
    render(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  // Three.js Floating Island
  useEffect(() => {
    if (activeScreen !== 2) return;

    const container = threeContainerRef.current;
    if (!container || !(window as any).THREE) return;

    const THREE = (window as any).THREE;
    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(width, height);
    renderer.setPixelRatio(getPixelRatioCap(lite));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffd700, 1, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const islandGroup = new THREE.Group();

    const baseGeo = new THREE.SphereGeometry(2, 8, 6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, flatShading: true });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.scale.set(1.5, 0.6, 1.5);
    base.position.y = -0.5;
    islandGroup.add(base);

    const surfaceGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.2, 12);
    const surfaceMat = new THREE.MeshStandardMaterial({ color: 0x2d3436 });
    const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
    surface.position.y = 0;
    islandGroup.add(surface);

    const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 1);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(-1, 0.5, -0.5);
    islandGroup.add(trunk);

    const foliageGeo = new THREE.SphereGeometry(0.6, 8, 8);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0xdb7093 });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.set(-1, 1.1, -0.5);
    islandGroup.add(foliage);

    const lanternGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.set(1, 0.8, 1);
    islandGroup.add(lantern);

    // Achievement bloom: white roses across the island when the full journey is complete
    const roseBeds: any[] = [];
    let heroRose: any = null;
    let popPhase: "idle" | "out" | "in" = "idle";
    let popT = 0;
    const POP_OUT_MS = 700;
    const POP_IN_MS = 900;

    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xfff8f2,
      roughness: 0.55,
      metalness: 0.05,
      emissive: 0xffffff,
      emissiveIntensity: 0.14,
    });
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0xf5e6c8,
      roughness: 0.7,
      emissive: 0xffeebb,
      emissiveIntensity: 0.1,
    });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d5c3a, flatShading: true });

    function makeRose(scale = 1) {
      const rose = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.35, 5), stemMat);
      stem.position.y = 0.18;
      rose.add(stem);
      for (let p = 0; p < 7; p++) {
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.12, 7, 7), petalMat);
        const angle = (p / 7) * Math.PI * 2;
        petal.scale.set(1, 0.45, 0.72);
        petal.position.set(Math.cos(angle) * 0.09, 0.4, Math.sin(angle) * 0.09);
        petal.rotation.y = angle;
        rose.add(petal);
      }
      for (let p = 0; p < 5; p++) {
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), petalMat);
        const angle = (p / 5) * Math.PI * 2 + 0.3;
        petal.scale.set(1, 0.5, 0.7);
        petal.position.set(Math.cos(angle) * 0.04, 0.46, Math.sin(angle) * 0.04);
        rose.add(petal);
      }
      const bud = new THREE.Mesh(new THREE.SphereGeometry(0.08, 7, 7), centerMat);
      bud.position.y = 0.48;
      rose.add(bud);
      rose.scale.setScalar(scale);
      return rose;
    }

    if (journeyComplete) {
      const rosePositions = [
        [0.9, 0.1, 0.6],
        [-0.2, 0.1, 1.1],
        [1.4, 0.1, -0.3],
        [-1.5, 0.1, 0.4],
        [0.3, 0.1, -1.2],
        [-0.8, 0.1, -0.9],
        [1.1, 0.1, 1.2],
        [-1.2, 0.1, 1.0],
        [0.0, 0.1, 0.4],
        [1.6, 0.1, 0.5],
        [-0.4, 0.1, -0.3],
        [0.6, 0.1, -0.6],
        [0.5, 0.1, 1.4],
        [-1.6, 0.1, -0.2],
      ];
      rosePositions.forEach(([x, y, z], i) => {
        const rose = makeRose(0.7 + (i % 3) * 0.12);
        rose.position.set(x, y, z);
        rose.rotation.y = i * 0.7;
        rose.userData.bloomDelay = i * 0.08;
        rose.userData.baseScale = rose.scale.x;
        rose.scale.setScalar(0.001);
        islandGroup.add(rose);
        roseBeds.push(rose);
      });

      const bloomLight = new THREE.PointLight(0xfff5e6, 1.5, 14);
      bloomLight.position.set(0, 2.5, 0);
      islandGroup.add(bloomLight);

      heroRose = makeRose(1);
      heroRose.visible = false;
      heroRose.position.set(0, 0.6, 0);
      islandGroup.add(heroRose);

      renderer.domElement.style.cursor = "pointer";
      renderer.domElement.style.touchAction = "manipulation";
    }

    scene.add(islandGroup);
    camera.position.z = 8;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const bloomStart = performance.now();

    const easeOutBack = (t: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };
    const easeInCubic = (t: number) => t * t * t;

    const triggerRosePop = () => {
      if (!journeyComplete || !heroRose || popPhase !== "idle") return;
      popPhase = "out";
      popT = 0;
      heroRose.visible = true;
      heroRose.scale.setScalar(0.01);
      heroRose.position.set(0, 0.85, 0);
      heroRose.rotation.set(0, 0, 0);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!journeyComplete || popPhase !== "idle") return;
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(islandGroup.children, true);
      if (hits.length > 0) triggerRosePop();
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    let animationFrameId: number;
    let lastTs = performance.now();
    function animate(now: number) {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;

      islandGroup.rotation.y += journeyComplete ? 0.003 : 0.005;
      islandGroup.position.y = Math.sin(Date.now() * 0.001) * 0.2;

      // Staggered bloom-in for bed roses
      if (journeyComplete) {
        const elapsed = (now - bloomStart) / 1000;
        roseBeds.forEach((rose: any) => {
          const local = Math.min(1, Math.max(0, (elapsed - rose.userData.bloomDelay) / 0.7));
          const s = easeOutBack(local) * rose.userData.baseScale;
          rose.scale.setScalar(Math.max(0.001, s));
        });
      }

      // Big rose pop out / tuck back
      if (heroRose && popPhase !== "idle") {
        if (popPhase === "out") {
          popT += (dt * 1000) / POP_OUT_MS;
          const t = Math.min(1, popT);
          const s = easeOutBack(t) * 3.4;
          heroRose.scale.setScalar(Math.max(0.01, s));
          heroRose.position.y = 0.85 + t * 1.4;
          heroRose.rotation.y += dt * 1.2;
          if (t >= 1) {
            popPhase = "in";
            popT = 0;
          }
        } else if (popPhase === "in") {
          popT += (dt * 1000) / POP_IN_MS;
          const t = Math.min(1, popT);
          const s = (1 - easeInCubic(t)) * 3.4;
          heroRose.scale.setScalar(Math.max(0.01, s));
          heroRose.position.y = 2.25 - t * 1.6;
          heroRose.rotation.y += dt * 0.8;
          if (t >= 1) {
            heroRose.visible = false;
            popPhase = "idle";
            popT = 0;
          }
        }
      }

      renderer.render(scene, camera);
    }
    animate(performance.now());

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(getPixelRatioCap(lite));
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeScreen, lite, journeyComplete]);

  // Fireflies for screen 2 (and white rose petals when journey is complete)
  useEffect(() => {
    if (activeScreen !== 2) return;
    const container = document.getElementById("fireflies-container");
    if (!container) return;

    const numFireflies = lite ? 12 : 30;
    const fireflies: HTMLDivElement[] = [];

    for (let i = 0; i < numFireflies; i++) {
      const firefly = document.createElement("div");
      firefly.classList.add("firefly");
      firefly.style.left = `${Math.random() * 100}vw`;
      firefly.style.top = `${Math.random() * 100}vh`;

      const dx = (Math.random() - 0.5) * 2;
      const dy = (Math.random() - 0.5) * 2;
      firefly.style.setProperty("--dx", dx.toString());
      firefly.style.setProperty("--dy", dy.toString());

      firefly.style.animationDelay = `${Math.random() * 5}s, ${Math.random() * 2}s`;
      firefly.style.animationDuration = `${10 + Math.random() * 20}s, ${1 + Math.random() * 2}s`;

      firefly.addEventListener("animationiteration", (e) => {
        if ((e as AnimationEvent).animationName === "drift") {
          firefly.style.left = `${Math.random() * 100}vw`;
          firefly.style.top = `${Math.random() * 100}vh`;
        }
      });

      container.appendChild(firefly);
      fireflies.push(firefly);
    }

    const petals: HTMLDivElement[] = [];
    if (journeyComplete) {
      for (let i = 0; i < (lite ? 10 : 18); i++) {
        const petal = document.createElement("div");
        petal.className = "white-rose-petal";
        petal.style.left = `${Math.random() * 100}vw`;
        petal.style.animationDelay = `${Math.random() * 6}s`;
        petal.style.animationDuration = `${10 + Math.random() * 10}s`;
        container.appendChild(petal);
        petals.push(petal);
      }
    }

    return () => {
      fireflies.forEach((f) => f.remove());
      petals.forEach((p) => p.remove());
    };
  }, [activeScreen, lite, journeyComplete]);

  const visibleDestinations = DESTINATIONS.filter((d) => {
    if (!ready) return d.id === "cottage";
    if (d.id === "finale") return isUnlocked("finale");
    return isUnlocked(d.id);
  });

  const destinationChip = (dest: (typeof DESTINATIONS)[number]) => (
    <Link
      key={dest.id}
      href={dest.href}
      className={`absolute ${dest.position} ${dest.delayClass} pointer-events-auto group max-w-[46vw] sm:max-w-none`}
    >
      <div className="flex items-center gap-1.5 sm:gap-3 rounded-full glass-panel px-2.5 sm:px-6 py-2 sm:py-3 transition-all duration-500 hover:shadow-[inset_0_0_20px_rgba(233,195,73,0.3)] hover:scale-105 hover:border-tertiary/30">
        <span
          className="material-symbols-outlined text-secondary group-hover:text-tertiary transition-colors text-[18px] sm:text-[24px] shrink-0"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {dest.icon}
        </span>
        <span className="font-body-lg text-[12px] sm:text-[18px] text-on-surface-variant group-hover:text-on-surface truncate">
          {dest.label}
        </span>
      </div>
    </Link>
  );

  return (
    <div className="fixed inset-0 bg-background text-on-surface overflow-hidden dark">
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <canvas ref={shaderCanvasRef} className="w-full h-full" />
      </div>

      <main
        className={`absolute inset-0 w-full h-full z-10 flex flex-col items-center justify-center safe-pad transition-all duration-[2000ms] ${
          activeScreen === 1
            ? "opacity-100 visible pointer-events-auto"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div className="flex-grow flex items-center justify-center text-center px-4">
          <h1 className="font-display-story text-[clamp(1.75rem,5vw,4rem)] text-inverse-surface fade-in-slow leading-tight max-w-4xl tracking-tight">
            Someone special has arrived.
          </h1>
        </div>
        <div className="pb-[max(4rem,var(--safe-bottom))] fade-in-delayed">
          <button
            className="group relative flex items-center justify-center px-8 sm:px-12 py-3 sm:py-4 rounded-full bg-gradient-to-r from-secondary-container/80 to-primary-container/80 backdrop-blur-md border border-white/10 overflow-hidden transition-all duration-700 hover:scale-105 pulse-ring"
            onClick={() => setActiveScreen(2)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-tertiary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-overlay"></div>
            <span className="font-label-caps text-[12px] text-tertiary tracking-widest uppercase relative z-10">
              Begin the Journey
            </span>
          </button>
        </div>
      </main>

      <main
        id="fireflies-container"
        className={`absolute inset-0 w-full h-full z-20 overflow-hidden transition-all duration-[2000ms] ${
          activeScreen === 2
            ? "opacity-100 visible pointer-events-auto"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
          <div className="relative w-[min(88vw,min(58vh,800px))] sm:w-[min(80vw,min(55vh,800px))] aspect-square max-w-full max-h-[min(70dvh,800px)]">
            <div
              ref={threeContainerRef}
              className={`absolute inset-0 w-full h-full pointer-events-auto touch-manipulation transition-opacity duration-[3000ms] ${
                activeScreen === 2 ? "opacity-100" : "opacity-0"
              } ${journeyComplete ? "cursor-pointer" : ""}`}
            />
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none z-30">
          {visibleDestinations.map((dest) => destinationChip(dest))}
        </div>
        {journeyComplete && (
          <div className="absolute top-[max(1rem,var(--safe-top))] left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center px-4">
            <p className="font-label-caps text-[11px] sm:text-[12px] uppercase tracking-[0.2em] text-tertiary/90 drop-shadow-[0_0_12px_rgba(233,195,73,0.45)]">
              The island blooms — journey complete
            </p>
            <p className="mt-1 font-body-md text-[12px] sm:text-[13px] text-on-surface-variant/80">
              Tap the island to watch a rose bloom
            </p>
          </div>
        )}
      </main>
      <ResetJourneyButton />
    </div>
  );
}
