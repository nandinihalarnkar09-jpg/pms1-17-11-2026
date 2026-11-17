import "server-only";
import { headers } from "next/headers";
import { Resend } from "resend";

/**
 * Sends an email with Resend. Runs on the SERVER only, because the
 * RESEND_API_KEY is a secret: if it were in browser code, anyone could read it
 * and send email as us.
 *
 * Email is a side effect, not a dependency: this function never throws.
 * If sending fails we log it and return { ok: false }, and the action that
 * called it (e.g. submitting a self-appraisal) still succeeds.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY is not set, skipping email to", input.to);
    return { ok: false, error: "RESEND_API_KEY is not set" };
  }
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "PMS1 <onboarding@resend.dev>",
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (error) {
      console.error("[email] Resend rejected the email:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Absolute URL of this deployment (localhost in dev, the Vercel URL live). */
export async function appUrl(path = ""): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}${path}`;
}

/** Names come from the database; escape them so they can't inject HTML into the email. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** A simple, consistent HTML email: heading, a paragraph, and one button. */
export function emailTemplate(opts: {
  heading: string;
  body: string; // already-escaped HTML
  ctaLabel: string;
  ctaUrl: string;
}): string {
  return `<!doctype html>
<html><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:28px">
        <tr><td style="font-size:13px;color:#6b7280;letter-spacing:.04em;text-transform:uppercase">PMS1 · Performance Management</td></tr>
        <tr><td style="padding-top:12px;font-size:20px;font-weight:bold">${opts.heading}</td></tr>
        <tr><td style="padding-top:12px;font-size:15px;line-height:1.5">${opts.body}</td></tr>
        <tr><td style="padding-top:20px">
          <a href="${opts.ctaUrl}" style="display:inline-block;background:#4338ca;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px">${opts.ctaLabel}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
