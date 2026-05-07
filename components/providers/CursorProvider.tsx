"use client";

import type { ReactNode } from "react";

/**
 * Kept as a thin pass-through for backwards compat after the cursor was
 * refactored to be fully self-contained. No state, no context.
 */
export function CursorProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
