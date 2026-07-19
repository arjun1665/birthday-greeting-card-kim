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

/**
 * Milestone labels shown below the island as a hint strip.
 * Stage 0 = bare; 5 = fully bloomed garden.
 */
const STAGE_HINTS: Record<number, string> = {
  0: "Read the letter in the cottage to plant the first seed",
  1: "Discover a constellation to grow the first leaf",
  2: "Complete the Ancient Tree to reveal the bud",
  3: "Gather starlight at the Lake for the flower to bloom",
  4: "Complete the journey — the rose garden awaits",
  5: "The island blooms — journey complete ✦",
};

export default function HomeClient() {
  const [activeScreen, setActiveScreen] = useState(1);
  const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const { ready, progress, isUnlocked, isComplete } = useProgress();
  const lite = useLiteGraphics();

  // ── Bloom stage (0–5) derived from cumulative progress ──────────────────
  const bloomStage = ready
    ? progress.finaleComplete
      ? 5
      : progress.lakeComplete
      ? 4
      : progress.treeComplete
      ? 3
      : progress.observatoryFound.length > 0
      ? 2
      : progress.cottageComplete
      ? 1
      : 0
    : 0;

  const journeyComplete = bloomStage === 5;

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("island=true")) {
      setActiveScreen(2);
    }
  }, []);

  // ── Background Starfield Shader ──────────────────────────────────────────
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

  // ── Three.js Floating Island with Progressive Rose Garden ────────────────
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

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(renderer.domElement);

    // Lights — warmer when garden blooms
    const ambientLight = new THREE.AmbientLight(0x3a3a5c, bloomStage >= 4 ? 3.5 : 2);
    scene.add(ambientLight);
    const moonLight = new THREE.DirectionalLight(0xdde2f9, 1.2);
    moonLight.position.set(3, 8, 4);
    scene.add(moonLight);
    if (bloomStage >= 3) {
      // Warm blossom glow rises as garden grows
      const blossomLight = new THREE.PointLight(0xfff5e6, bloomStage * 0.35, 14);
      blossomLight.position.set(0, 2.5, 0);
      scene.add(blossomLight);
    }

    const islandGroup = new THREE.Group();

    // ── Island base ──
    const baseGeo = new THREE.SphereGeometry(2, 8, 6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, flatShading: true });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.scale.set(1.5, 0.6, 1.5);
    base.position.y = -0.5;
    islandGroup.add(base);

    // Garden soil surface — gets greener as stage increases
    const soilColors = [0x2d3436, 0x2a3a2a, 0x2e4a2e, 0x344d34, 0x3a5a3a, 0x3f6040];
    const surfaceGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.2, 16);
    const surfaceMat = new THREE.MeshStandardMaterial({ color: soilColors[bloomStage] });
    const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
    surface.position.y = 0;
    islandGroup.add(surface);

    // ── Shared rose materials ──
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d6a3a, roughness: 0.8 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x4a7a45, roughness: 0.7 });
    const budMat = new THREE.MeshStandardMaterial({
      color: 0xffe8e8,
      roughness: 0.5,
      emissive: 0xfff0f0,
      emissiveIntensity: 0.08,
    });
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xfff8f8,
      roughness: 0.45,
      metalness: 0.05,
      emissive: 0xffffff,
      emissiveIntensity: bloomStage >= 5 ? 0.22 : 0.1,
    });
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0xf8e8c8,
      roughness: 0.7,
      emissive: 0xffeebb,
      emissiveIntensity: 0.12,
    });

    // ── Helper: build a leaf pair on a stem ──
    function addLeaves(parent: any, stemHeight: number) {
      for (let side = -1; side <= 1; side += 2) {
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 5, 4),
          leafMat
        );
        leaf.scale.set(1.4, 0.3, 0.8);
        leaf.position.set(side * 0.12, stemHeight * 0.55, 0);
        leaf.rotation.z = side * 0.5;
        parent.add(leaf);
      }
    }

    // ── Helper: build a closed bud ──
    function makeBud(scale = 1): any {
      const group = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.4, 5), stemMat);
      stem.position.y = 0.2;
      group.add(stem);
      addLeaves(group, 0.4);
      const bud = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 7), budMat);
      bud.scale.set(1, 1.4, 1);
      bud.position.y = 0.46;
      group.add(bud);
      group.scale.setScalar(scale);
      return group;
    }

    // ── Helper: build a half-open rose ──
    function makeHalfRose(scale = 1): any {
      const group = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.38, 5), stemMat);
      stem.position.y = 0.19;
      group.add(stem);
      addLeaves(group, 0.38);
      // Outer petals only (spread less than full rose)
      for (let p = 0; p < 5; p++) {
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), petalMat);
        const angle = (p / 5) * Math.PI * 2;
        petal.scale.set(1, 0.5, 0.75);
        petal.position.set(Math.cos(angle) * 0.07, 0.42, Math.sin(angle) * 0.07);
        petal.rotation.y = angle;
        group.add(petal);
      }
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.07, 7, 7), centerMat);
      center.position.y = 0.46;
      group.add(center);
      group.scale.setScalar(scale);
      return group;
    }

    // ── Helper: build a fully bloomed rose ──
    function makeFullRose(scale = 1): any {
      const group = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.38, 5), stemMat);
      stem.position.y = 0.19;
      group.add(stem);
      addLeaves(group, 0.38);
      // Outer ring of 7 petals
      for (let p = 0; p < 7; p++) {
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.12, 7, 7), petalMat);
        const angle = (p / 7) * Math.PI * 2;
        petal.scale.set(1, 0.45, 0.72);
        petal.position.set(Math.cos(angle) * 0.09, 0.40, Math.sin(angle) * 0.09);
        petal.rotation.y = angle;
        group.add(petal);
      }
      // Inner ring of 5 petals
      for (let p = 0; p < 5; p++) {
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), petalMat);
        const angle = (p / 5) * Math.PI * 2 + 0.3;
        petal.scale.set(1, 0.5, 0.7);
        petal.position.set(Math.cos(angle) * 0.04, 0.47, Math.sin(angle) * 0.04);
        group.add(petal);
      }
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.08, 7, 7), centerMat);
      center.position.y = 0.50;
      group.add(center);
      group.scale.setScalar(scale);
      return group;
    }

    // ── Helper: just a sprout (Stage 1) ──
    function makeSprout(scale = 1): any {
      const group = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.028, 0.22, 4), stemMat);
      stem.position.y = 0.11;
      group.add(stem);
      // Two tiny seed leaves
      for (let s = -1; s <= 1; s += 2) {
        const seedLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 3), leafMat);
        seedLeaf.scale.set(1.2, 0.3, 0.7);
        seedLeaf.position.set(s * 0.07, 0.23, 0);
        seedLeaf.rotation.z = s * 0.6;
        group.add(seedLeaf);
      }
      group.scale.setScalar(scale);
      return group;
    }

    // ── Helper: sprout with grown leaves (Stage 2) ──
    function makeSproutWithLeaves(scale = 1): any {
      const group = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.32, 4), stemMat);
      stem.position.y = 0.16;
      group.add(stem);
      addLeaves(group, 0.32);
      group.scale.setScalar(scale);
      return group;
    }

    // ── Garden configurations per bloom stage ──
    // Each entry: [x, z, rotation_y, scale, growthFn]
    type PlantConfig = [number, number, number, number, (s: number) => any];

    const gardenByStage: PlantConfig[][] = [
      // Stage 0 — bare island, no plants
      [],
      // Stage 1 — 1 tiny sprout at centre
      [[0, 0, 0, 0.85, makeSprout]],
      // Stage 2 — sprout + leafy stem; 3 plants
      [
        [0, 0, 0, 0.9, makeSproutWithLeaves],
        [0.7, 0.5, 1.0, 0.75, makeSprout],
        [-0.6, -0.5, 2.1, 0.78, makeSprout],
      ],
      // Stage 3 — 5 plants; centre has bud
      [
        [0, 0, 0, 1.0, makeBud],
        [0.9, 0.4, 1.1, 0.82, makeSproutWithLeaves],
        [-0.8, 0.6, 2.3, 0.8, makeSproutWithLeaves],
        [0.5, -0.9, 0.5, 0.75, makeSprout],
        [-0.4, -0.7, 3.0, 0.77, makeSprout],
      ],
      // Stage 4 — 8 plants; centre + 2 others are half-open
      [
        [0, 0, 0, 1.05, makeHalfRose],
        [0.85, 0.55, 0.9, 0.88, makeHalfRose],
        [-0.7, 0.7, 2.5, 0.85, makeHalfRose],
        [1.1, -0.3, 0.3, 0.8, makeBud],
        [-1.0, -0.25, 4.1, 0.8, makeBud],
        [0.3, -1.0, 1.7, 0.78, makeBud],
        [-0.3, 1.1, 3.3, 0.78, makeSproutWithLeaves],
        [1.2, 0.9, 1.4, 0.76, makeSproutWithLeaves],
      ],
      // Stage 5 — full garden; 14 full roses
      [
        [0.9, 0.6, 0.4, 0.88, makeFullRose],
        [-0.2, 1.1, 1.2, 0.84, makeFullRose],
        [1.4, -0.3, 0.2, 0.82, makeFullRose],
        [-1.5, 0.4, 3.6, 0.86, makeFullRose],
        [0.3, -1.2, 1.8, 0.88, makeFullRose],
        [-0.8, -0.9, 5.2, 0.82, makeFullRose],
        [1.1, 1.2, 0.7, 0.80, makeFullRose],
        [-1.2, 1.0, 4.0, 0.82, makeFullRose],
        [0.0, 0.4, 2.0, 1.0, makeFullRose],
        [1.6, 0.5, 0.1, 0.78, makeFullRose],
        [-0.4, -0.3, 3.5, 0.84, makeFullRose],
        [0.6, -0.6, 1.3, 0.80, makeFullRose],
        [0.5, 1.4, 2.8, 0.78, makeFullRose],
        [-1.6, -0.2, 5.8, 0.82, makeFullRose],
      ],
    ];

    // Build the garden plants for current stage — animate them in with stagger
    const plants: any[] = [];
    const bloomStart = performance.now();
    const config = gardenByStage[bloomStage];

    config.forEach(([x, z, ry, sc, fn], idx) => {
      const plant = fn(sc);
      plant.position.set(x, 0.1, z);
      plant.rotation.y = ry;
      // Start scaled to 0; animate to full in render loop
      plant.userData.targetScale = sc;
      plant.userData.bloomDelay = idx * 0.12; // stagger
      plant.scale.setScalar(0.001);
      islandGroup.add(plant);
      plants.push(plant);
    });

    scene.add(islandGroup);
    camera.position.z = 8;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    // Hero rose pop (stage 5 tap interaction)
    let heroRose: any = null;
    let popPhase: "idle" | "out" | "in" = "idle";
    let popT = 0;
    const POP_OUT_MS = 700;
    const POP_IN_MS = 900;

    if (journeyComplete) {
      heroRose = makeFullRose(1);
      heroRose.visible = false;
      heroRose.position.set(0, 0.6, 0);
      islandGroup.add(heroRose);
      renderer.domElement.style.cursor = "pointer";
      renderer.domElement.style.touchAction = "manipulation";
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const easeOutBack = (t: number) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };
    const easeInCubic = (t: number) => t * t * t;

    const triggerRosePop = () => {
      if (!heroRose || popPhase !== "idle") return;
      popPhase = "out"; popT = 0;
      heroRose.visible = true;
      heroRose.scale.setScalar(0.01);
      heroRose.position.set(0, 0.85, 0);
      heroRose.rotation.set(0, 0, 0);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!journeyComplete || popPhase !== "idle") return;
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.intersectObjects(islandGroup.children, true).length > 0) triggerRosePop();
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

      // Stagger-bloom plants in
      const elapsed = (now - bloomStart) / 1000;
      plants.forEach((plant: any) => {
        const local = Math.min(1, Math.max(0, (elapsed - plant.userData.bloomDelay) / 0.65));
        const s = easeOutBack(local) * plant.userData.targetScale;
        plant.scale.setScalar(Math.max(0.001, s));
      });

      // Hero rose pop animation (stage 5)
      if (heroRose && popPhase !== "idle") {
        if (popPhase === "out") {
          popT += (dt * 1000) / POP_OUT_MS;
          const t = Math.min(1, popT);
          heroRose.scale.setScalar(Math.max(0.01, easeOutBack(t) * 3.4));
          heroRose.position.y = 0.85 + t * 1.4;
          heroRose.rotation.y += dt * 1.2;
          if (t >= 1) { popPhase = "in"; popT = 0; }
        } else {
          popT += (dt * 1000) / POP_IN_MS;
          const t = Math.min(1, popT);
          heroRose.scale.setScalar(Math.max(0.01, (1 - easeInCubic(t)) * 3.4));
          heroRose.position.y = 2.25 - t * 1.6;
          heroRose.rotation.y += dt * 0.8;
          if (t >= 1) { heroRose.visible = false; popPhase = "idle"; popT = 0; }
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
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [activeScreen, lite, bloomStage]);

  // ── Fireflies + falling rose petals (more petals as garden grows) ────────
  useEffect(() => {
    if (activeScreen !== 2) return;
    const container = document.getElementById("fireflies-container");
    if (!container) return;

    const numFireflies = lite ? 10 : 26;
    const fireflies: HTMLDivElement[] = [];
    for (let i = 0; i < numFireflies; i++) {
      const ff = document.createElement("div");
      ff.classList.add("firefly");
      ff.style.left = `${Math.random() * 100}vw`;
      ff.style.top = `${Math.random() * 100}vh`;
      ff.style.setProperty("--dx", ((Math.random() - 0.5) * 2).toString());
      ff.style.setProperty("--dy", ((Math.random() - 0.5) * 2).toString());
      ff.style.animationDelay = `${Math.random() * 5}s, ${Math.random() * 2}s`;
      ff.style.animationDuration = `${10 + Math.random() * 20}s, ${1 + Math.random() * 2}s`;
      ff.addEventListener("animationiteration", (e) => {
        if ((e as AnimationEvent).animationName === "drift") {
          ff.style.left = `${Math.random() * 100}vw`;
          ff.style.top = `${Math.random() * 100}vh`;
        }
      });
      container.appendChild(ff);
      fireflies.push(ff);
    }

    // Falling rose petals — count scales with bloom stage
    const petalCount = bloomStage >= 5
      ? (lite ? 12 : 22)
      : bloomStage >= 4
      ? (lite ? 6 : 12)
      : bloomStage >= 3
      ? (lite ? 3 : 6)
      : 0;

    const petals: HTMLDivElement[] = [];
    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement("div");
      petal.className = "white-rose-petal";
      petal.style.left = `${Math.random() * 100}vw`;
      petal.style.animationDelay = `${Math.random() * 8}s`;
      petal.style.animationDuration = `${12 + Math.random() * 10}s`;
      container.appendChild(petal);
      petals.push(petal);
    }

    return () => {
      fireflies.forEach((f) => f.remove());
      petals.forEach((p) => p.remove());
    };
  }, [activeScreen, lite, bloomStage]);

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
      {/* Starfield background shader */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <canvas ref={shaderCanvasRef} className="w-full h-full" />
      </div>

      {/* Screen 1 — Mystery entry */}
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
            type="button"
            className="group relative flex items-center justify-center px-8 sm:px-12 py-3 sm:py-4 rounded-full bg-gradient-to-r from-secondary-container/80 to-primary-container/80 backdrop-blur-md border border-white/10 overflow-hidden transition-all duration-700 hover:scale-105 pulse-ring"
            onClick={() => setActiveScreen(2)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-tertiary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-overlay" />
            <span className="font-label-caps text-[12px] text-tertiary tracking-widest uppercase relative z-10">
              Begin the Journey
            </span>
          </button>
        </div>
      </main>

      {/* Screen 2 — Floating Island hub */}
      <main
        id="fireflies-container"
        className={`absolute inset-0 w-full h-full z-20 overflow-hidden transition-all duration-[2000ms] ${
          activeScreen === 2
            ? "opacity-100 visible pointer-events-auto"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Island canvas */}
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

        {/* Destination chips */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {visibleDestinations.map((dest) => destinationChip(dest))}
        </div>

        {/* Garden status hint — top centre */}
        {ready && (
          <div className="absolute top-[max(1rem,var(--safe-top))] left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center px-4 max-w-[min(90vw,480px)]">
            {bloomStage >= 5 ? (
              <>
                <p className="font-label-caps text-[11px] sm:text-[12px] uppercase tracking-[0.2em] text-tertiary/90 drop-shadow-[0_0_12px_rgba(233,195,73,0.45)]">
                  ✦ The island blooms — journey complete ✦
                </p>
                <p className="mt-1 font-body-md text-[12px] sm:text-[13px] text-on-surface-variant/80">
                  Tap the island to watch a rose bloom
                </p>
              </>
            ) : (
              <p className="font-label-caps text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-secondary/70 drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
                {STAGE_HINTS[bloomStage]}
              </p>
            )}
          </div>
        )}

        {/* Garden progress dots — bottom centre above reset button */}
        {ready && (
          <div className="absolute bottom-[max(3.5rem,calc(var(--safe-bottom)+3rem))] left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((stage) => (
              <div
                key={stage}
                className={`rounded-full transition-all duration-700 ${
                  bloomStage >= stage
                    ? "w-2.5 h-2.5 bg-tertiary shadow-[0_0_8px_rgba(233,195,73,0.7)]"
                    : "w-1.5 h-1.5 bg-on-surface-variant/30"
                }`}
                title={STAGE_HINTS[stage]}
              />
            ))}
          </div>
        )}
      </main>

      <ResetJourneyButton />
    </div>
  );
}
