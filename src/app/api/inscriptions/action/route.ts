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

    const qrPayload = encodeURIComponent(String(row.reference || ""));
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrPayload}`;

    const defaultTpl =
      "INSCRIPTION VALIDÉE\n\n" +
      "Nom : {nom}\nPrénom : {prenom}\nCourse : {course}\nCatégorie : {categorie}\n" +
      "Référence : {reference}\nStatut : Validé\n\n" +
      "QR code : {qr}\n\nMisaotra / Merci — Trail Tafaray.";

    const tpl = settings?.notif_message_valide || defaultTpl;
    const message = fillTemplate(tpl, {
      prenom: row.prenom || "",
      nom: row.nom || "",
      reference: row.reference || "",
      course: row.course || "",
      categorie: row.categorie || "",
      qr: qrUrl,
    });

    // Prefer structured message if template has no placeholders for details
    const fullText =
      `INSCRIPTION VALIDÉE\n\n` +
      `Nom : ${row.nom || ""}\n` +
      `Prénom : ${row.prenom || ""}\n` +
      `Course : ${row.course || ""}\n` +
      `Catégorie : ${row.categorie || ""}\n` +
      `Référence : ${row.reference || ""}\n` +
      `Statut : Validé\n\n` +
      `QR code de votre inscription :\n${qrUrl}\n\n` +
      (settings?.notif_message_valide
        ? `\n---\n${fillTemplate(settings.notif_message_valide, {
            prenom: row.prenom || "",
            nom: row.nom || "",
            reference: row.reference || "",
            course: row.course || "",
            categorie: row.categorie || "",
            qr: qrUrl,
          })}\n`
        : "") +
      `\nMisaotra / Merci — Trail Tafaray.`;

    if (settings?.notif_email_actif && row.email) {
      const r = await sendValidationEmail({
        to: row.email,
        subject: `Inscription validée — ${row.reference}`,
        text: fullText,
      });
      notifs.email = r.ok ? "envoyé" : r.reason;
    }

    if (settings?.notif_sms_actif && row.telephone) {
      const smsBody = fillTemplate(
        "Inscription VALIDEE {reference} — {prenom} {nom} — {course} — {categorie}. Trail Tafaray.",
        {
          prenom: row.prenom || "",
          nom: row.nom || "",
          reference: row.reference || "",
          course: row.course || "",
          categorie: row.categorie || "",
        }
      );
      const r = await sendValidationSms({ to: String(row.telephone), body: smsBody });
      notifs.sms = r.ok ? "envoyé" : r.reason;
    }
  }

  return NextResponse.json({ success: true, notifs });
}
