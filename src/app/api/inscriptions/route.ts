import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReference, formatDate } from "@/lib/types";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("inscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map snake_case -> camelCase for frontend compatibility
  const mapped = (data || []).map((row: any) => ({
    id: row.id,
    reference: row.reference,
    prenom: row.prenom,
    nom: row.nom,
    dateNaissance: row.date_naissance,
    genre: row.genre,
    categorie: row.categorie,
    nationalite: row.nationalite,
    email: row.email,
    telephone: row.telephone,
    adresse: row.adresse,
    organisation: row.organisation,
    tailleTee: row.taille_tee,
    navette: row.navette,
    placesNavette: row.places_navette,
    course: row.course,
    contactUrgence: row.contact_urgence,
    telephoneUrgence: row.telephone_urgence,
    numeroIdentite: row.numero_identite,
    statut: row.statut,
    creeLe: row.cree_le,
    operateur: row.operateur,
    referencePaiement: row.reference_paiement,
    montantDeclare: row.montant_declare,
    exporte: row.exporte,
    dateExport: row.date_export,
  }));

  return NextResponse.json(mapped);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createAdminClient();

    // Compter pour la séquence de référence
    const { count } = await supabase
      .from("inscriptions")
      .select("*", { count: "exact", head: true })
      .eq("course", body.course);

    const sequence = (count || 0) + 1;
    const reference = generateReference(body.course, sequence);
    const now = new Date();

    const { error } = await supabase.from("inscriptions").insert({
      reference,
      prenom: body.prenom,
      nom: body.nom,
      date_naissance: body.dateNaissance,
      genre: body.genre,
      categorie: body.categorie || "",
      nationalite: body.nationalite,
      email: body.email,
      telephone: body.telephone,
      adresse: body.adresse,
      organisation: body.organisation || "",
      taille_tee: body.tailleTee,
      navette: body.navette,
      places_navette: Number(body.placesNavette) || 0,
      course: body.course,
      contact_urgence: body.contactUrgence,
      telephone_urgence: body.telephoneUrgence,
      numero_identite: body.numeroIdentite,
      statut: "En attente",
      cree_le: formatDate(now),
      operateur: body.operateur || "",
      reference_paiement: body.referencePaiement || "",
      montant_declare: body.montantDeclare || 0,
      exporte: false,
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reference,
      message: "Inscription enregistrée en statut En attente",
    });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur lors de l'enregistrement" }, { status: 500 });
  }
}
