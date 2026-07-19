"use client";

import { useEffect, useRef, useState } from "react";
import { ContinueButton, BackToIsland } from "@/components/RealmNav";
import { useProgress } from "@/components/ProgressProvider";
import { useRealmGate } from "@/hooks/useRealmGate";

export default function Observatory() {
  useRealmGate("observatory");
  const { discoverConstellation, progress } = useProgress();
  const discoverRef = useRef(discoverConstellation);
  discoverRef.current = discoverConstellation;
  const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);
  
  const [panelVisible, setPanelVisible] = useState(false);
  const [constellationName, setConstellationName] = useState("");
  const [constellationMessage, setConstellationMessage] = useState("");

  // Deep Space Nebula Shader Background
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
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    
    // Deep Space Nebula
    float n = noise(p * 0.5 + u_time * 0.05);
    float n2 = noise(p * 0.8 - u_time * 0.03);
    
    vec3 color1 = vec3(0.02, 0.03, 0.1); // Deep Navy
    vec3 color2 = vec3(0.05, 0.02, 0.08); // Deep Purple
    vec3 color3 = vec3(0.0, 0.05, 0.07); // Dark Cyan
    
    vec3 finalColor = mix(color1, color2, n);
    finalColor = mix(finalColor, color3, n2 * 0.5);
    
    // Distant star field
    float stars = pow(hash(p * 150.0), 50.0) * 0.8;
    stars += pow(hash(p * 100.0 + 10.0), 60.0) * 0.5;
    
    // Twinkle
    float twinkle = sin(u_time * 1.5 + hash(floor(p * 100.0)) * 10.0) * 0.5 + 0.5;
    finalColor += stars * twinkle;
    
    // Subtle vignette
    float vignette = 1.0 - length(uv - 0.5) * 0.7;
    finalColor *= vignette;

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

  // Three.js Interactive Constellation Map — Sagittarius, Scorpius, Libra + Moon
  useEffect(() => {
    const container = threeContainerRef.current;
    if (!container || !(window as any).THREE) return;

    const THREE = (window as any).THREE;
    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 11;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const keyLight = new THREE.PointLight(0xffe8c8, 0.9, 40);
    keyLight.position.set(-2, 3, 6);
    scene.add(keyLight);

    type StarDef = { pos: [number, number, number]; size?: number; color?: number; label?: string };
    type ConstellationDef = {
      name: string;
      message: string;
      stars: StarDef[];
      lines: [number, number][];
      labelAt: [number, number, number];
    };

    // Asterisms from reference maps: Sagittarius teapot, Scorpius hook, Libra scales
    const constellations: ConstellationDef[] = [
      {
        name: "Sagittarius",
        message: "You make people smile just by being you.",
        stars: [
          { pos: [-4.85, 0.15, 0] },
          { pos: [-4.15, 0.55, 0] },
          { pos: [-3.45, 0.75, 0] },
          { pos: [-2.95, 1.45, 0] },
          { pos: [-2.45, 1.85, 0] },
          { pos: [-1.95, 1.45, 0] },
          { pos: [-1.55, 0.75, 0] },
          { pos: [-1.25, 1.15, 0] },
          { pos: [-1.15, 0.25, 0] },
          { pos: [-1.45, -0.35, 0] },
          { pos: [-2.15, -0.65, 0] },
          { pos: [-3.25, -0.75, 0] },
          { pos: [-3.75, -0.15, 0] },
          { pos: [-2.45, 0.35, 0] },
          { pos: [-2.45, 2.45, 0] },
          { pos: [-1.75, 2.75, 0] },
          { pos: [-3.05, 2.65, 0] },
        ],
        lines: [
          [0, 1], [1, 2], [2, 12], [12, 0],
          [2, 3], [3, 4], [4, 5], [5, 6], [6, 13], [13, 2],
          [3, 13], [5, 13],
          [6, 10], [10, 11], [11, 12],
          [6, 7], [7, 8], [8, 9], [9, 10],
          [4, 14], [14, 15], [14, 16],
        ],
        labelAt: [-3.15, -1.35, 0],
      },
      {
        name: "Scorpius",
        message: "You make ordinary days memorable.",
        stars: [
          { pos: [-0.55, -1.55, 0] },
          { pos: [-0.15, -1.55, 0] },
          { pos: [0.15, -1.05, 0] },
          { pos: [0.55, -0.55, 0] },
          { pos: [0.95, 0.05, 0] },
          { pos: [1.35, 0.55, 0] },
          { pos: [1.75, 1.05, 0] },
          { pos: [2.25, 1.45, 0], size: 0.17, color: 0xff9a3c, label: "Antares" },
          { pos: [2.95, 2.05, 0] },
          { pos: [3.15, 2.35, 0] },
          { pos: [3.25, 1.55, 0] },
          { pos: [3.45, 1.05, 0] },
          { pos: [3.15, 0.55, 0] },
        ],
        lines: [
          [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
          [7, 8], [8, 9], [7, 10], [7, 11], [7, 12],
        ],
        labelAt: [1.15, -0.15, 0],
      },
      {
        name: "Libra",
        message: "You are stronger than you realize.",
        stars: [
          { pos: [4.05, 0.55, 0] },
          { pos: [4.75, 0.65, 0] },
          { pos: [5.55, 1.45, 0], size: 0.12 },
          { pos: [5.65, 0.35, 0] },
          { pos: [5.05, -0.55, 0], size: 0.11, color: 0xffc878 },
        ],
        lines: [
          [0, 1], [1, 2], [2, 3], [3, 4], [4, 1],
        ],
        labelAt: [4.85, 0.15, 0],
      },
    ];

    function makeTextSprite(
      text: string,
      opts: { color?: string; fontSize?: number; opacity?: number } = {}
    ) {
      const color = opts.color || "#e8e8e8";
      const fontSize = opts.fontSize || 42;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      canvas.width = 512;
      canvas.height = 128;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `600 ${fontSize}px "Space Grotesk", "DM Sans", sans-serif`;
      ctx.fillStyle = color;
      ctx.globalAlpha = opts.opacity ?? 0.9;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(2.4, 0.6, 1);
      return sprite;
    }

    const mapGroup = new THREE.Group();
    const interactiveStars: any[] = [];
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xd8d8e8,
      transparent: true,
      opacity: 0.45,
    });

    constellations.forEach((c) => {
      const group = new THREE.Group();

      c.stars.forEach((s, index) => {
        const size = s.size ?? 0.07;
        const starGeo = new THREE.SphereGeometry(size, 10, 10);
        const starMat = new THREE.MeshBasicMaterial({ color: s.color ?? 0xffffff });
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.set(...s.pos);
        star.userData = { constellation: c.name, message: c.message };
        group.add(star);
        interactiveStars.push(star);

        if (s.label) {
          const tag = makeTextSprite(s.label, { color: "#e0a060", fontSize: 28, opacity: 0.95 });
          if (tag) {
            tag.position.set(s.pos[0], s.pos[1] + 0.35, s.pos[2]);
            tag.scale.set(1.35, 0.34, 1);
            group.add(tag);
          }
          // Soft glow for Antares
          if (s.color) {
            const glowGeo = new THREE.SphereGeometry(size * 2.2, 12, 12);
            const glowMat = new THREE.MeshBasicMaterial({
              color: s.color,
              transparent: true,
              opacity: 0.22,
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.copy(star.position);
            group.add(glow);
          }
        }
      });

      c.lines.forEach(([a, b]) => {
        const pa = c.stars[a]?.pos;
        const pb = c.stars[b]?.pos;
        if (!pa || !pb) return;
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...pa),
          new THREE.Vector3(...pb),
        ]);
        group.add(new THREE.Line(geo, lineMaterial));
      });

      const nameLabel = makeTextSprite(c.name, {
        fontSize: 36,
        opacity: 0.85,
        color: c.name === "Sagittarius" ? "#d8d8e0" : "#7eb8b8",
      });
      if (nameLabel) {
        nameLabel.position.set(...c.labelAt);
        nameLabel.scale.set(2.6, 0.65, 1);
        group.add(nameLabel);
      }

      mapGroup.add(group);
    });

    // Moon sits in the Sagittarius teapot lid (between lid stars)
    const moonGroup = new THREE.Group();
    const moonGeo = new THREE.SphereGeometry(0.28, 24, 24);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xe8e0d0,
      roughness: 0.9,
      metalness: 0.05,
      emissive: 0x3a3528,
      emissiveIntensity: 0.25,
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-2.45, 1.55, 0.25);
    moonGroup.add(moon);

    // Subtle darker patches as fake craters
    const craterMat = new THREE.MeshBasicMaterial({
      color: 0xb0a890,
      transparent: true,
      opacity: 0.35,
    });
    [
      [0.12, 0.08, 0.22],
      [-0.1, 0.14, 0.2],
      [0.05, -0.12, 0.23],
    ].forEach(([cx, cy, cz]) => {
      const crater = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), craterMat);
      crater.position.set(
        moon.position.x + cx,
        moon.position.y + cy,
        moon.position.z + cz
      );
      moonGroup.add(crater);
    });

    const moonLabel = makeTextSprite("Moon", { fontSize: 26, opacity: 0.9 });
    if (moonLabel) {
      moonLabel.position.set(moon.position.x, moon.position.y + 0.55, moon.position.z);
      moonLabel.scale.set(1.2, 0.3, 1);
      moonGroup.add(moonLabel);
    }
    mapGroup.add(moonGroup);

    scene.add(mapGroup);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Mesh = { threshold: 0.2 };
    const pointer = new THREE.Vector2();
    const isCoarse =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    const hitScale = isCoarse ? 2.2 : 1;

    interactiveStars.forEach((star: any) => {
      const base = (star.geometry.parameters?.radius ? 1 : 1) * hitScale;
      star.scale.setScalar(base);
      star.userData.baseScale = base;
    });

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
      if ((event.target as HTMLElement).closest("a, button, nav")) return;

      setPointerFromEvent(event.clientX, event.clientY);
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(interactiveStars);
      if (intersects.length > 0) {
        const star = intersects[0].object;
        const base = star.userData.baseScale || 1;

        setConstellationName(star.userData.constellation);
        setConstellationMessage(star.userData.message);
        setPanelVisible(true);
        discoverRef.current(star.userData.constellation);
        createStarDust(event.clientX, event.clientY);

        star.scale.setScalar(base * 2);
        const original = (star.material as any).color.getHex();
        (star.material as any).color.setHex(0xffe088);
        setTimeout(() => {
          star.scale.setScalar(base);
          (star.material as any).color.setHex(original);
        }, 500);
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
      // Gentle drift — keeps the map readable like the reference
      mapGroup.rotation.y = Math.sin(Date.now() * 0.00015) * 0.08;
      mapGroup.rotation.x = Math.sin(Date.now() * 0.00012) * 0.04;
      moon.rotation.y += 0.002;
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
    window.addEventListener("resize", handleResize);

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

  const createStarDust = (x: number, y: number) => {
    for(let i=0; i<10; i++) {
        const dust = document.createElement('div');
        dust.className = 'star-dust';
        dust.style.left = (x + (Math.random() * 40 - 20)) + 'px';
        dust.style.top = (y + (Math.random() * 40 - 20)) + 'px';
        dust.style.animationDelay = (Math.random() * 2) + 's';
        document.body.appendChild(dust);
        
        setTimeout(() => {
            dust.remove();
        }, 3000);
    }
  };

  return (
    <div className="text-on-background fixed inset-0 dark overflow-hidden selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Deep Space Nebula Shader Background */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <canvas ref={shaderCanvasRef} className="w-full h-full" />
      </div>

      {/* Interactive Constellation Map */}
      <div 
        ref={threeContainerRef} 
        className="absolute inset-0 w-full h-full z-10 cursor-crosshair touch-none" 
      />

      {/* Top Navigation */}
      <div className="fixed top-0 left-0 w-full z-40 flex items-start justify-between gap-2 px-margin-mobile md:px-margin-desktop pt-[max(1.25rem,var(--safe-top))] px-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))] pointer-events-none">
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

      {/* Title & Subtitle */}
      <div className="fixed top-[18%] sm:top-1/4 left-0 w-full z-20 pointer-events-none text-center px-gutter safe-x">
        <h1 className="font-display-story text-[clamp(1.5rem,4.5vw,3rem)] text-on-surface mb-2 tracking-[0.12em] sm:tracking-[0.2em] font-light drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Kim's Observatory</h1>
        <p className="font-body-md text-[14px] sm:text-[16px] text-secondary/80 font-light tracking-wider px-2">
          Discover Sagittarius, Scorpius, and Libra. ({progress.observatoryFound.length}/3)
        </p>
      </div>

      {/* Floating Glassmorphism Panel */}
      <div 
        className={`fixed bottom-[max(1rem,var(--safe-bottom))] left-1/2 -translate-x-1/2 z-30 w-full max-w-[min(400px,94vw)] px-3 transition-all duration-800 cubic-bezier(0.4, 0, 0.2, 1) ${panelVisible ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-5'}`}
      >
        <div className="glass-panel rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="absolute top-4 left-4 w-1 h-1 bg-tertiary rounded-full shadow-[0_0_8px_rgba(233,195,73,0.8)]"></div>
            <div className="absolute top-4 right-4 w-1 h-1 bg-tertiary rounded-full shadow-[0_0_8px_rgba(233,195,73,0.8)]"></div>
            <div className="absolute bottom-4 left-4 w-1 h-1 bg-tertiary rounded-full shadow-[0_0_8px_rgba(233,195,73,0.8)]"></div>
            <div className="absolute bottom-4 right-4 w-1 h-1 bg-tertiary rounded-full shadow-[0_0_8px_rgba(233,195,73,0.8)]"></div>
            
            <span className="material-symbols-outlined text-secondary text-4xl mb-4 opacity-80" style={{fontVariationSettings: "'FILL' 0"}}>auto_awesome</span>
            <h2 className="font-headline-md text-[20px] sm:text-[24px] text-tertiary mb-3">{constellationName}</h2>
            <p className="font-body-md text-[14px] sm:text-[16px] text-on-surface/90 leading-relaxed italic">{constellationMessage}</p>
            
            <button 
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
        }
        @keyframes float {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50px); }
        }
        @keyframes fade {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

