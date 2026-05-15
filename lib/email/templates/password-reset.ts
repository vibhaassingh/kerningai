import "server-only";

import { SITE_URL } from "@/lib/env";

export interface PasswordResetEmailInput {
  recipientName: string;
  organizationName: string;
  resetUrl: string;
  /** Who triggered it, for the body copy. */
  initiatedByName: string;
}

export function passwordResetEmail(input: PasswordResetEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Reset your Kerning AI password";

  const text = [
    `${input.initiatedByName} started a password reset for your`,
    `Kerning AI account.`,
    ``,
    `Set a new password:`,
    input.resetUrl,
    ``,
    `This link is single-use and expires shortly. If you weren't`,
    `expecting this, you can ignore the email — your password won't change.`,
    ``,
    `— Kerning AI`,
    SITE_URL,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#0c0c0e;color:#ece9e2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,system-ui,sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0c0c0e;padding:48px 24px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;">
            <tr>
              <td style="padding-bottom:32px;">
                <div style="font-family:'Inter Tight','Inter',system-ui,sans-serif;font-size:14px;letter-spacing:-0.01em;color:#ece9e2;">
                  <strong>KERNING</strong>&nbsp;AI
                </div>
                <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.16em;color:#8a857c;text-transform:uppercase;margin-top:4px;">
                  Password reset
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <h1 style="margin:0;font-family:'Inter Tight','Inter',system-ui,sans-serif;font-size:34px;line-height:1.05;letter-spacing:-0.03em;color:#ece9e2;font-weight:500;">
                  Reset your&nbsp;<em style="color:#f1ad3d;font-style:italic;">password</em>.
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:rgba(236,233,226,0.85);">
                ${escapeHtml(input.initiatedByName)} started a password reset for your <strong>Kerning AI</strong> account. Click below to choose a new password.
              </td>
            </tr>
            <tr>
              <td style="padding:24px 0 32px 0;">
                <a href="${escapeAttr(input.resetUrl)}"
                   style="display:inline-block;padding:13px 28px;border-radius:9999px;background:#ece9e2;color:#0c0c0e;text-decoration:none;font-weight:500;font-size:14.5px;letter-spacing:-0.005em;">
                  Set a new password &nbsp;↗
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;border-top:1px solid rgba(236,233,226,0.12);font-size:12px;line-height:1.6;color:#8a857c;">
                This link is single-use and expires shortly. If you weren't expecting this, ignore the email — your password won't change.
              </td>
            </tr>
            <tr>
              <td style="padding-top:20px;font-size:11px;color:#4d4a44;letter-spacing:0.04em;text-transform:uppercase;">
                Kerning AI · Industry 5.0 operational intelligence
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}
