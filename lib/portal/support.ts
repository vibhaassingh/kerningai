import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface TicketRow {
  id: string;
  title: string;
  description: string;
  severity: "p1" | "p2" | "p3" | "p4";
  status: "open" | "in_progress" | "waiting_on_client" | "closed";
  module: string | null;
  reported_by_name: string | null;
  assigned_to_name: string | null;
  created_at: string;
  closed_at: string | null;
}

export interface TicketComment {
  id: string;
  body: string;
  is_internal: boolean;
  author_name: string | null;
  created_at: string;
}

export async function listTickets(organizationId: string): Promise<TicketRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select(
      "id, title, description, severity, status, module, created_at, closed_at, reported:app_users!support_tickets_reported_by_id_fkey(full_name, email), assigned:app_users!support_tickets_assigned_to_id_fkey(full_name, email)",
    )
    .eq("organization_id", organizationId)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(200);

  type R = {
    id: string;
    title: string;
    description: string;
    severity: TicketRow["severity"];
    status: TicketRow["status"];
    module: string | null;
    created_at: string;
    closed_at: string | null;
    reported: { full_name: string | null; email: string } | null;
    assigned: { full_name: string | null; email: string } | null;
  };

  return ((data ?? []) as unknown as R[]).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    severity: r.severity,
    status: r.status,
    module: r.module,
    reported_by_name: r.reported?.full_name ?? r.reported?.email ?? null,
    assigned_to_name: r.assigned?.full_name ?? r.assigned?.email ?? null,
    created_at: r.created_at,
    closed_at: r.closed_at,
  }));
}

export async function getTicketDetail(ticketId: string): Promise<{
  ticket: TicketRow;
  comments: TicketComment[];
} | null> {
  const supabase = await createClient();
  const { data: t } = await supabase
    .from("support_tickets")
    .select(
      "id, title, description, severity, status, module, created_at, closed_at, organization_id, reported:app_users!support_tickets_reported_by_id_fkey(full_name, email), assigned:app_users!support_tickets_assigned_to_id_fkey(full_name, email)",
    )
    .eq("id", ticketId)
    .maybeSingle();
  if (!t) return null;

  type TR = {
    id: string;
    title: string;
    description: string;
    severity: TicketRow["severity"];
    status: TicketRow["status"];
    module: string | null;
    created_at: string;
    closed_at: string | null;
    organization_id: string;
    reported: { full_name: string | null; email: string } | null;
    assigned: { full_name: string | null; email: string } | null;
  };
  const tRow = t as unknown as TR;

  const { data: comments } = await supabase
    .from("ticket_comments")
    .select("id, body, is_internal, created_at, author:app_users(full_name, email)")
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
    ticket: {
      id: tRow.id,
      title: tRow.title,
      description: tRow.description,
      severity: tRow.severity,
      status: tRow.status,
      module: tRow.module,
      reported_by_name:
        tRow.reported?.full_name ?? tRow.reported?.email ?? null,
      assigned_to_name:
        tRow.assigned?.full_name ?? tRow.assigned?.email ?? null,
      created_at: tRow.created_at,
      closed_at: tRow.closed_at,
    },
    comments: ((comments ?? []) as unknown as C[]).map((c) => ({
      id: c.id,
      body: c.body,
      is_internal: c.is_internal,
      author_name: c.author?.full_name ?? c.author?.email ?? null,
      created_at: c.created_at,
    })),
  };
}
