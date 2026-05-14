import type { ReactNode } from "react";

import { PartnerShell } from "@/components/partner/PartnerShell";

export const dynamic = "force-dynamic";

export default function PartnerRootLayout({ children }: { children: ReactNode }) {
  return <PartnerShell>{children}</PartnerShell>;
}
