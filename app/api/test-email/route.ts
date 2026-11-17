import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { appUrl, emailTemplate, escapeHtml, sendEmail } from "@/lib/email";

// GET /api/test-email : sends a test email to the SIGNED-IN user's own address.
// Used to prove the email service works (manual step 8). It only ever emails
// yourself, so it can't be abused to send mail to other people.
export async function GET() {
  const session = await getSession();
  if (!session.me) return NextResponse.json({ error: "Not set up" }, { status: 403 });

  const result = await sendEmail({
    to: session.me.email,
    subject: "PMS1 test email",
    html: emailTemplate({
      heading: "Email is working",
      body: `Hi ${escapeHtml(session.me.full_name)}, this is a test email from your Performance Management System.`,
      ctaLabel: "Open PMS1",
      ctaUrl: await appUrl("/dashboard"),
    }),
  });
  return NextResponse.json({ to: session.me.email, ...result }, { status: result.ok ? 200 : 502 });
}
