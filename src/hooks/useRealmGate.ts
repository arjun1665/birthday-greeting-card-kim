"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/components/ProgressProvider";
import { isRealmUnlocked, type RealmId } from "@/lib/progress";

/** Redirects to the island hub if this realm is still locked. */
export function useRealmGate(realm: RealmId) {
  const router = useRouter();
  const { ready, progress } = useProgress();
  const allowed = ready && isRealmUnlocked(progress, realm);

  useEffect(() => {
    if (!ready) return;
    if (!isRealmUnlocked(progress, realm)) {
      router.replace("/?island=true");
    }
  }, [ready, progress, realm, router]);

  return { ready, allowed };
}
