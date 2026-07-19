"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/components/ProgressProvider";
import type { RealmId } from "@/lib/progress";

/** Redirects to the island hub if this realm is still locked. */
export function useRealmGate(realm: RealmId) {
  const router = useRouter();
  const { ready, isUnlocked } = useProgress();

  useEffect(() => {
    if (!ready) return;
    if (!isUnlocked(realm)) {
      router.replace("/?island=true");
    }
  }, [ready, isUnlocked, realm, router]);

  return { ready, allowed: ready && isUnlocked(realm) };
}
