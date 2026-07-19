"use client";

import { useEffect, useRef, useState } from "react";
import { ContinueButton, BackToIsland } from "@/components/RealmNav";
import { useProgress } from "@/components/ProgressProvider";
import { useRealmGate } from "@/hooks/useRealmGate";
import { useLiteGraphics } from "@/hooks/useViewport";

export default function Cottage() {
  useRealmGate("cottage");
  const { ready, progress, completeCottage } = useProgress();
  const lite = useLiteGraphics();
  const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isLetterOpen, setIsLetterOpen] = useState(false);

  useEffect(() => {
    if (ready && progress.cottageComplete) {
      setIsLetterOpen(true);
    }
  }, [ready, progress.cottageComplete]);

  useEffect(() => {
    const canvas = shaderCanvasRef.current;
    if (!canvas) return;

    function syncSize() {
      const w = canvas?.clientWidth || window.innerWidth;
      const h = canvas?.clientHeight || window.innerHeight;
      const ratio = lite ? 0.6 : 1;
      if (canvas && (canvas.width !== Math.floor(w * ratio) || canvas.height !== Math.floor(h * ratio))) {
        canvas.width = Math.floor(w * ratio);
        canvas.height = Math.floor(h * ratio);
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
    
    // Warm fire glow colors
    vec3 color1 = vec3(0.1, 0.02, 0.0); // Deep ember
    vec3 color2 = vec3(0.3, 0.1, 0.02); // Warm orange
    vec3 color3 = vec3(0.05, 0.02, 0.08); // Room shadow
    
    float n = noise(p * 0.8 + vec2(0.0, u_time * 0.2));
    float n2 = noise(p * 1.5 - vec2(u_time * 0.1, 0.0));
    
    vec3 finalColor = mix(color1, color2, n);
    finalColor = mix(finalColor, color3, uv.y);
    
    // Flickering effect
    float flicker = sin(u_time * 10.0) * 0.02 + 0.98;
    finalColor *= flicker;

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
  }, [lite]);

  const openLetter = () => {
    setIsLetterOpen(true);
    completeCottage();
    createFairyDust();
  };

  const createFairyDust = () => {
    const numParticles = 20;
    const container = document.body;

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('dust-particle');
        
        // Randomize position near the center of the screen
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        const x = centerX + (Math.random() - 0.5) * 200;
        const y = centerY + (Math.random() - 0.5) * 100;
        
        const size = Math.random() * 4 + 2;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.animationDelay = `${Math.random() * 0.5}s`;
        particle.style.animationDuration = `${Math.random() * 2 + 2}s`;
        
        container.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 4000);
    }
  };

  return (
    <div className="bg-background text-on-background fixed inset-0 page-scrollable selection:bg-secondary-container selection:text-on-secondary-container dark">
      {/* Atmospheric Shader Background */}
      <div className="fixed inset-0 z-0 opacity-80 mix-blend-screen pointer-events-none">
        <div className="absolute inset-0 w-full h-full">
            <canvas ref={shaderCanvasRef} className="w-full h-full" />
        </div>
      </div>

      <nav className="fixed top-0 left-0 w-full z-50 flex items-start justify-between gap-2 px-margin-mobile md:px-margin-desktop pt-[max(1.25rem,var(--safe-top))] px-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))] bg-transparent">
        <BackToIsland className="flex items-center gap-1.5 sm:gap-2 group transition-colors duration-500 text-outline-variant hover:text-tertiary px-2 sm:px-0 py-1" />
        <ContinueButton
          fromRealm="cottage"
          className="flex items-center gap-1.5 sm:gap-2 group transition-colors duration-500 text-outline-variant hover:text-tertiary px-2 sm:px-0 py-1"
        />
      </nav>

      {/* Main Content Canvas */}
      <main className="relative z-10 w-full min-h-[100dvh] flex items-center justify-center p-margin-mobile md:p-margin-desktop pt-24 pb-[max(2rem,var(--safe-bottom))]">
        <div className="w-full max-w-2xl relative flex flex-col items-center justify-center" style={{ perspective: "1000px" }}>
            
            {/* The Envelope (Initial State) */}
            <div 
              className={`absolute inset-0 m-auto w-64 h-48 bg-surface-container/40 backdrop-blur-3xl rounded-xl border border-white/10 shadow-[0_0_40px_rgba(233,195,73,0.1)] flex items-center justify-center hover:shadow-[0_0_60px_rgba(233,195,73,0.2)] transition-all duration-500 z-20 group cursor-pointer ${isLetterOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'}`} 
              onClick={openLetter}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-surface-container-high/50 to-transparent rounded-xl"></div>
                <div className="w-16 h-16 rounded-full bg-error-container/80 shadow-inner flex items-center justify-center ring-1 ring-error-container/50 transform group-hover:scale-105 transition-transform duration-500">
                    <span className="material-symbols-outlined text-on-error font-light text-[32px]">favorite</span>
                </div>
                <p className="absolute bottom-4 font-body-md text-[16px] text-on-surface-variant opacity-60 group-hover:opacity-100 transition-opacity">For Kim</p>
            </div>

            {/* The Letter Content (Revealed State) */}
            <div 
              className={`w-full bg-surface-container-lowest/30 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 sm:p-8 md:p-16 shadow-2xl shadow-primary-container/50 relative overflow-hidden z-10 transition-all duration-1000 ease-out ${isLetterOpen ? 'opacity-100 translate-y-0 rotate-x-0 pointer-events-auto' : 'opacity-0 translate-y-5 rotate-x-[10deg] pointer-events-none'}`}
              style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none rounded-2xl"></div>
                <div className="absolute top-8 left-8 text-tertiary/30"><span className="material-symbols-outlined text-[20px]">auto_awesome</span></div>
                <div className="absolute top-8 right-8 text-tertiary/30"><span className="material-symbols-outlined text-[20px]">auto_awesome</span></div>
                
                <div className="relative z-10 text-center max-w-lg mx-auto">
                    <h1 className="font-display-story text-[clamp(1.75rem,5vw,3rem)] text-tertiary mb-6 sm:mb-8 tracking-tight">Happy Birthday,<br/>Kim.</h1>
                    <div className="space-y-4 sm:space-y-6 font-body-lg text-[16px] sm:text-[18px] text-on-surface leading-relaxed opacity-90">
                        <p>
                            May this year bring you as much warmth and quiet wonder as a hidden cottage glowing in the night sky. 
                        </p>
                        <p>
                            Keep exploring the floating realms, and may every star map you unfold lead you to something beautiful.
                        </p>
                    </div>
                    <div className="mt-10 sm:mt-12 text-center">
                        <p className="font-label-caps text-[12px] text-secondary mb-2 uppercase tracking-widest">With Love,</p>
                        <div className="font-headline-md text-[22px] sm:text-[24px] text-primary-fixed">The Island Spirit</div>
                    </div>
                </div>
            </div>
            
        </div>
      </main>

      <style jsx global>{`
        .dust-particle {
            position: absolute;
            background: rgba(255, 224, 136, 0.6);
            border-radius: 50%;
            pointer-events: none;
            animation: float 4s infinite linear;
        }
        @keyframes float {
            0% { transform: translateY(0) scale(1); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(-20px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

