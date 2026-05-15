import type { ReactNode } from "react";

import { ClientShell } from "@/components/portal/ClientShell";

export const metadata = {
  title: { default: "Portal", template: "%s · Kerning AI Portal" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
