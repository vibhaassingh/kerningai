import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AdminTicketRow {
  id: string;
  organization_id: string;
  organization_name: string | null;
  title: string;
  severity: "p1" | "p2" | "p3" | "p4";
  status: "open" | "in_progress" | "waiting_on_client" | "closed";
  module: string | null;
  reported_by_name: string | null;
  assigned_to_name: string | null;
  created_at: string;
  closed_at: string | null;
}

export async function listAllTickets(): Promise<AdminTicketRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select(
      "id, organization_id, title, severity, status, module, created_at, closed_at, organization:organizations(name), reported:app_users!support_tickets_reported_by_id_fkey(full_name, email), assigned:app_users!support_tickets_assigned_to_id_fkey(full_name, email)",
    )
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(300);

  type R = {
    id: string;
    organization_id: string;
    title: string;
    severity: AdminTicketRow["severity"];
    status: AdminTicketRow["status"];
    module: string | null;
    created_at: string;
    closed_at: string | null;
    organization: { name: string } | null;
    reported: { full_name: string | null; email: string } | null;
    assigned: { full_name: string | null; email: string } | null;
  };

  return ((data ?? []) as unknown as R[]).map((r) => ({
    id: r.id,
    organization_id: r.organization_id,
    organization_name: r.organization?.name ?? null,
    title: r.title,
    severity: r.severity,
    status: r.status,
    module: r.module,
    reported_by_name: r.reported?.full_name ?? r.reported?.email ?? null,
    assigned_to_name: r.assigned?.full_name ?? r.assigned?.email ?? null,
    created_at: r.created_at,
    closed_at: r.closed_at,
  }));
}

export interface AdminTicketDetail {
  id: string;
  organization_id: string;
  organization_name: string | null;
  title: string;
  description: string;
  severity: AdminTicketRow["severity"];
  status: AdminTicketRow["status"];
  module: string | null;
  reported_by_name: string | null;
  created_at: string;
  closed_at: string | null;
  comments: {
    id: string;
    body: string;
    is_internal: boolean;
    author_name: string | null;
    created_at: string;
  }[];
}

export async function getAdminTicketDetail(
  ticketId: string,
): Promise<AdminTicketDetail | null> {
  const supabase = await createClient();

  const { data: t } = await supabase
    .from("support_tickets")
    .select(
      "id, organization_id, title, description, severity, status, module, created_at, closed_at, organization:organizations(name), reported:app_users!support_tickets_reported_by_id_fkey(full_name, email)",
    )
    .eq("id", ticketId)
    .maybeSingle();
  if (!t) return null;

  type TR = {
    id: string;
    organization_id: string;
    title: string;
    description: string;
    severity: AdminTicketRow["severity"];
    status: AdminTicketRow["status"];
    module: string | null;
    created_at: string;
    closed_at: string | null;
    organization: { name: string } | null;
    reported: { full_name: string | null; email: string } | null;
  };
  const tr = t as unknown as TR;

  const { data: comments } = await supabase
    .from("ticket_comments")
    .select(
      "id, body, is_internal, created_at, author:app_users(full_name, email)",
    )
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  type C = {
    id: string;
    body: string;
    is_internal: boolean;
    created_at: string;
    author: { full_name: string | null; email: string } | null;
  };

  return {
    id: tr.id,
    organization_id: tr.organization_id,
    organization_name: tr.organization?.name ?? null,
    title: tr.title,
    description: tr.description,
    severity: tr.severity,
    status: tr.status,
    module: tr.module,
    reported_by_name: tr.reported?.full_name ?? tr.reported?.email ?? null,
    created_at: tr.created_at,
    closed_at: tr.closed_at,
    comments: ((comments ?? []) as unknown as C[]).map((c) => ({
      id: c.id,
      body: c.body,
      is_internal: c.is_internal,
      author_name: c.author?.full_name ?? c.author?.email ?? null,
      created_at: c.created_at,
    })),
  };
}
