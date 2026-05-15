import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = {
  title: { default: "Admin", template: "%s · Kerning AI Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
