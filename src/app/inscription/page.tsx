"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COURSES } from "@/lib/types";
import {
  formatDateInput,
  parseDateNaissance,
  computeCategory,
  type CategoryRule,
} from "@/lib/categories-engine";

type Settings = {
  inscriptions_ouvertes: boolean;
  tarif_zaza: number;
  tarif_decouverte: number;
  tarif_endurance: number;
  tarif_intense: number;
  tarif_vtt: number;
  tarif_duathlon: number;
  tarif_navette: number;
  mobile_money_mvola: string;
  mobile_money_orange: string;
  mobile_money_airtel: string;
  mm_beneficiaire: string;
  mm_titulaire: string;
  mm_instructions: string;
  mm_frais_mode: string;
  mm_frais_mvola: number;
  mm_frais_orange: number;
  mm_frais_airtel: number;
  tee_sizes: string;
  pay_mvola_actif?: boolean;
  pay_orange_actif?: boolean;
  pay_airtel_actif?: boolean;
  date_reference_categories?: string;
  annee_reference_categories?: number;
  date_evenement?: string;
};

const defaultSettings: Settings = {
  inscriptions_ouvertes: true,
  tarif_zaza: 15000,
  tarif_decouverte: 25000,
  tarif_endurance: 35000,
  tarif_intense: 45000,
  tarif_vtt: 40000,
  tarif_duathlon: 50000,
  tarif_navette: 20000,
  mobile_money_mvola: "",
  mobile_money_orange: "",
  mobile_money_airtel: "",
  mm_beneficiaire: "Association Trail Tafaray",
  mm_titulaire: "",
  mm_instructions: "Effectuez le transfert puis indiquez la référence de transaction.",
  mm_frais_mode: "fixe",
  mm_frais_mvola: 0,
  mm_frais_orange: 0,
  mm_frais_airtel: 0,
  tee_sizes: "S,M,L,XL,XXL",
  pay_mvola_actif: true,
  pay_orange_actif: true,
  pay_airtel_actif: true,
  date_reference_categories: "2027-10-24",
  annee_reference_categories: 2027,
};

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3.5 text-base text-stone-900 shadow-sm transition-colors placeholder:text-stone-400 hover:border-stone-400 focus:border-[#1F2C3F] focus:outline-none focus:ring-4 focus:ring-[#1F2C3F]/10";

function pricesFrom(s: Settings): Record<string, number> {
  return {
    "Zaza Tafaray": s.tarif_zaza,
    "Trail Découverte": s.tarif_decouverte,
    "Trail Endurance": s.tarif_endurance,
    "Trail Intense": s.tarif_intense,
    "VTT BEKA": s.tarif_vtt,
    "Duathlon Nature": s.tarif_duathlon,
  };
}

function Section({
  title,
  titleMg,
  children,
}: {
  title: string;
  titleMg?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md sm:rounded-3xl">
      <div className="space-y-5 p-5 sm:p-7">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="text-lg font-bold tracking-tight text-[#1F2C3F] sm:text-xl">{title}</h2>
          {titleMg && (
            <p className="mt-1 text-sm font-normal text-stone-500">{titleMg}</p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  labelMg,
  required,
  children,
}: {
  label: string;
  labelMg?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-semibold text-stone-700">
        <span>{label}</span>
        {labelMg && <span className="font-normal text-stone-500"> / {labelMg}</span>}
        {required ? <span className="ml-1 text-blue-700">*</span> : ""}
      </label>
      {children}
    </div>
  );
}

function InscriptionForm() {
  const searchParams = useSearchParams();
  const courseParam = searchParams.get("course") || "";

  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [categorieResult, setCategorieResult] = useState("");
  const [dateError, setDateError] = useState("");
  const [summaryCourse, setSummaryCourse] = useState("");
  const [summaryNom, setSummaryNom] = useState("");
  const [summaryPrenom, setSummaryPrenom] = useState("");

  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    dateNaissance: "",
    genre: "",
    nationalite: "",
    email: "",
    telephone: "",
    adresse: "",
    organisation: "",
    tailleTee: "",
    navette: "Non",
    placesNavette: 1,
    course: courseParam && COURSES.includes(courseParam as any) ? courseParam : "",
    contactUrgence: "",
    telephoneUrgence: "",
    numeroIdentite: "",
    operateur: "",
    referencePaiement: "",
    acceptReglement: false,
  });

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const [sRes, rRes] = await Promise.all([
          supabase.from("site_settings").select("*").eq("id", 1).single(),
          supabase.from("category_rules").select("*").eq("actif", true).order("ordre"),
        ]);
        if (sRes.error) console.error("site_settings:", sRes.error);
        if (rRes.error) console.error("category_rules:", rRes.error);
        if (sRes.data) setSettings({ ...defaultSettings, ...sRes.data });
        if (rRes.data) setRules(rRes.data as CategoryRule[]);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const prices = pricesFrom(settings);
  const teeSizes = (settings.tee_sizes || "S,M,L,XL,XXL")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s.toUpperCase() !== "XS");

  const showTee = form.course !== "" && form.course !== "Zaza Tafaray";

  useEffect(() => {
    if (form.dateNaissance && form.genre && form.course && rules.length) {
      const cat = computeCategory(form.dateNaissance, form.genre, form.course, rules, {
        referenceDate: settings.date_reference_categories || settings.date_evenement,
        referenceYear: settings.annee_reference_categories || 2026,
      });
      setCategorieResult(cat);
    } else {
      setCategorieResult("");
    }
  }, [form.dateNaissance, form.genre, form.course, rules, settings]);

  const totals = useMemo(() => {
    const prixCourse = form.course ? prices[form.course] || 0 : 0;
    const places = form.navette === "Oui" ? Math.max(1, Number(form.placesNavette) || 1) : 0;
    const navette = form.navette === "Oui" ? (settings.tarif_navette || 20000) * places : 0;
    let frais = 0;
    const base = prixCourse + navette;
    const op = form.operateur.toLowerCase();
    let cfg = 0;
    if (op.includes("mvola")) cfg = Number(settings.mm_frais_mvola) || 0;
    else if (op.includes("orange")) cfg = Number(settings.mm_frais_orange) || 0;
    else if (op.includes("airtel")) cfg = Number(settings.mm_frais_airtel) || 0;
    if (settings.mm_frais_mode === "pourcent") frais = Math.round((base * cfg) / 100);
    else frais = cfg;
    return { prixCourse, navette, frais, total: base + frais, places };
  }, [form.course, form.navette, form.placesNavette, form.operateur, prices, settings]);

  const mmNumber = useMemo(() => {
    const op = form.operateur.toLowerCase();
    if (op.includes("mvola")) return settings.mobile_money_mvola;
    if (op.includes("orange")) return settings.mobile_money_orange;
    if (op.includes("airtel")) return settings.mobile_money_airtel;
    return "";
  }, [form.operateur, settings]);

  const set = (name: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onDateKeyboard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    set("dateNaissance", formatted);
    if (formatted.length === 10) {
      const ok = parseDateNaissance(formatted);
      setDateError(ok ? "" : "Date invalide ou future");
    } else {
      setDateError("");
    }
  };

  const onDatePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    if (!iso) return;
    const [y, m, d] = iso.split("-");
    const formatted = `${d}/${m}/${y}`;
    set("dateNaissance", formatted);
    const ok = parseDateNaissance(formatted);
    setDateError(ok ? "" : "Date invalide ou future");
  };

  const datePickerValue = useMemo(() => {
    const p = parseDateNaissance(form.dateNaissance);
    if (!p) return "";
    return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  }, [form.dateNaissance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.acceptReglement) {
      alert("Veuillez accepter le règlement.");
      return;
    }
    if (!parseDateNaissance(form.dateNaissance)) {
      alert("Date de naissance invalide.");
      return;
    }
    if (!categorieResult) {
      alert("Impossible de déterminer la catégorie pour cette course et cette date de naissance.");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      alert("Adresse e-mail invalide.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/inscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          placesNavette: form.navette === "Oui" ? form.placesNavette : 0,
          tailleTee: showTee ? form.tailleTee : "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReference(data.reference);
        setSummaryNom(form.nom);
        setSummaryPrenom(form.prenom);
        setSummaryCourse(form.course);
        setSubmitted(true);
      } else {
        alert("Erreur : " + (data.error || "inconnue"));
      }
    } catch {
      alert("Erreur réseau");
    }
    setLoading(false);
  };

  if (!loaded) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-stone-500">
        <div
          className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-blue-600"
          role="status"
          aria-label="Chargement"
        />
        Chargement...
      </div>
    );
  }

  if (!settings.inscriptions_ouvertes) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm sm:p-12">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-700">
            !
          </div>
          <h1 className="mb-3 text-3xl font-bold text-[#1F2C3F]">Inscriptions fermées</h1>
          <p className="text-stone-600">Les inscriptions ne sont pas ouvertes pour le moment.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    const cat = categorieResult || "";
    const qrPayload = encodeURIComponent(reference);
    const qrUrl =
      "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + qrPayload;

    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-lg shadow-stone-900/5 sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl text-blue-700">
            ✓
          </div>
          <h1 className="mb-6 text-2xl font-bold text-[#1F2C3F] sm:text-3xl">
            Inscription enregistrée
          </h1>
          <div className="mb-6 space-y-2 rounded-2xl border border-blue-100 bg-white p-4 text-left text-sm text-stone-700 sm:text-base">
            <p>
              <span className="text-stone-500">Nom :</span> <strong>{summaryNom}</strong>
            </p>
            <p>
              <span className="text-stone-500">Prénom :</span> <strong>{summaryPrenom}</strong>
            </p>
            <p>
              <span className="text-stone-500">Course :</span> <strong>{summaryCourse}</strong>
            </p>
            <p>
              <span className="text-stone-500">Catégorie :</span> <strong>{cat}</strong>
            </p>
            <p>
              <span className="text-stone-500">Référence :</span>{" "}
              <strong className="font-mono text-blue-700">{reference}</strong>
            </p>
            <p>
              <span className="text-stone-500">Statut :</span>{" "}
              <strong className="text-blue-700">En attente</strong>
            </p>
          </div>
          <p className="text-sm text-stone-600 mb-3">QR code unique de votre inscription</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt={"QR " + reference}
            className="mx-auto h-48 w-48 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm"
          />
          <p className="text-sm text-stone-500 mt-4">
            L&apos;administrateur vérifiera votre paiement Mobile Money et validera manuellement
            l&apos;inscription.
          </p>
          <p className="text-xs text-stone-500 mt-3">
            Au retrait des dossards : CIN / fiche médicale et autorisation parentale (si concerné).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate overflow-hidden bg-white pb-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border-[40px] border-blue-600/[0.04]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-72 h-96 w-96 rounded-full border-[48px] border-blue-600/[0.03]"
      />
      <div className="relative mx-auto max-w-4xl px-4 pb-8 pt-10 sm:pb-10 sm:pt-14">
        <header className="mb-7 rounded-3xl border border-blue-100 bg-white p-6 text-[#1F2C3F] shadow-sm sm:mb-9 sm:p-9">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blue-800">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Trail Tafaray
            </span>
            <span className="rounded-full border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-800">
              Une seule étape
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Inscription</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
            Remplissez le formulaire en une seule étape / Fenoy ity taratasy ity. Les champs * sont
            obligatoires / Tsy maintsy fenoina ny misy *.
          </p>
          <p className="mt-4 text-xs font-semibold text-blue-700">
            FORMULAIRE D&apos;INSCRIPTION <span className="mx-1.5 text-blue-500">•</span> TRAIL &amp; VTT
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        <Section title="1. Informations personnelles" titleMg="1. Mombamombanao">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nom" labelMg="Anarana" required>
              <input
                className={inputCls}
                value={form.nom}
                onChange={(e) => set("nom", e.target.value)}
                required
              />
            </Field>
            <Field label="Prénom" labelMg="Fanampin'anarana" required>
              <input
                className={inputCls}
                value={form.prenom}
                onChange={(e) => set("prenom", e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Date de naissance" labelMg="Daty nahaterahana" required>
            <div className="flex items-center gap-2">
              <input
                className={inputCls}
                inputMode="numeric"
                placeholder="Jj/Mm/Aa"
                value={form.dateNaissance}
                onChange={onDateKeyboard}
                maxLength={10}
                required
              />
              <label
                className="relative shrink-0 cursor-pointer rounded-xl border border-stone-300 bg-white p-3.5 shadow-sm transition-colors hover:border-blue-400 hover:bg-blue-50"
                title="Calendrier"
              >
                <span className="sr-only">Calendrier</span>
                <input
                  type="date"
                  className="absolute opacity-0 w-0 h-0"
                  value={datePickerValue}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={onDatePicker}
                />
                📅
              </label>
            </div>
            {dateError && <p className="mt-2 text-sm font-medium text-blue-700">{dateError}</p>}
            <p className="mt-2 text-xs text-stone-500">
              Tapez votre date de naissance ou utilisez le calendrier.
            </p>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Genre" labelMg="Lahy / Vavy" required>
              <select
                className={inputCls}
                value={form.genre}
                onChange={(e) => set("genre", e.target.value)}
                required
              >
                <option value="">Choisir</option>
                <option value="Homme">Homme / Lahy</option>
                <option value="Femme">Femme / Vavy</option>
              </select>
            </Field>
            <Field label="Nationalité" labelMg="Firenena">
              <input
                className={inputCls}
                value={form.nationalite}
                onChange={(e) => set("nationalite", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Téléphone" labelMg="Finday" required>
              <input
                className={inputCls}
                value={form.telephone}
                onChange={(e) => set("telephone", e.target.value)}
                required
              />
            </Field>
            <Field label="E-mail (facultatif)" labelMg="Mailaka (tsy voatery)">
              <input
                type="email"
                className={inputCls}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Adresse" labelMg="Adiresy">
            <input
              className={inputCls}
              value={form.adresse}
              onChange={(e) => set("adresse", e.target.value)}
            />
          </Field>

          <Field
            label="Numéro d'identité ou passeport"
            labelMg="Laharana karapanondro / pasipaoro"
            required
          >
            <input
              className={inputCls}
              value={form.numeroIdentite}
              onChange={(e) => set("numeroIdentite", e.target.value)}
              required
            />
          </Field>
        </Section>

        <Section title="2. Informations sportives" titleMg="2. Mombamomba ara-panatanjahan-tena">
          <Field label="Course" labelMg="Lalao / hazakazaka" required>
            {courseParam && form.course === courseParam ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                <p className="text-lg font-bold text-[#1F2C3F]">{form.course}</p>
                <p className="mt-1 text-sm font-semibold text-blue-700">
                  {(prices[form.course] || 0).toLocaleString("fr-MG")} Ar
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-600 underline-offset-2 transition-colors hover:border-stone-400 hover:text-[#1F2C3F] hover:underline"
                  onClick={() => set("course", "")}
                >
                  Changer de course
                </button>
              </div>
            ) : (
              <select
                className={inputCls}
                value={form.course}
                onChange={(e) => set("course", e.target.value)}
                required
              >
                <option value="">Choisir une course</option>
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c} — {(prices[c] || 0).toLocaleString("fr-MG")} Ar
                  </option>
                ))}
              </select>
            )}
          </Field>

          {categorieResult ? (
            <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-[#1F2C3F]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                ✓
              </span>
              <span>
                Catégorie calculée automatiquement :{" "}
                <strong className="text-blue-800">{categorieResult}</strong>
              </span>
            </div>
          ) : form.dateNaissance && form.genre && form.course ? (
            <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-900">
              <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-blue-500" />
              Catégorie en cours de calcul…
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-blue-200 bg-white px-4 py-3 text-sm leading-6 text-stone-500">
              La catégorie sera calculée automatiquement selon votre date de naissance, votre genre
              et la course.
            </p>
          )}

          <Field label="Organisation / Club" labelMg="Fikambanana / Club">
            <input
              className={inputCls}
              value={form.organisation}
              onChange={(e) => set("organisation", e.target.value)}
            />
          </Field>

          {showTee && (
            <Field label="Taille de t-shirt" labelMg="Haben'ny t-shirt">
              <select
                className={inputCls}
                value={form.tailleTee}
                onChange={(e) => set("tailleTee", e.target.value)}
              >
                <option value="">Choisir</option>
                {teeSizes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          )}
          {form.course === "Zaza Tafaray" && (
            <p className="rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-stone-500">
              Zaza Tafaray : pas de t-shirt fourni.
            </p>
          )}
        </Section>

        <Section title="3. Contact d'urgence" titleMg="3. laharana Maika">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nom du contact" labelMg="Anaran'ilay olona">
              <input
                className={inputCls}
                value={form.contactUrgence}
                onChange={(e) => set("contactUrgence", e.target.value)}
              />
            </Field>
            <Field label="Téléphone d'urgence" labelMg="laharan'ilay olona">
              <input
                className={inputCls}
                value={form.telephoneUrgence}
                onChange={(e) => set("telephoneUrgence", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="4. Transport et navette" titleMg="4. Fitaterana na navette">
          <Field label="Navette" labelMg="Fiara fitaterana">
            <select
              className={inputCls}
              value={form.navette}
              onChange={(e) => set("navette", e.target.value)}
            >
              <option>Non</option>
              <option>Oui</option>
            </select>
          </Field>
          {form.navette === "Oui" && (
            <Field label="Nombre de places navette" labelMg="Isan'ny toerana">
              <input
                type="number"
                min={1}
                max={20}
                className={inputCls}
                value={form.placesNavette}
                onChange={(e) => set("placesNavette", Number(e.target.value))}
              />
            </Field>
          )}
          <p className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-stone-600">
            Tarif navette : {(settings.tarif_navette || 20000).toLocaleString("fr-MG")} Ar / personne.
          </p>
        </Section>

        <Section title="5. Paiement Mobile Money" titleMg="5. Fandoavam-bola Mobile Money">
          <div className="mb-2 space-y-2 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-sm sm:p-5">
            <div className="flex justify-between">
              <span>Inscription {form.course || "—"}</span>
              <span>{totals.prixCourse.toLocaleString("fr-MG")} Ar</span>
            </div>
            {form.navette === "Oui" && (
              <div className="flex justify-between">
                <span>Navette × {totals.places}</span>
                <span>{totals.navette.toLocaleString("fr-MG")} Ar</span>
              </div>
            )}
            {totals.frais > 0 && (
              <div className="flex justify-between">
                <span>Frais de retrait</span>
                <span>{totals.frais.toLocaleString("fr-MG")} Ar</span>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border-t border-blue-100 bg-white px-3 py-3 font-bold text-[#1F2C3F] sm:px-4">
              <span className="text-xs tracking-wide sm:text-sm">TOTAL À PAYER</span>
              <span className="text-lg text-blue-700 sm:text-xl">
                {totals.total.toLocaleString("fr-MG")} Ar
              </span>
            </div>
          </div>

          <Field label="Opérateur" labelMg="Mpandraharaha">
            <select
              className={inputCls}
              value={form.operateur}
              onChange={(e) => set("operateur", e.target.value)}
            >
              <option value="">Choisir / Fidio</option>
              {settings.pay_mvola_actif !== false && <option>MVola</option>}
              {settings.pay_orange_actif !== false && <option>Orange Money</option>}
              {settings.pay_airtel_actif !== false && <option>Airtel Money</option>}
            </select>
          </Field>

          {form.operateur && (
            <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-sm sm:p-5">
              <p>
                <strong>Bénéficiaire :</strong>{" "}
                {settings.mm_beneficiaire || "Association Trail Tafaray"}
              </p>
              {settings.mm_titulaire && (
                <p>
                  <strong>Titulaire :</strong> {settings.mm_titulaire}
                </p>
              )}
              <p>
                <strong>Opérateur :</strong> {form.operateur}
              </p>
              {mmNumber && (
                <p>
                  <strong>Numéro :</strong> {mmNumber}
                </p>
              )}
              <p>
                <strong>Montant à transférer :</strong> {totals.total.toLocaleString("fr-MG")} Ar
              </p>
              {settings.mm_instructions && (
                <p className="mt-3 border-t border-blue-100 pt-3 leading-6 text-stone-600">
                  {settings.mm_instructions}
                </p>
              )}
            </div>
          )}

          <Field label="Référence de transaction" labelMg="Laharana transaction">
            <input
              className={inputCls}
              value={form.referencePaiement}
              onChange={(e) => set("referencePaiement", e.target.value)}
              placeholder="Référence reçue après le transfert"
            />
          </Field>
        </Section>

        <Section title="6. Acceptation du règlement" titleMg="6. Fanekena ny fitsipika">
          <label className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-white p-4 text-sm leading-6 text-stone-700">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-blue-700 focus:ring-2 focus:ring-blue-500/20"
              checked={form.acceptReglement}
              onChange={(e) => set("acceptReglement", e.target.checked)}
              required
            />
            <span>
              J&apos;accepte le{" "}
              <a href="/reglement" className="font-semibold text-blue-700 underline underline-offset-2" target="_blank">
                règlement de participation
              </a>{" "}
              et la{" "}
              <a href="/confidentialite" className="font-semibold text-blue-700 underline underline-offset-2" target="_blank">
                politique de confidentialité
              </a>
              .
            </span>
          </label>
        </Section>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-sm leading-6 text-[#1F2C3F] sm:p-5">
          <p className="mb-1 font-bold tracking-wide text-blue-800">IMPORTANT</p>
          <p>
            CIN ou PASSEPORT / FICHE MÉDICALE et AUTORISATION PARENTALE doivent être présentés lors du retrait
            des dossards.
          </p>
          <p className="mt-1 text-stone-600">
            CIN na PASSEPORT / taratasy ara-pahasalamana ary ny fanomezan-dàlana avy amin&apos;ny ray aman-dreny dia tsy maintsy
            aseho rehefa maka ny dossard.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !form.dateNaissance || !form.genre || !form.course}
          className="w-full rounded-2xl bg-[#1F2C3F] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#1F2C3F]/15 transition-all hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:text-lg"
        >
          {loading
            ? "Enregistrement..."
            : "Valider mon inscription / Hametraka ny fisoratana anarana"}
        </button>
      </form>
      </div>
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Chargement...</div>}>
      <InscriptionForm />
    </Suspense>
  );
}
