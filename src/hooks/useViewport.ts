"use client";

import { useEffect, useState } from "react";

export type HubLayoutMode = "float" | "dock";

function readHubMode(): HubLayoutMode {
  if (typeof window === "undefined") return "float";
  const w = window.innerWidth;
  const h = window.innerHeight;
  const portrait = h >= w;
  // Dock on phones, narrow tablets, or any portrait (incl. 16:9 portrait)
  if (portrait || w < 900) return "dock";
  return "float";
}

function readLiteGraphics(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 900;
  const short = window.innerHeight < 520;
  const saveData =
    typeof navigator !== "undefined" &&
    "connection" in navigator &&
    Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const lowMem =
    typeof navigator !== "undefined" &&
    "deviceMemory" in navigator &&
    Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) > 0 &&
    Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) <= 4;
  return coarse || narrow || short || saveData || lowMem;
}

/** Island hub: floating labels on wide landscape, docked chips on portrait / narrow. */
export function useHubLayoutMode() {
  const [mode, setMode] = useState<HubLayoutMode>("float");

  useEffect(() => {
    const update = () => setMode(readHubMode());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return mode;
}

/** Prefer lighter WebGL / fewer particles on phones and constrained devices. */
export function useLiteGraphics() {
  const [lite, setLite] = useState(false);

  useEffect(() => {
    const update = () => setLite(readLiteGraphics());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return lite;
}

export function getPixelRatioCap(lite: boolean) {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 2);
}
