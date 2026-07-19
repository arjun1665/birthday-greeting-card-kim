"use client";

import { useProgress } from "@/components/ProgressProvider";

/** Dev/testing control — clears saved progress and reloads from the entry screen. */
export function ResetJourneyButton() {
  const { resetJourney } = useProgress();

  const handleReset = () => {
    if (
      !window.confirm(
        "Reset the journey? All unlocked realms and collected stars will be cleared."
      )
    ) {
      return;
    }
    resetJourney();
    window.location.href = "/";
  };

  return (
    <button
      type="button"
      onClick={handleReset}
      className="fixed bottom-[max(1rem,var(--safe-bottom))] left-[max(1rem,var(--safe-left))] z-[100] flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant/70 backdrop-blur-md transition-colors hover:border-tertiary/40 hover:text-tertiary"
      title="Clear saved progress (testing)"
    >
      <span className="material-symbols-outlined text-[14px]">restart_alt</span>
      Reset journey
    </button>
  );
}
