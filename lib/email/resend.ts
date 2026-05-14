import "server-only";

import { Resend } from "resend";

import { env, FROM_EMAIL, EMAIL_CONFIGURED } from "@/lib/env";

/**
 * Lightweight transactional email helper. Wraps Resend with a typed
 * payload + a console-log fallback when `EMAIL_CONFIGURED` is false (so
 * local dev still surfaces what would have been sent).
 */
export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!EMAIL_CONFIGURED || !env.RESEND_API_KEY) {
    const recipients = Array.isArray(input.to) ? input.to.join(", ") : input.to;
    console.log(
      `[email:dev-fallback] to=${recipients} subject="${input.subject}"\n${input.text ?? input.html}`,
    );
    return { ok: true, id: "dev-fallback" };
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}
