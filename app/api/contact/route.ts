import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import {
  env,
  EMAIL_CONFIGURED,
  FROM_EMAIL,
  CONTACT_RECIPIENTS,
  SITE_URL,
  SUPABASE_CONFIGURED,
} from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const ContactSchema = z.object({
  name: z.string().min(2, "Please share your name."),
  email: z.string().email("Please share a valid email."),
  company: z.string().optional(),
  role: z.string().optional(),
  message: z.string().min(10, "Tell us a little more about what you're working on."),
  /** Honeypot — silently dropped if filled by a bot. */
  website: z.string().optional(),
});

type ContactPayload = z.infer<typeof ContactSchema>;

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: issue }, { status: 400 });
  }

  // Silent honeypot drop
  if (parsed.data.website) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const headers = {
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null,
    userAgent: req.headers.get("user-agent") ?? null,
  };

  // CRM persistence — record the contact submission + create a lead row
  // when Supabase is configured. Best-effort: a DB failure here does not
  // block the email send.
  let leadId: string | null = null;
  if (SUPABASE_CONFIGURED) {
    leadId = await recordContactAsLead(parsed.data, headers).catch((err) => {
      console.error("[contact] CRM write failed", err);
      return null;
    });
  }

  if (!EMAIL_CONFIGURED) {
    console.log(
      "[contact] submission received (email backend not configured):",
      parsed.data,
      leadId ? `lead=${leadId}` : "",
    );
    return NextResponse.json({ ok: true, dev: true, leadId }, { status: 200 });
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_RECIPIENTS,
      subject: `New consultation request — ${parsed.data.name}${
        parsed.data.company ? ` · ${parsed.data.company}` : ""
      }`,
      replyTo: parsed.data.email,
      text: [
        `Name:    ${parsed.data.name}`,
        `Email:   ${parsed.data.email}`,
        `Company: ${parsed.data.company ?? "—"}`,
        `Role:    ${parsed.data.role ?? "—"}`,
        "",
        "Message",
        "───────",
        parsed.data.message,
        "",
        "—",
        `Sent from ${SITE_URL}/contact`,
        leadId ? `Lead: ${SITE_URL}/admin/leads/${leadId}` : "",
      ].filter(Boolean).join("\n"),
    });

    if (error) {
      console.error("[contact] resend rejected", error);
      return NextResponse.json(
        {
          error:
            "Mail provider rejected the message. Check the API key and that the From address is on a verified domain.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, leadId });
  } catch (err) {
    console.error("[contact] resend error", err);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}

/**
 * Records the contact submission + an attached lead row. Returns the lead id
 * so the admin email body can deep-link into the CRM.
 *
 * Uses service role since this is an unauthenticated public form.
 */
async function recordContactAsLead(
  data: ContactPayload,
  headers: { ip: string | null; userAgent: string | null },
): Promise<string | null> {
  const service = createServiceClient();

  // Create the lead first so the submission can FK to it.
  const { data: lead, error: leadError } = await service
    .from("leads")
    .insert({
      source: "contact_form",
      status: "new",
      company_name: data.company ?? null,
      contact_name: data.name,
      contact_email: data.email,
      contact_role: data.role ?? null,
      intent_summary: data.message,
      raw_payload: data,
    })
    .select("id")
    .single();

  if (leadError || !lead) {
    console.error("[contact] could not insert lead", leadError);
    return null;
  }

  await service.from("contact_form_submissions").insert({
    lead_id: lead.id,
    contact_name: data.name,
    contact_email: data.email,
    company: data.company ?? null,
    role: data.role ?? null,
    message: data.message,
    raw_payload: data,
    ip: headers.ip,
    user_agent: headers.userAgent,
  });

  await service.from("lead_activities").insert({
    lead_id: lead.id,
    kind: "note",
    body: "Submitted via /contact form.",
    payload: { source: "contact_form" },
  });

  await service.from("audit_logs").insert({
    actor_id: null,
    organization_id: null,
    action: "lead.created",
    resource_type: "lead",
    resource_id: lead.id,
    after: { source: "contact_form", email: data.email },
  });

  return lead.id;
}
