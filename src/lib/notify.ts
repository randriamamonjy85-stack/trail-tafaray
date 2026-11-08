/** Notifications optionnelles (e-mail Resend, SMS Twilio) si les clés ENV sont configurées. */

export async function sendValidationEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Trail Tafaray <onboarding@resend.dev>";
  if (!key) return { ok: false, reason: "RESEND_API_KEY non configurée" };
  if (!opts.to) return { ok: false, reason: "pas d'email participant" };

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
    return { ok: false, reason: e?.message || "erreur email" };
  }
}

export async function sendValidationSms(opts: {
  to: string;
  body: string;
}): Promise<{ ok: boolean; reason?: string }> {
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

export function fillTemplate(
  tpl: string,
  vars: Record<string, string>
): string {
  let s = tpl || "";
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}
