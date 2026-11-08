import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase/require-admin";
import { writeAudit } from "@/lib/audit";
import {
  sendValidationEmail,
  sendValidationSms,
  fillTemplate,
} from "@/lib/notify";

export async function POST(request: Request) {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;

  const body = await request.json();
  const { id, action } = body;

  if (!id || !["valider", "refuser"].includes(action)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const statut = action === "valider" ? "Validé" : "Refusé";
  const supabase = gate.admin!;

  const { data: row } = await supabase
    .from("inscriptions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("inscriptions").update({ statut }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAudit(supabase, gate.user?.email, action, "inscription", String(id));

  const notifs: { email?: string; sms?: string } = {};

  if (action === "valider" && row) {
    const { data: settings } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    const tpl =
      settings?.notif_message_valide ||
      "Bonjour {prenom}, votre inscription {reference} ({course}) est validée. Misaotra — Trail Tafaray.";
    const message = fillTemplate(tpl, {
      prenom: row.prenom || "",
      nom: row.nom || "",
      reference: row.reference || "",
      course: row.course || "",
    });

    if (settings?.notif_email_actif && row.email) {
      const r = await sendValidationEmail({
        to: row.email,
        subject: `Inscription validée — ${row.reference}`,
        text: message,
      });
      notifs.email = r.ok ? "envoyé" : r.reason;
    }

    if (settings?.notif_sms_actif && row.telephone) {
      const r = await sendValidationSms({ to: String(row.telephone), body: message });
      notifs.sms = r.ok ? "envoyé" : r.reason;
    }
  }

  return NextResponse.json({ success: true, notifs });
}
