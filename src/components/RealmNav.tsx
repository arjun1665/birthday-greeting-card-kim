"use client";

import Link from "next/link";
import { useProgress } from "@/components/ProgressProvider";
import type { RealmId } from "@/lib/progress";
import { REALM_PATHS, getContinueTarget, REALM_LABELS } from "@/lib/progress";

const CONTINUE_LABELS: Partial<Record<RealmId, string>> = {
  cottage: "Continue to Observatory",
  observatory: "Continue to Ancient Tree",
  tree: "Continue to Star Lake",
  lake: "Continue to Finale",
};

const CONTINUE_SHORT: Partial<Record<RealmId, string>> = {
  cottage: "Observatory",
  observatory: "Ancient Tree",
  tree: "Star Lake",
  lake: "Finale",
};

type ContinueButtonProps = {
  fromRealm: RealmId;
  className?: string;
};

export function ContinueButton({ fromRealm, className = "" }: ContinueButtonProps) {
  const { canContinue } = useProgress();
  const next = getContinueTarget(fromRealm);
  const unlocked = canContinue(fromRealm);
  const labelFull =
    CONTINUE_LABELS[fromRealm] ??
    (next ? `Continue to ${REALM_LABELS[next]}` : "Continue");
  const labelShort =
    CONTINUE_SHORT[fromRealm] ?? (next ? REALM_LABELS[next] : "Continue");

  if (!next) return null;

  const base =
    className ||
    "inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full glass-panel transition-colors duration-500 max-w-[46vw] sm:max-w-none";

  const label = (
    <>
      <span className="font-label-caps text-[10px] sm:text-[12px] uppercase truncate sm:hidden">
        {labelShort}
      </span>
      <span className="font-label-caps text-[12px] uppercase hidden sm:inline">{labelFull}</span>
    </>
  );

  if (!unlocked) {
    return (
      <span
        className={`${base} opacity-40 cursor-not-allowed select-none shrink-0`}
        aria-disabled="true"
        title="Complete this realm's task to continue"
      >
        {label}
        <span className="material-symbols-outlined text-[16px] sm:text-[18px] shrink-0">lock</span>
      </span>
    );
  }

  return (
    <Link href={REALM_PATHS[next]} className={`${base} group shrink-0`}>
      {label}
      <span className="material-symbols-outlined text-[16px] sm:text-[18px] shrink-0 transition-transform duration-500 group-hover:translate-x-1">
        arrow_forward
      </span>
    </Link>
  );
}

type BackToIslandProps = {
  className?: string;
};

export function BackToIsland({ className = "" }: BackToIslandProps) {
  const base =
    className ||
    "inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full glass-panel transition-colors duration-500 shrink-0";

  return (
    <Link href="/?island=true" className={`${base} group`}>
      <span className="material-symbols-outlined text-[16px] sm:text-[18px] shrink-0 transition-transform duration-500 group-hover:-translate-x-1">
        arrow_back
      </span>
      <span className="font-label-caps text-[10px] sm:text-[12px] uppercase sm:hidden">Island</span>
      <span className="font-label-caps text-[12px] uppercase hidden sm:inline">Back to Island</span>
    </Link>
  );
}

type RealmNavProps = {
  fromRealm: RealmId;
  backClassName?: string;
  continueClassName?: string;
  className?: string;
};

/** Top chrome: Back (left) + Continue (right), safe-area aware, mobile-short labels. */
export function RealmNav({
  fromRealm,
  backClassName,
  continueClassName,
  className = "",
}: RealmNavProps) {
  return (
    <nav
      className={`w-full flex items-start justify-between gap-2 sm:gap-4 pointer-events-auto safe-x ${className}`}
    >
      <BackToIsland className={backClassName} />
      <ContinueButton fromRealm={fromRealm} className={continueClassName} />
    </nav>
  );
}
