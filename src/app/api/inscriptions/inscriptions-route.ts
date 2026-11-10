import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/supabase/require-admin";
import { generateReference, formatDate } from "@/lib/types";
import {
  computeCategory,
  parseDateNaissance,
  type CategoryRule,
} from "@/lib/categories-engine";
import { rateLimit } from "@/lib/rate-limit";

const COURSE_TARIF_KEYS: Record<string, string> = {
  "Zaza Tafaray": "tarif_zaza",
  "Trail Découverte": "tarif_decouverte",
  "Trail Endurance": "tarif_endurance",
  "Trail Intense": "tarif_intense",
  "VTT BEKA": "tarif_vtt",
  "Duathlon Nature": "tarif_duathlon",
};

function sanitizeText(v: unknown, max = 200): string {
  return String(v ?? "")
    .trim()
    .slice(0, max)
    .replace(/[\u0000-\u001F]/g, "");
}

function isValidEmail(email: string): boolean {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** GET : réservé admin */
export async function GET() {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;

  const supabase = gate.admin!;
  const { data, error } = await supabase
    .from("inscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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

/** POST : public (inscription) — montants et catégorie recalculés côté serveur */
export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rl = rateLimit(`inscription:${ip}`, 6, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: "Trop de tentatives. Réessayez dans une minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const supabase = createAdminClient();

    // Inscriptions ouvertes ?
    const { data: settings } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (settings && settings.inscriptions_ouvertes === false) {
      return NextResponse.json(
        { success: false, error: "Les inscriptions sont fermées." },
        { status: 403 }
      );
    }

    const prenom = sanitizeText(body.prenom, 100);
    const nom = sanitizeText(body.nom, 100);
    const dateNaissance = sanitizeText(body.dateNaissance, 20);
    const genre = sanitizeText(body.genre, 20);
    const nationalite = sanitizeText(body.nationalite, 80);
    const email = sanitizeText(body.email, 150);
    const telephone = sanitizeText(body.telephone, 40);
    const adresse = sanitizeText(body.adresse, 250);
    const organisation = sanitizeText(body.organisation, 150);
    const course = sanitizeText(body.course, 80);
    const contactUrgence = sanitizeText(body.contactUrgence, 100);
    const telephoneUrgence = sanitizeText(body.telephoneUrgence, 40);
    const numeroIdentite = sanitizeText(body.numeroIdentite, 80);
    const operateur = sanitizeText(body.operateur, 40);
    const referencePaiement = sanitizeText(body.referencePaiement, 80);
    const navette = body.navette === "Oui" ? "Oui" : "Non";
    let placesNavette = Math.max(0, Math.min(20, Number(body.placesNavette) || 0));
    if (navette === "Non") placesNavette = 0;
    if (navette === "Oui" && placesNavette < 1) placesNavette = 1;

    // T-shirt : pas pour Zaza
    let tailleTee = sanitizeText(body.tailleTee, 10);
    if (course === "Zaza Tafaray") tailleTee = "";

    if (body.acceptReglement !== true && body.acceptReglement !== "true" && body.acceptReglement !== 1) {
      return NextResponse.json(
        { success: false, error: "Vous devez accepter le règlement." },
        { status: 400 }
      );
    }

    if (!prenom || !nom || !dateNaissance || !genre || !course || !telephone || !numeroIdentite) {
      return NextResponse.json(
        { success: false, error: "Champs obligatoires manquants." },
        { status: 400 }
      );
    }

    if (!parseDateNaissance(dateNaissance)) {
      return NextResponse.json(
        { success: false, error: "Date de naissance invalide (format JJ/MM/AAAA)." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Adresse e-mail invalide." },
        { status: 400 }
      );
    }

    if (genre !== "Homme" && genre !== "Femme") {
      return NextResponse.json({ success: false, error: "Genre invalide." }, { status: 400 });
    }

    if (!Object.keys(COURSE_TARIF_KEYS).includes(course)) {
      return NextResponse.json({ success: false, error: "Course invalide." }, { status: 400 });
    }

    // Catégorie auto
    const { data: rulesData } = await supabase
      .from("category_rules")
      .select("*")
      .eq("actif", true);
    const rules = (rulesData || []) as CategoryRule[];
    const categorie = computeCategory(dateNaissance, genre, course, rules, {
      referenceDate: settings?.date_reference_categories || settings?.date_evenement,
      referenceYear: settings?.annee_reference_categories || 2026,
    });
    // Toujours une catégorie (HC si hors grilles)
    if (!categorie) {
      return NextResponse.json(
        { success: false, error: "Impossible de calculer la catégorie." },
        { status: 400 }
      );
    }

    // Montants serveur
    const tarifKey = COURSE_TARIF_KEYS[course];
    const prixCourse = Number(settings?.[tarifKey] ?? 0) || 0;
    const tarifNavette = Number(settings?.tarif_navette ?? 20000) || 20000;
    const montantNavette = navette === "Oui" ? tarifNavette * placesNavette : 0;

    let frais = 0;
    const mode = settings?.mm_frais_mode || "fixe";
    const base = prixCourse + montantNavette;
    const op = operateur.toLowerCase();
    let fraisConfig = 0;
    if (op.includes("mvola")) fraisConfig = Number(settings?.mm_frais_mvola ?? 0);
    else if (op.includes("orange")) fraisConfig = Number(settings?.mm_frais_orange ?? 0);
    else if (op.includes("airtel")) fraisConfig = Number(settings?.mm_frais_airtel ?? 0);

    if (mode === "pourcent") frais = Math.round((base * fraisConfig) / 100);
    else frais = fraisConfig;

    const montantTotal = base + frais;

    // Compteur non réutilisable : max séquence déjà attribuée (y compris refusées/supprimées si soft)
    // + table reference_counters si disponible
    let sequence = 1;
    try {
      const { data: counterRow } = await supabase
        .from("reference_counters")
        .select("last_seq")
        .eq("course", course)
        .maybeSingle();
      if (counterRow && typeof counterRow.last_seq === "number") {
        sequence = counterRow.last_seq + 1;
        await supabase
          .from("reference_counters")
          .upsert({ course, last_seq: sequence }, { onConflict: "course" });
      } else {
        // Fallback : max numérique extrait des références existantes (ne recule pas si suppressions)
        const { data: refs } = await supabase
          .from("inscriptions")
          .select("reference")
          .eq("course", course);
        let maxSeq = 0;
        for (const r of refs || []) {
          const m = String(r.reference || "").match(/(\d+)$/);
          if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
        }
        sequence = maxSeq + 1;
        await supabase
          .from("reference_counters")
          .upsert({ course, last_seq: sequence }, { onConflict: "course" });
      }
    } catch {
      const { count } = await supabase
        .from("inscriptions")
        .select("*", { count: "exact", head: true })
        .eq("course", course);
      sequence = (count || 0) + 1;
    }

    const reference = generateReference(course, sequence);
    const now = new Date();
    const acceptedAt = now.toISOString();

    const { error } = await supabase.from("inscriptions").insert({
      reference,
      prenom,
      nom,
      date_naissance: dateNaissance,
      genre,
      categorie,
      nationalite,
      email: email || null,
      telephone,
      adresse,
      organisation,
      taille_tee: tailleTee || null,
      navette,
      places_navette: placesNavette,
      course,
      contact_urgence: contactUrgence,
      telephone_urgence: telephoneUrgence,
      numero_identite: numeroIdentite,
      statut: "En attente",
      cree_le: formatDate(now),
      operateur,
      reference_paiement: referencePaiement,
      montant_declare: montantTotal,
      exporte: false,
      reglement_accepte_at: acceptedAt,
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reference,
      categorie,
      montantTotal,
      message: "Inscription enregistrée en statut En attente",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'enregistrement" },
      { status: 500 }
    );
  }
}
