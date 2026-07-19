"use client";

import { useEffect, useRef, useState } from "react";
import { ContinueButton, BackToIsland } from "@/components/RealmNav";
import { useProgress } from "@/components/ProgressProvider";
import { useRealmGate } from "@/hooks/useRealmGate";
import { STARS_TO_COMPLETE } from "@/lib/progress";

const LAKE_MEMORIES = [
  {
    title: "A Quiet Evening",
    caption: "A soft memory waiting for its photo.",
  },
  {
    title: "Shared Laughter",
    caption: "A moment that still glows like starlight.",
  },
  {
    title: "Warm Light",
    caption: "Placeholder for a favorite picture together.",
  },
  {
    title: "Tiny Adventures",
    caption: "A frame ready for a treasured snapshot.",
  },
  {
    title: "Star Lake Wish",
    caption: "One last reflection to hold forever.",
  },
];

export default function StarLake() {
  useRealmGate("lake");
  const { ready, progress, setLakeStars } = useProgress();
  const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);
  
  const [starsCollected, setStarsCollected] = useState(0);
  const [starPositions, setStarPositions] = useState<{id: number, startX: number, startY: number, endX: number, endY: number}[]>([]);
  const [panelVisible, setPanelVisible] = useState(false);
  const [memoryIndex, setMemoryIndex] = useState(0);
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

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
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

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    
    // Deep water colors
    vec3 color1 = vec3(0.02, 0.05, 0.12); // Midnight blue
    vec3 color2 = vec3(0.05, 0.1, 0.2);  // Soft cyan reflection
    
    float n = noise(p * 2.0 + u_time * 0.1);
    float ripples = sin(p.x * 10.0 + n * 5.0 + u_time) * 0.5 + 0.5;
    ripples *= sin(p.y * 8.0 - u_time * 0.5) * 0.5 + 0.5;
    
    vec3 finalColor = mix(color1, color2, ripples * 0.3);
    
    // Twinkling reflections
    float stars = pow(hash(p + u_time * 0.001), 100.0) * 0.8;
    finalColor += stars * vec3(0.8, 0.9, 1.0);
    
    // Vignette
    float d = length(uv - 0.5);
    finalColor *= smoothstep(0.8, 0.2, d);

    gl_FragColor = vec4(finalColor, 1.0);
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    
    // @ts-ignore
    const pos = gl.getAttribLocation(prog, 'a_position');
    // @ts-ignore
    gl.enableVertexAttribArray(pos);
    // @ts-ignore
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    
    // @ts-ignore
    const uTime = gl.getUniformLocation(prog, 'u_time');
    // @ts-ignore
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

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

    for(let i=0; i<boatCount; i++) {
      const boat = createBoat();
      boat.position.set((Math.random()-0.5)*10, 0, (Math.random()-0.5)*10);
      boat.userData = { 
        speed: 0.005 + Math.random()*0.01,
        phase: Math.random()*Math.PI*2,
        rotSpeed: (Math.random()-0.5)*0.01
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
      {/* Background Shader Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 w-full h-full">
            <canvas ref={shaderCanvasRef} className="w-full h-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-transparent to-surface-dim/50 pointer-events-none"></div>
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
          <div className="glass-panel p-4 sm:p-8 md:p-12 rounded-2xl sm:rounded-[32px] max-w-2xl floating-element">
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
            <span className="material-symbols-outlined text-tertiary-fixed-dim drop-shadow-[0_0_8px_rgba(233,195,73,0.6)]" style={{fontVariationSettings: "'FILL' 1"}}>stars</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display-story text-[24px] text-tertiary-fixed">{starsCollected}</span>
              <span className="font-label-caps text-[12px] text-on-surface-variant">/5</span>
            </div>
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_rgba(233,195,73,0.2)] pointer-events-none"></div>
          </div>
        </footer>
      </div>

      {/* Memory photo placeholder panel (Observatory-style) */}
      <div
        className={`fixed bottom-[max(5.5rem,calc(var(--safe-bottom)+4.5rem))] left-1/2 -translate-x-1/2 z-40 w-full max-w-[min(400px,94vw)] px-3 transition-all duration-700 ${
          panelVisible
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none translate-y-5"
        }`}
      >
        <div className="glass-panel rounded-2xl p-5 sm:p-7 text-center relative overflow-hidden border border-tertiary/15">
          <div className="mx-auto mb-4 w-full max-w-[240px] aspect-[4/3] rounded-xl border border-dashed border-white/25 bg-white/5 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-3xl opacity-80">photo_camera</span>
            <span className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant/70">
              Photo placeholder
            </span>
          </div>
          <h2 className="font-headline-md text-[20px] sm:text-[24px] text-tertiary mb-2">
            {LAKE_MEMORIES[memoryIndex]?.title}
          </h2>
          <p className="font-body-md text-[14px] sm:text-[16px] text-on-surface/90 leading-relaxed italic mb-4">
            {LAKE_MEMORIES[memoryIndex]?.caption}
          </p>
          <button
            type="button"
            className="font-label-caps text-[12px] text-outline hover:text-primary transition-colors tracking-widest uppercase cursor-pointer"
            onClick={() => setPanelVisible(false)}
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
      `}</style>
    </div>
  );
}

