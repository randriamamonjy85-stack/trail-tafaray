import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase/require-admin";
import { writeAudit } from "@/lib/audit";

function escapeCsv(val: unknown): string {
  let s = String(val ?? "");
  // strip control chars except tab handled below
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  // neutralize formula-like starts (after leading whitespace/tabs/newlines)
  const stripped = s.replace(/^[\s\t\r\n]+/, "");
  if (/^[=+\-@\t\r]/.test(stripped) || /^[=+\-@]/.test(s)) {
    s = "'" + s;
  }
  if (s.length > 500) s = s.slice(0, 500);
  return `"${s.replace(/"/g, '""')}"`;
}

function phoneOut(v: unknown): string {
  // Keep digits and leading + if present for readability; TMH had + stripped historically
  const s = String(v ?? "").trim();
  return s.replace(/^\+/, "");
}

function toCsvRow(row: any): string {
  return [
    row.reference,
    row.prenom,
    row.nom,
    row.date_naissance,
    row.genre,
    row.categorie,
    row.nationalite,
    row.email,
    phoneOut(row.telephone),
    row.adresse,
    row.organisation,
    row.taille_tee,
    row.navette,
    row.places_navette,
    row.course,
    row.contact_urgence,
    phoneOut(row.telephone_urgence),
    row.numero_identite,
    "Validé",
    row.cree_le,
  ]
    .map(escapeCsv)
    .join(";");
}

export async function GET(request: Request) {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;

  const supabase = gate.admin!;
  const { searchParams } = new URL(request.url);
  const onlyNew = searchParams.get("nouvelles") === "1";
  // mark=0 → download without marking exported (safer for interrupted downloads)
  const mark = searchParams.get("mark") !== "0";

  let q = supabase
    .from("inscriptions")
    .select("*")
    .eq("statut", "Validé")
    .order("created_at", { ascending: true });

  if (onlyNew) {
    q = q.or("exporte.is.null,exporte.eq.false");
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "Aucune inscription validée à exporter" },
      { status: 404 }
    );
  }

  const header =
    "Référence;Prénom;Nom;Date de naissance;Genre;Catégorie;Nationalité;Email;Téléphone;Adresse;Organisation;Taille de tee-shirt;Navette;Places navette;Course;Contact d'urgence;Téléphone d'urgence;Numéro d'identité ou passeport;Statut;Créée le";
  const rows = data.map(toCsvRow);
  const csv = "\uFEFF" + [header, ...rows].join("\r\n");

  if (mark) {
    const ids = data.map((d) => d.id);
    await supabase
      .from("inscriptions")
      .update({ exporte: true, date_export: new Date().toISOString() })
      .in("id", ids);
  }

  await writeAudit(
    supabase,
    gate.user?.email,
    mark ? "export_tmh" : "export_tmh_preview",
    "inscriptions",
    `${data.length} lignes`
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="export_tmh_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
