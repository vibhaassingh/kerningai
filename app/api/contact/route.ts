import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import {
  env,
  EMAIL_CONFIGURED,
  FROM_EMAIL,
  CONTACT_RECIPIENTS,
  SITE_URL,
} from "@/lib/env";

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

  if (!EMAIL_CONFIGURED) {
    console.log(
      "[contact] submission received (email backend not configured):",
      parsed.data,
    );
    return NextResponse.json({ ok: true, dev: true }, { status: 200 });
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
      ].join("\n"),
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] resend error", err);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
