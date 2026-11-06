import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function toCsvRow(row: any): string {
  const fields = [
    row.reference,
    row.prenom,
    row.nom,
    row.date_naissance,
    row.genre,
    row.categorie,
    row.nationalite,
    row.email,
    String(row.telephone || "").replace(/^\+/, ""),
    row.adresse,
    row.organisation,
    row.taille_tee,
    row.navette,
    String(row.places_navette ?? 0),
    row.course,
    row.contact_urgence,
    String(row.telephone_urgence || "").replace(/^\+/, ""),
    row.numero_identite,
    "Validé",
    row.cree_le,
  ];
  return fields.map((f) => `"${String(f ?? "").replace(/"/g, '""')}"`).join(";");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const onlyNew = searchParams.get("onlyNew") === "true";

  const supabase = createAdminClient();
  let query = supabase
    .from("inscriptions")
    .select("*")
    .eq("statut", "Validé");

  if (onlyNew) {
    query = query.eq("exporte", false);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Aucune inscription validée à exporter" }, { status: 404 });
  }

  const header =
    "Référence;Prénom;Nom;Date de naissance;Genre;Catégorie;Nationalité;Email;Téléphone;Adresse;Organisation;Taille de tee-shirt;Navette;Places navette;Course;Contact d'urgence;Téléphone d'urgence;Numéro d'identité ou passeport;Statut;Créée le";
  const rows = data.map(toCsvRow);
  const csv = [header, ...rows].join("\n");

  // Marquer comme exporté
  const ids = data.map((d) => d.id);
  await supabase
    .from("inscriptions")
    .update({ exporte: true, date_export: new Date().toISOString() })
    .in("id", ids);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="export_tmh_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
