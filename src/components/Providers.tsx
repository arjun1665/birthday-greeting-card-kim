"use client";

import { ProgressProvider } from "@/components/ProgressProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ProgressProvider>{children}</ProgressProvider>;
}
