"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PROGRESS,
  OBSERVATORY_CONSTELLATIONS,
  STARS_TO_COMPLETE,
  clearProgress,
  getContinueTarget,
  isRealmComplete,
  isRealmUnlocked,
  loadProgress,
  saveProgress,
  type ProgressState,
  type RealmId,
} from "@/lib/progress";

type ProgressContextValue = {
  progress: ProgressState;
  ready: boolean;
  isUnlocked: (realm: RealmId) => boolean;
  isComplete: (realm: RealmId) => boolean;
  canContinue: (fromRealm: RealmId) => boolean;
  continueHref: (fromRealm: RealmId) => string | null;
  completeCottage: () => void;
  discoverConstellation: (name: string) => void;
  setTreeStars: (count: number) => void;
  setLakeStars: (count: number) => void;
  completeFinale: () => void;
  resetJourney: () => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_PROGRESS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveProgress(progress);
  }, [progress, ready]);

  const update = useCallback((updater: (prev: ProgressState) => ProgressState) => {
    setProgress((prev) => updater(prev));
  }, []);

  const completeCottage = useCallback(() => {
    update((prev) =>
      prev.cottageComplete ? prev : { ...prev, cottageComplete: true }
    );
  }, [update]);

  const discoverConstellation = useCallback(
    (name: string) => {
      update((prev) => {
        if (prev.observatoryFound.includes(name)) return prev;
        const observatoryFound = [...prev.observatoryFound, name];
        const observatoryComplete = OBSERVATORY_CONSTELLATIONS.every((c) =>
          observatoryFound.includes(c)
        );
        return { ...prev, observatoryFound, observatoryComplete };
      });
    },
    [update]
  );

  const setTreeStars = useCallback(
    (count: number) => {
      update((prev) => {
        const treeStars = Math.max(prev.treeStars, Math.min(count, STARS_TO_COMPLETE));
        return {
          ...prev,
          treeStars,
          treeComplete: treeStars >= STARS_TO_COMPLETE,
        };
      });
    },
    [update]
  );

  const setLakeStars = useCallback(
    (count: number) => {
      update((prev) => {
        const lakeStars = Math.max(prev.lakeStars, Math.min(count, STARS_TO_COMPLETE));
        return {
          ...prev,
          lakeStars,
          lakeComplete: lakeStars >= STARS_TO_COMPLETE,
        };
      });
    },
    [update]
  );

  const completeFinale = useCallback(() => {
    update((prev) =>
      prev.finaleComplete ? prev : { ...prev, finaleComplete: true }
    );
  }, [update]);

  const resetJourney = useCallback(() => {
    clearProgress();
    setProgress({ ...DEFAULT_PROGRESS });
  }, []);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      ready,
      isUnlocked: (realm) => isRealmUnlocked(progress, realm),
      isComplete: (realm) => isRealmComplete(progress, realm),
      canContinue: (fromRealm) => isRealmComplete(progress, fromRealm),
      continueHref: (fromRealm) => {
        const next = getContinueTarget(fromRealm);
        if (!next || !isRealmComplete(progress, fromRealm)) return null;
        const paths: Record<RealmId, string> = {
          cottage: "/cottage",
          observatory: "/observatory",
          tree: "/tree",
          lake: "/lake",
          finale: "/finale",
        };
        return paths[next];
      },
      completeCottage,
      discoverConstellation,
      setTreeStars,
      setLakeStars,
      completeFinale,
      resetJourney,
    }),
    [
      progress,
      ready,
      completeCottage,
      discoverConstellation,
      setTreeStars,
      setLakeStars,
      completeFinale,
      resetJourney,
    ]
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress must be used within ProgressProvider");
  }
  return ctx;
}
