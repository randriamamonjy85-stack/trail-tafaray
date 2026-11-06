"use client";

import { useEffect, useState } from "react";
import { COURSE_CATEGORIES } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";
import { COURSES } from "@/lib/types";

type Settings = {
  inscriptions_ouvertes: boolean;
  tarif_zaza: number;
  tarif_decouverte: number;
  tarif_endurance: number;
  tarif_intense: number;
  tarif_vtt: number;
  tarif_duathlon: number;
  mobile_money_mvola: string;
  mobile_money_orange: string;
  mobile_money_airtel: string;
};

const defaultSettings: Settings = {
  inscriptions_ouvertes: true,
  tarif_zaza: 15000,
  tarif_decouverte: 25000,
  tarif_endurance: 35000,
  tarif_intense: 45000,
  tarif_vtt: 40000,
  tarif_duathlon: 50000,
  mobile_money_mvola: "",
  mobile_money_orange: "",
  mobile_money_airtel: "",
};

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

export default function InscriptionPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    dateNaissance: "",
    genre: "",
    categorie: "",
    nationalite: "",
    email: "",
    telephone: "",
    adresse: "",
    organisation: "",
    tailleTee: "",
    navette: "Non",
    placesNavette: 0,
    course: "",
    contactUrgence: "",
    telephoneUrgence: "",
    numeroIdentite: "",
    operateur: "",
    referencePaiement: "",
    acceptReglement: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
        if (data) setSettings({ ...defaultSettings, ...(data as Partial<Settings>) });
      } catch {
        // keep defaults
      } finally {
        setSettingsLoaded(true);
      }
    };
    load();
  }, []);

  const prices = pricesFrom(settings);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      ...(name === "course" ? { categorie: "" } : {}),
    }));
  };

  const handleSubmit = async () => {
    if (!form.acceptReglement) {
      alert("Veuillez accepter le règlement.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/inscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          montantDeclare: prices[form.course] || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReference(data.reference);
        setSubmitted(true);
      } else {
        alert("Erreur : " + (data.error || "inconnue"));
      }
    } catch {
      alert("Erreur réseau");
    }
    setLoading(false);
  };

  const categories = form.course ? COURSE_CATEGORIES[form.course] || [] : [];
  const price = form.course ? prices[form.course] : null;

  if (!settingsLoaded) {
    return <div className="p-20 text-center text-stone-500">Chargement...</div>;
  }

  if (!settings.inscriptions_ouvertes) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl border border-stone-200 p-12">
          <h1 className="text-3xl font-bold text-[#1F2C3F] mb-4">Inscriptions fermées</h1>
          <p className="text-stone-600">
            Les inscriptions ne sont pas ouvertes pour le moment. Revenez plus tard.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-stone-200 p-12">
          <h1 className="text-3xl font-bold text-[#1F2C3F] mb-4">Inscription enregistrée</h1>
          <p className="text-lg text-stone-700 mb-2">Votre référence :</p>
          <p className="text-2xl font-mono font-bold text-[#A1532D] mb-6">{reference}</p>
          <p className="text-stone-600">
            Statut : <strong>En attente</strong>
          </p>
          <p className="text-sm text-stone-500 mt-4">
            L&apos;administrateur vérifiera votre paiement Mobile Money et validera manuellement
            l&apos;inscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-[#1F2C3F] mb-2">Inscription</h1>
      <p className="text-stone-600 mb-10">Étape {step} sur 3</p>

      <div className="bg-white rounded-2xl border border-stone-200 p-8">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-[#1F2C3F]">Course & identité</h2>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Course *</label>
              <select
                name="course"
                value={form.course}
                onChange={handleChange}
                className="w-full border border-stone-300 rounded-lg px-4 py-3"
                required
              >
                <option value="">Choisir une course</option>
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c} — {(prices[c] || 0).toLocaleString("fr-MG")} Ar
                  </option>
                ))}
              </select>
            </div>
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Catégorie *</label>
                <select
                  name="categorie"
                  value={form.categorie}
                  onChange={handleChange}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3"
                >
                  <option value="">Choisir</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Prénom *</label>
                <input
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nom *</label>
                <input
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Date de naissance (JJ/MM/AAAA) *
                </label>
                <input
                  name="dateNaissance"
                  value={form.dateNaissance}
                  onChange={handleChange}
                  placeholder="01/01/1990"
                  className="w-full border border-stone-300 rounded-lg px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Genre *</label>
                <select
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3"
                >
                  <option value="">Choisir</option>
                  <option>Homme</option>
                  <option>Femme</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Nationalité</label>
              <input
                name="nationalite"
                value={form.nationalite}
                onChange={handleChange}
                className="w-full border border-stone-300 rounded-lg px-4 py-3"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-[#1F2C3F] text-white py-3 rounded-full font-medium"
            >
              Continuer
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-[#1F2C3F]">Coordonnées</h2>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-stone-300 rounded-lg px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Téléphone *</label>
              <input
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                className="w-full border border-stone-300 rounded-lg px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Adresse</label>
              <input
                name="adresse"
                value={form.adresse}
                onChange={handleChange}
                className="w-full border border-stone-300 rounded-lg px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Organisation / Club</label>
              <input
                name="organisation"
                value={form.organisation}
                onChange={handleChange}
                className="w-full border border-stone-300 rounded-lg px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Taille tee-shirt</label>
              <select
                name="tailleTee"
                value={form.tailleTee}
                onChange={handleChange}
                className="w-full border border-stone-300 rounded-lg px-4 py-3"
              >
                <option value="">Choisir</option>
                <option>XS</option>
                <option>S</option>
                <option>M</option>
                <option>L</option>
                <option>XL</option>
                <option>XXL</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Contact d&apos;urgence
                </label>
                <input
                  name="contactUrgence"
                  value={form.contactUrgence}
                  onChange={handleChange}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Téléphone d&apos;urgence
                </label>
                <input
                  name="telephoneUrgence"
                  value={form.telephoneUrgence}
                  onChange={handleChange}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-stone-300 py-3 rounded-full font-medium"
              >
                Retour
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-[#1F2C3F] text-white py-3 rounded-full font-medium"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-[#1F2C3F]">Paiement & validation</h2>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Numéro d&apos;identité ou passeport *
              </label>
              <input
                name="numeroIdentite"
                value={form.numeroIdentite}
                onChange={handleChange}
                className="w-full border border-stone-300 rounded-lg px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Navette</label>
              <select
                name="navette"
                value={form.navette}
                onChange={handleChange}
                className="w-full border border-stone-300 rounded-lg px-4 py-3"
              >
                <option>Non</option>
                <option>Oui</option>
              </select>
            </div>
            {form.navette === "Oui" && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Nombre de places navette
                </label>
                <input
                  type="number"
                  name="placesNavette"
                  value={form.placesNavette}
                  onChange={handleChange}
                  min={1}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3"
                />
              </div>
            )}

            <div className="border-t pt-5">
              <h3 className="font-medium text-[#1F2C3F] mb-3">Paiement Mobile Money</h3>
              <p className="text-sm text-stone-600 mb-1">
                Montant à payer :{" "}
                <strong>{price ? price.toLocaleString("fr-MG") + " Ar" : "—"}</strong>
              </p>
              <div className="bg-stone-50 rounded-xl p-4 text-sm space-y-1 mb-4">
                <p className="font-medium text-[#1F2C3F]">Numéros de réception :</p>
                {settings.mobile_money_mvola && (
                  <p>MVola : <strong>{settings.mobile_money_mvola}</strong></p>
                )}
                {settings.mobile_money_orange && (
                  <p>Orange Money : <strong>{settings.mobile_money_orange}</strong></p>
                )}
                {settings.mobile_money_airtel && (
                  <p>Airtel Money : <strong>{settings.mobile_money_airtel}</strong></p>
                )}
                {!settings.mobile_money_mvola &&
                  !settings.mobile_money_orange &&
                  !settings.mobile_money_airtel && (
                    <p className="text-stone-500">
                      Les numéros seront affichés dès qu&apos;ils seront renseignés dans l&apos;admin.
                    </p>
                  )}
              </div>
              <p className="text-sm text-stone-600 mb-3">
                Effectuez le paiement puis renseignez la référence de transaction ci-dessous.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Opérateur</label>
                  <select
                    name="operateur"
                    value={form.operateur}
                    onChange={handleChange}
                    className="w-full border border-stone-300 rounded-lg px-4 py-3"
                  >
                    <option value="">Choisir</option>
                    <option>MVola</option>
                    <option>Orange Money</option>
                    <option>Airtel Money</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Référence transaction
                  </label>
                  <input
                    name="referencePaiement"
                    value={form.referencePaiement}
                    onChange={handleChange}
                    className="w-full border border-stone-300 rounded-lg px-4 py-3"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="acceptReglement"
                checked={form.acceptReglement}
                onChange={handleChange}
                className="mt-1"
              />
              <span>
                J&apos;accepte le règlement de participation et la politique de confidentialité.
              </span>
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-stone-300 py-3 rounded-full font-medium"
              >
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-[#1F2C3F] text-white py-3 rounded-full font-medium hover:bg-[#2a3d55] disabled:opacity-50"
              >
                {loading ? "Enregistrement..." : "Valider mon inscription"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
