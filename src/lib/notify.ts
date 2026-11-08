/** Notifications : Gmail SMTP (prioritaire), sinon Resend ; SMS Twilio optionnel. */

type MailResult = { ok: boolean; reason?: string };

export async function sendValidationEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<MailResult> {
  if (!opts.to) return { ok: false, reason: "pas d'email participant" };

  // 1) Gmail / SMTP si configuré
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  if (smtpUser && smtpPass) {
    return sendViaSmtp(opts, smtpUser, smtpPass);
  }

  // 2) Fallback Resend
  const key = process.env.RESEND_API_KEY;
  if (key) return sendViaResend(opts, key);

  return {
    ok: false,
    reason: "Aucun service e-mail configuré (SMTP_USER/SMTP_PASS ou RESEND_API_KEY)",
  };
}

async function sendViaSmtp(
  opts: { to: string; subject: string; text: string },
  user: string,
  pass: string
): Promise<MailResult> {
  try {
    const nodemailer = await import("nodemailer");
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 465);
    const from =
      process.env.SMTP_FROM ||
      process.env.RESEND_FROM ||
      `Trail Tafaray <${user}>`;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message || "erreur SMTP Gmail" };
  }
}

async function sendViaResend(
  opts: { to: string; subject: string; text: string },
  key: string
): Promise<MailResult> {
  const from = process.env.RESEND_FROM || "Trail Tafaray <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, reason: t.slice(0, 200) };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message || "erreur Resend" };
  }
}

export async function sendValidationSms(opts: {
  to: string;
  body: string;
}): Promise<MailResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return { ok: false, reason: "Twilio non configuré" };
  if (!opts.to) return { ok: false, reason: "pas de téléphone" };

  const to = opts.to.startsWith("+") ? opts.to : `+261${opts.to.replace(/^0/, "")}`;
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const body = new URLSearchParams({ To: to, From: from, Body: opts.body });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, reason: t.slice(0, 200) };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message || "erreur sms" };
  }
}

export function fillTemplate(tpl: string, vars: Record<string, string>): string {
  let s = tpl || "";
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}
