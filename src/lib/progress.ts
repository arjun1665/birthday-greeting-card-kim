export type RealmId = "cottage" | "observatory" | "tree" | "lake" | "finale";

export const REALM_ORDER: RealmId[] = [
  "cottage",
  "observatory",
  "tree",
  "lake",
  "finale",
];

export const REALM_PATHS: Record<RealmId, string> = {
  cottage: "/cottage",
  observatory: "/observatory",
  tree: "/tree",
  lake: "/lake",
  finale: "/finale",
};

export const REALM_LABELS: Record<RealmId, string> = {
  cottage: "Cottage",
  observatory: "Observatory",
  tree: "Ancient Tree",
  lake: "Star Lake",
  finale: "Giant Present",
};

/** Stars needed to complete Tree / Lake */
export const STARS_TO_COMPLETE = 5;

/** Constellations that must be discovered in Observatory */
export const OBSERVATORY_CONSTELLATIONS = [
  "Sagittarius",
  "Scorpius",
  "Libra",
] as const;

export type ProgressState = {
  cottageComplete: boolean;
  observatoryComplete: boolean;
  /** Names of discovered constellations */
  observatoryFound: string[];
  treeComplete: boolean;
  treeStars: number;
  lakeComplete: boolean;
  lakeStars: number;
  finaleComplete: boolean;
};

export const DEFAULT_PROGRESS: ProgressState = {
  cottageComplete: false,
  observatoryComplete: false,
  observatoryFound: [],
  treeComplete: false,
  treeStars: 0,
  lakeComplete: false,
  lakeStars: 0,
  finaleComplete: false,
};

export const PROGRESS_STORAGE_KEY = "astra-kim-progress-v1";

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return { ...DEFAULT_PROGRESS };
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      observatoryFound: Array.isArray(parsed.observatoryFound)
        ? parsed.observatoryFound
        : [],
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(state: ProgressState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

export function clearProgress() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isRealmComplete(state: ProgressState, realm: RealmId): boolean {
  switch (realm) {
    case "cottage":
      return state.cottageComplete;
    case "observatory":
      return state.observatoryComplete;
    case "tree":
      return state.treeComplete;
    case "lake":
      return state.lakeComplete;
    case "finale":
      return state.finaleComplete;
  }
}

/** Cottage is always unlocked; each next realm needs the previous completed. */
export function isRealmUnlocked(state: ProgressState, realm: RealmId): boolean {
  const index = REALM_ORDER.indexOf(realm);
  if (index <= 0) return true;
  const previous = REALM_ORDER[index - 1];
  return isRealmComplete(state, previous);
}

export function getContinueTarget(realm: RealmId): RealmId | null {
  const index = REALM_ORDER.indexOf(realm);
  if (index < 0 || index >= REALM_ORDER.length - 1) return null;
  return REALM_ORDER[index + 1];
}
