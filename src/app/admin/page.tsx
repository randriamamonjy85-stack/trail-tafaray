"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { COURSES } from "@/lib/types";
import CategoriesAdmin from "@/components/admin/CategoriesAdmin";
import CoursesAdmin from "@/components/admin/CoursesAdmin";
import DocumentsAdmin from "@/components/admin/DocumentsAdmin";
import AuditAdmin from "@/components/admin/AuditAdmin";
import FooterAdmin from "@/components/admin/FooterAdmin";

type Tab =
  | "inscriptions"
  | "contenu"
  | "visibilite"
  | "mobile"
  | "partenaires"
  | "actualites"
  | "photos"
  | "resultats"
  | "categories"
  | "courses"
  | "documents"
  | "audit"
  | "footer";

type Inscription = {
  id: string;
  reference: string;
  prenom: string;
  nom: string;
  dateNaissance: string;
  genre: string;
  categorie: string;
  nationalite: string;
  email: string;
  telephone: string;
  course: string;
  statut: string;
  creeLe: string;
  operateur?: string;
  referencePaiement?: string;
  montantDeclare?: number;
  exporte?: boolean;
};

type Settings = {
  id: number;
  inscriptions_ouvertes: boolean;
  resultats_visibles: boolean;
  partenaires_visibles: boolean;
  actualites_visibles: boolean;
  hero_titre: string;
  hero_sous_titre: string;
  date_evenement: string;
  lieu_evenement: string;
  texte_evenements: string;
  texte_courses: string;
  texte_reglement: string;
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

const emptySettings: Settings = {
  id: 1,
  inscriptions_ouvertes: true,
  resultats_visibles: false,
  partenaires_visibles: true,
  actualites_visibles: true,
  hero_titre: "Trail Tafaray",
  hero_sous_titre: "",
  date_evenement: "2027-10-24T06:00:00+03:00",
  lieu_evenement: "Anjeva, Madagascar",
  texte_evenements: "",
  texte_courses: "",
  texte_reglement: "",
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

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("inscriptions");
  const [message, setMessage] = useState("");
  const supabase = createClient();

  // Data
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [filterStatut, setFilterStatut] = useState("Tous");
  const [filterCourse, setFilterCourse] = useState("Toutes");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAlpha, setSortAlpha] = useState(false);
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [partenaires, setPartenaires] = useState<any[]>([]);
  const [actualites, setActualites] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [resultats, setResultats] = useState<any[]>([]);
  const [smsTexte, setSmsTexte] = useState("");
  const [smsMatches, setSmsMatches] = useState<any[]>([]);
  const [smsMsg, setSmsMsg] = useState("");
  const [resultatsText, setResultatsText] = useState("");

  // Forms
  const [partenaireForm, setPartenaireForm] = useState({
    nom: "",
    type: "officiel",
    description: "",
    logo_url: "",
    site_url: "",
  });
  const [actuForm, setActuForm] = useState({
    titre: "",
    contenu: "",
    image_url: "",
  });
  const [photoForm, setPhotoForm] = useState({ titre: "", url: "", album: "general" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3500);
  };

  const loadInscriptions = useCallback(async () => {
    const res = await fetch("/api/inscriptions");
    if (res.ok) setInscriptions(await res.json());
  }, []);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
    if (data) setSettings({ ...emptySettings, ...data });
  }, [supabase]);

  const loadPartenaires = useCallback(async () => {
    const { data } = await supabase.from("partenaires").select("*").order("ordre");
    setPartenaires(data || []);
  }, [supabase]);

  const loadActualites = useCallback(async () => {
    const { data } = await supabase
      .from("actualites")
      .select("*")
      .order("date_publication", { ascending: false });
    setActualites(data || []);
  }, [supabase]);

  const loadPhotos = useCallback(async () => {
    const { data } = await supabase.from("photos").select("*").order("ordre");
    setPhotos(data || []);
  }, [supabase]);

  const loadResultats = useCallback(async () => {
    const res = await fetch("/api/results");
    if (res.ok) {
      const data = await res.json();
      setResultats(data);
      setResultatsText(JSON.stringify(data, null, 2));
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    loadInscriptions();
    loadSettings();
    loadPartenaires();
    loadActualites();
    loadPhotos();
    loadResultats();
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const actionInscription = async (id: string, action: "valider" | "refuser") => {
    const res = await fetch("/api/inscriptions/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) {
      showMsg(action === "valider" ? "Inscription validée" : "Inscription refusée");
      loadInscriptions();
    } else {
      alert("Erreur");
    }
  };

  const deleteInscription = async (id: string, label: string) => {
    if (!confirm(`Supprimer définitivement l'inscription de ${label} ?\nCette action est irréversible.`)) return;
    const res = await fetch("/api/inscriptions/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error || "Erreur suppression");
    else loadInscriptions();
  };

  const saveSettings = async () => {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ ...settings, id: 1, updated_at: new Date().toISOString() });
    if (error) alert(error.message);
    else showMsg("Paramètres enregistrés");
  };

  const toggleSetting = async (key: keyof Settings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ ...next, id: 1, updated_at: new Date().toISOString() });
    if (error) alert(error.message);
    else showMsg("Visibilité mise à jour");
  };

  const addPartenaire = async () => {
    if (!partenaireForm.nom) return alert("Nom requis");
    const { error } = await supabase.from("partenaires").insert({
      ...partenaireForm,
      visible: true,
      ordre: partenaires.length,
    });
    if (error) alert(error.message);
    else {
      setPartenaireForm({ nom: "", type: "officiel", description: "", logo_url: "", site_url: "" });
      loadPartenaires();
      showMsg("Partenaire ajouté");
    }
  };

  const togglePartenaire = async (id: string, visible: boolean) => {
    await supabase.from("partenaires").update({ visible }).eq("id", id);
    loadPartenaires();
  };

  const deletePartenaire = async (id: string) => {
    if (!confirm("Supprimer ce partenaire ?")) return;
    await supabase.from("partenaires").delete().eq("id", id);
    loadPartenaires();
  };

  const addActualite = async () => {
    if (!actuForm.titre) return alert("Titre requis");
    const { error } = await supabase.from("actualites").insert({
      ...actuForm,
      visible: true,
      date_publication: new Date().toISOString().slice(0, 10),
    });
    if (error) alert(error.message);
    else {
      setActuForm({ titre: "", contenu: "", image_url: "" });
      loadActualites();
      showMsg("Actualité publiée");
    }
  };

  const toggleActualite = async (id: string, visible: boolean) => {
    await supabase.from("actualites").update({ visible }).eq("id", id);
    loadActualites();
  };

  const deleteActualite = async (id: string) => {
    if (!confirm("Supprimer cette actualité ?")) return;
    await supabase.from("actualites").delete().eq("id", id);
    loadActualites();
  };

  const uploadImage = async (file: File, folder: string) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) {
      alert("Erreur upload : " + error.message + "\nCréez d'abord le bucket « photos » dans Supabase Storage.");
      return null;
    }
    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const addPhoto = async () => {
    if (!photoForm.url) return alert("URL requise (ou uploadez une image)");
    const { error } = await supabase.from("photos").insert({
      ...photoForm,
      visible: true,
      ordre: photos.length,
    });
    if (error) alert(error.message);
    else {
      setPhotoForm({ titre: "", url: "", album: "general" });
      loadPhotos();
      showMsg("Photo ajoutée");
    }
  };

  const togglePhoto = async (id: string, visible: boolean) => {
    await supabase.from("photos").update({ visible }).eq("id", id);
    loadPhotos();
  };

  const deletePhoto = async (id: string) => {
    if (!confirm("Supprimer cette photo ?")) return;
    await supabase.from("photos").delete().eq("id", id);
    loadPhotos();
  };

  const saveResultats = async () => {
    try {
      const parsed = JSON.parse(resultatsText);
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (res.ok) {
        showMsg("Résultats enregistrés");
        loadResultats();
      } else alert("Erreur");
    } catch {
      alert("JSON invalide");
    }
  };

    const filtered = inscriptions
    .filter((i) => {
      if (filterStatut !== "Tous" && i.statut !== filterStatut) return false;
      if (filterCourse !== "Toutes" && i.course !== filterCourse) return false;
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const hay = [
          i.nom,
          i.prenom,
          i.reference,
          i.telephone,
          i.email,
          i.course,
        ]
          .map((x) => String(x || "").toLowerCase())
          .join(" ");
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .slice()
    .sort((a, b) => {
      if (!sortAlpha) return 0;
      const an = `${a.nom || ""} ${a.prenom || ""}`.toLowerCase();
      const bn = `${b.nom || ""} ${b.prenom || ""}`.toLowerCase();
      return an.localeCompare(bn, "fr");
    });

  if (loading) return <div className="p-20 text-center">Chargement...</div>;

  if (!session) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white rounded-2xl border border-stone-200 p-8">
          <h1 className="text-2xl font-bold text-[#1F2C3F] mb-6 text-center">
            Administration Trail Tafaray
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email admin"
              className="w-full border border-stone-300 rounded-lg px-4 py-3"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full border border-stone-300 rounded-lg px-4 py-3"
              required
            />
            <button
              type="submit"
              className="w-full bg-[#1F2C3F] text-white py-3 rounded-full font-medium"
            >
              Connexion
            </button>
          </form>
        </div>
      </div>
    );
  }


  const matchSmsPaiement = async () => {
    setSmsMsg("");
    const res = await fetch("/api/inscriptions/match-paiement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texte: smsTexte }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSmsMsg(data.error || "Erreur");
      setSmsMatches([]);
      return;
    }
    setSmsMatches(data.matches || []);
    setSmsMsg(
      data.matches?.length
        ? `${data.matches.length} correspondance(s) trouvée(s)`
        : "Aucune inscription en attente ne correspond à ce texte"
    );
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "inscriptions", label: "Inscriptions" },
    { id: "courses", label: "Courses" },
    { id: "categories", label: "Catégories âge" },
    { id: "contenu", label: "Contenu" },
    { id: "visibilite", label: "Visibilité" },
    { id: "mobile", label: "Mobile Money" },
    { id: "partenaires", label: "Partenaires" },
    { id: "actualites", label: "Actualités" },
    { id: "photos", label: "Photos" },
    { id: "resultats", label: "Résultats" },
    { id: "documents", label: "Documents" },
    { id: "footer", label: "Pied de page" },
    { id: "audit", label: "Journal audit" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1F2C3F]">Administration</h1>
          <p className="text-stone-600 text-sm">Connecté : {session.user.email}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-stone-500 hover:text-stone-800">
          Déconnexion
        </button>
      </div>

      {message && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-stone-200 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              tab === t.id
                ? "bg-[#1F2C3F] text-white"
                : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ========== INSCRIPTIONS ========== */}
      {tab === "inscriptions" && (
        <div>
          <div className="flex flex-wrap gap-3 mb-6 items-center">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
            >
              <option>Tous</option>
              <option>En attente</option>
              <option>Validé</option>
              <option>Refusé</option>
            </select>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
            >
              <option>Toutes</option>
              {COURSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Nom, référence, téléphone…"
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm min-w-[200px] flex-1 max-w-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={sortAlpha}
                onChange={(e) => setSortAlpha(e.target.checked)}
              />
              A → Z
            </label>
            <span className="text-sm text-stone-500">{filtered.length} inscription(s)</span>
            <div className="ml-auto flex gap-2">
              <a
                href="/api/export"
                className="bg-[#A1532D] text-white px-4 py-2 rounded-full text-sm font-medium"
              >
                Export TMH (validées)
              </a>
              <a
                href="/api/export?onlyNew=true"
                className="bg-stone-700 text-white px-4 py-2 rounded-full text-sm font-medium"
              >
                Export nouvelles
              </a>
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-2xl border border-stone-200">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-left">
                <tr>
                  <th className="p-3">Réf.</th>
                  <th className="p-3">Nom</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Paiement</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} className="border-t border-stone-100">
                    <td className="p-3 font-mono text-xs">{i.reference}</td>
                    <td className="p-3">
                      {i.prenom} {i.nom}
                      <div className="text-xs text-stone-500">{i.email}</div>
                    </td>
                    <td className="p-3">{i.course}</td>
                    <td className="p-3 text-xs">
                      {i.operateur && <div>{i.operateur}</div>}
                      {i.referencePaiement && <div>{i.referencePaiement}</div>}
                      {i.montantDeclare != null && (
                        <div>{Number(i.montantDeclare).toLocaleString()} Ar</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          i.statut === "Validé"
                            ? "bg-green-100 text-green-800"
                            : i.statut === "Refusé"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {i.statut}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {i.statut === "En attente" && (
                          <>
                            <button
                              onClick={() => actionInscription(i.id, "valider")}
                              className="text-green-700 text-xs font-medium hover:underline"
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => actionInscription(i.id, "refuser")}
                              className="text-red-700 text-xs font-medium hover:underline"
                            >
                              Refuser
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteInscription(i.id, `${i.prenom} ${i.nom}`)}
                          className="text-stone-500 text-xs font-medium hover:underline hover:text-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-500">
                      Aucune inscription
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== CONTENU ========== */}
      {tab === "contenu" && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6 max-w-3xl">
          <h2 className="text-xl font-bold text-[#1F2C3F]">Textes & informations</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Titre principal (hero)</label>
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              value={settings.hero_titre}
              onChange={(e) => setSettings({ ...settings, hero_titre: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sous-titre</label>
            <textarea
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              rows={2}
              value={settings.hero_sous_titre}
              onChange={(e) => setSettings({ ...settings, hero_sous_titre: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">IMAGE PRINCIPALE DE LA PAGE D&apos;ACCUEIL (URL)</label>
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2 mb-2"
              placeholder="https://... ou uploadez ci-dessous"
              value={(settings as any).hero_image_url || ""}
              onChange={(e) => setSettings({ ...settings, hero_image_url: e.target.value } as any)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await uploadImage(f, "hero");
                if (url) setSettings({ ...settings, hero_image_url: url } as any);
              }}
            />
            {(settings as any).hero_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(settings as any).hero_image_url} alt="Hero" className="mt-2 h-32 object-cover rounded-lg" />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date de l&apos;événement (ISO)</label>
              <input
                className="w-full border border-stone-300 rounded-lg px-4 py-2"
                value={settings.date_evenement}
                onChange={(e) => setSettings({ ...settings, date_evenement: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lieu</label>
              <input
                className="w-full border border-stone-300 rounded-lg px-4 py-2"
                value={settings.lieu_evenement}
                onChange={(e) => setSettings({ ...settings, lieu_evenement: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Texte page Événements</label>
            <textarea
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              rows={3}
              value={settings.texte_evenements || ""}
              onChange={(e) => setSettings({ ...settings, texte_evenements: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Texte page Courses</label>
            <textarea
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              rows={3}
              value={settings.texte_courses || ""}
              onChange={(e) => setSettings({ ...settings, texte_courses: e.target.value })}
            />
          </div>

          <h3 className="text-lg font-semibold text-[#1F2C3F] pt-4">Tarifs (Ariary)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(
              [
                ["tarif_zaza", "Zaza Tafaray"],
                ["tarif_decouverte", "Trail Découverte"],
                ["tarif_endurance", "Trail Endurance"],
                ["tarif_intense", "Trail Intense"],
                ["tarif_vtt", "VTT BEKA"],
                ["tarif_duathlon", "Duathlon Nature"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1">{label}</label>
                <input
                  type="number"
                  className="w-full border border-stone-300 rounded-lg px-3 py-2"
                  value={settings[key]}
                  onChange={(e) =>
                    setSettings({ ...settings, [key]: Number(e.target.value) })
                  }
                />
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-[#1F2C3F] pt-4">Pages légales</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Mentions légales</label>
            <textarea className="w-full border border-stone-300 rounded-lg px-4 py-2" rows={5}
              value={(settings as any).mentions_legales || ""}
              onChange={(e) => setSettings({ ...settings, mentions_legales: e.target.value } as any)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Politique de confidentialité</label>
            <textarea className="w-full border border-stone-300 rounded-lg px-4 py-2" rows={5}
              value={(settings as any).politique_confidentialite || ""}
              onChange={(e) => setSettings({ ...settings, politique_confidentialite: e.target.value } as any)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Règlement de participation</label>
            <textarea className="w-full border border-stone-300 rounded-lg px-4 py-2" rows={5}
              value={settings.texte_reglement || ""}
              onChange={(e) => setSettings({ ...settings, texte_reglement: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Texte CTA partenaires</label>
            <textarea className="w-full border border-stone-300 rounded-lg px-4 py-2" rows={2}
              value={(settings as any).texte_partenaires_cta || ""}
              onChange={(e) => setSettings({ ...settings, texte_partenaires_cta: e.target.value } as any)} />
          </div>
          <button
            onClick={saveSettings}
            className="bg-[#1F2C3F] text-white px-6 py-3 rounded-full font-medium"
          >
            Enregistrer le contenu
          </button>
        </div>
      )}

      {/* ========== VISIBILITÉ ========== */}
      {tab === "visibilite" && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-xl space-y-5">
          <h2 className="text-xl font-bold text-[#1F2C3F] mb-2">Afficher / Masquer les modules</h2>
          {(
            [
              ["inscriptions_ouvertes", "Inscriptions ouvertes"],
              ["resultats_visibles", "Résultats visibles"],
              ["partenaires_visibles", "Partenaires visibles"],
              ["actualites_visibles", "Actualités visibles"],
            ] as const
          ).map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between py-3 border-b border-stone-100"
            >
              <span className="font-medium">{label}</span>
              <button
                onClick={() => toggleSetting(key, !settings[key])}
                className={`relative w-14 h-8 rounded-full transition ${
                  settings[key] ? "bg-green-500" : "bg-stone-300"
                }`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition ${
                    settings[key] ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
          <p className="text-xs text-stone-500 pt-2">
            Les changements sont enregistrés immédiatement et visibles sur le site public.
          </p>
        </div>
      )}

      {/* ========== MOBILE MONEY ========== */}
      {tab === "mobile" && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-xl space-y-5">
          <h2 className="text-xl font-bold text-[#1F2C3F]">Coordonnées Mobile Money</h2>
          <div>
            <label className="block text-sm font-medium mb-1">MVola</label>
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              placeholder="034 XX XXX XX"
              value={settings.mobile_money_mvola || ""}
              onChange={(e) =>
                setSettings({ ...settings, mobile_money_mvola: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Orange Money</label>
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              placeholder="032 XX XXX XX"
              value={settings.mobile_money_orange || ""}
              onChange={(e) =>
                setSettings({ ...settings, mobile_money_orange: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Airtel Money</label>
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              placeholder="033 XX XXX XX"
              value={settings.mobile_money_airtel || ""}
              onChange={(e) =>
                setSettings({ ...settings, mobile_money_airtel: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bénéficiaire</label>
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              value={(settings as any).mm_beneficiaire || ""}
              onChange={(e) =>
                setSettings({ ...settings, mm_beneficiaire: e.target.value } as any)
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Titulaire du compte</label>
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              value={(settings as any).mm_titulaire || ""}
              onChange={(e) =>
                setSettings({ ...settings, mm_titulaire: e.target.value } as any)
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instructions de paiement</label>
            <textarea
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              rows={2}
              value={(settings as any).mm_instructions || ""}
              onChange={(e) =>
                setSettings({ ...settings, mm_instructions: e.target.value } as any)
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tarif navette (Ar / personne)</label>
            <input
              type="number"
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              value={(settings as any).tarif_navette ?? 20000}
              onChange={(e) =>
                setSettings({ ...settings, tarif_navette: Number(e.target.value) } as any)
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mode frais retrait</label>
            <select
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              value={(settings as any).mm_frais_mode || "fixe"}
              onChange={(e) =>
                setSettings({ ...settings, mm_frais_mode: e.target.value } as any)
              }
            >
              <option value="fixe">Fixe (Ar)</option>
              <option value="pourcent">Pourcentage (%)</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs mb-1">Frais MVola</label>
              <input type="number" className="w-full border rounded-lg px-2 py-2"
                value={(settings as any).mm_frais_mvola ?? 0}
                onChange={(e) => setSettings({ ...settings, mm_frais_mvola: Number(e.target.value) } as any)} />
            </div>
            <div>
              <label className="block text-xs mb-1">Frais Orange</label>
              <input type="number" className="w-full border rounded-lg px-2 py-2"
                value={(settings as any).mm_frais_orange ?? 0}
                onChange={(e) => setSettings({ ...settings, mm_frais_orange: Number(e.target.value) } as any)} />
            </div>
            <div>
              <label className="block text-xs mb-1">Frais Airtel</label>
              <input type="number" className="w-full border rounded-lg px-2 py-2"
                value={(settings as any).mm_frais_airtel ?? 0}
                onChange={(e) => setSettings({ ...settings, mm_frais_airtel: Number(e.target.value) } as any)} />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-[#1F2C3F] pt-2">Moyens affichés au public</h3>
          <p className="text-xs text-stone-500">Cochez les opérateurs visibles sur le formulaire d&apos;inscription.</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={(settings as any).pay_mvola_actif !== false}
                onChange={(e) => setSettings({ ...settings, pay_mvola_actif: e.target.checked } as any)} />
              MVola
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={(settings as any).pay_orange_actif !== false}
                onChange={(e) => setSettings({ ...settings, pay_orange_actif: e.target.checked } as any)} />
              Orange Money
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={(settings as any).pay_airtel_actif !== false}
                onChange={(e) => setSettings({ ...settings, pay_airtel_actif: e.target.checked } as any)} />
              Airtel Money
            </label>
          </div>

          <h3 className="text-lg font-semibold text-[#1F2C3F] pt-2">Notifications après validation</h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!(settings as any).notif_email_actif}
              onChange={(e) => setSettings({ ...settings, notif_email_actif: e.target.checked } as any)} />
            E-mail automatique (Gmail SMTP ou Resend — variables Vercel)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!(settings as any).notif_sms_actif}
              onChange={(e) => setSettings({ ...settings, notif_sms_actif: e.target.checked } as any)} />
            SMS automatique (nécessite Twilio sur Vercel)
          </label>
          <div>
            <label className="block text-sm font-medium mb-1">Message type (placeholders: {'{prenom}'}, {'{reference}'}, {'{course}'})</label>
            <textarea className="w-full border rounded-lg px-3 py-2" rows={3}
              value={(settings as any).notif_message_valide || ""}
              onChange={(e) => setSettings({ ...settings, notif_message_valide: e.target.value } as any)} />
          </div>

          <button
            onClick={saveSettings}
            className="bg-[#1F2C3F] text-white px-6 py-3 rounded-full font-medium"
          >
            Enregistrer
          </button>

          <h3 className="text-lg font-semibold text-[#1F2C3F] pt-6">Aide validation — coller un SMS MVola</h3>
          <p className="text-xs text-stone-500">
            Le site ne peut pas lire automatiquement votre téléphone. Collez ici le SMS reçu :
            le système propose les inscriptions « En attente » dont la référence de paiement correspond.
          </p>
          <textarea className="w-full border rounded-lg px-3 py-2" rows={4} placeholder="Coller le SMS ici..."
            value={smsTexte} onChange={(e) => setSmsTexte(e.target.value)} />
          <button type="button" onClick={matchSmsPaiement}
            className="border border-stone-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-stone-50">
            Chercher les correspondances
          </button>
          {smsMsg && <p className="text-sm text-stone-600">{smsMsg}</p>}
          {smsMatches.length > 0 && (
            <ul className="space-y-2">
              {smsMatches.map((m) => (
                <li key={m.id} className="bg-stone-50 border rounded-xl p-3 flex flex-wrap justify-between gap-2 items-center text-sm">
                  <div>
                    <strong>{m.prenom} {m.nom}</strong> — {m.course}
                    <div className="text-xs text-stone-500">Réf. site {m.reference} · Paiement {m.referencePaiement} · {m.montantDeclare} Ar</div>
                  </div>
                  <button type="button" className="text-green-700 font-medium hover:underline"
                    onClick={() => actionInscription(m.id, "valider")}>
                    Valider
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ========== PARTENAIRES ========== */}
      {tab === "partenaires" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-2xl space-y-4">
            <h2 className="text-xl font-bold text-[#1F2C3F]">Ajouter un partenaire</h2>
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              placeholder="Nom"
              value={partenaireForm.nom}
              onChange={(e) => setPartenaireForm({ ...partenaireForm, nom: e.target.value })}
            />
            <select
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              value={partenaireForm.type}
              onChange={(e) => setPartenaireForm({ ...partenaireForm, type: e.target.value })}
            >
              <option value="sponsor_officiel">Sponsor officiel</option>
              <option value="sponsor_principal">Sponsor principal</option>
              <option value="partenaire_officiel">Partenaire officiel</option>
              <option value="institutionnel">Partenaire institutionnel</option>
              <option value="technique">Partenaire technique</option>
              <option value="media">Partenaire média</option>
              <option value="logistique">Partenaire logistique</option>
              <option value="autre">Autre partenaire</option>
            </select>
            <textarea
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              placeholder="Description"
              rows={2}
              value={partenaireForm.description}
              onChange={(e) =>
                setPartenaireForm({ ...partenaireForm, description: e.target.value })
              }
            />
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              placeholder="URL du logo"
              value={partenaireForm.logo_url}
              onChange={(e) => setPartenaireForm({ ...partenaireForm, logo_url: e.target.value })}
            />
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await uploadImage(f, "partenaires");
                if (url) setPartenaireForm({ ...partenaireForm, logo_url: url });
              }}
            />
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              placeholder="Site web"
              value={partenaireForm.site_url}
              onChange={(e) => setPartenaireForm({ ...partenaireForm, site_url: e.target.value })}
            />
            <button
              onClick={addPartenaire}
              disabled={uploading}
              className="bg-[#1F2C3F] text-white px-6 py-2 rounded-full font-medium"
            >
              {uploading ? "Upload..." : "Ajouter"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partenaires.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-stone-200 p-4 flex gap-4 items-start"
              >
                {p.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo_url} alt="" className="w-16 h-16 object-contain" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">{p.nom}</div>
                  <div className="text-xs text-stone-500">{p.type}</div>
                  <div className="flex gap-3 mt-2 text-xs">
                    <button
                      onClick={() => togglePartenaire(p.id, !p.visible)}
                      className="text-blue-700 hover:underline"
                    >
                      {p.visible ? "Masquer" : "Afficher"}
                    </button>
                    <button
                      onClick={() => deletePartenaire(p.id)}
                      className="text-red-700 hover:underline"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== ACTUALITÉS ========== */}
      {tab === "actualites" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-2xl space-y-4">
            <h2 className="text-xl font-bold text-[#1F2C3F]">Nouvelle actualité</h2>
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              placeholder="Titre"
              value={actuForm.titre}
              onChange={(e) => setActuForm({ ...actuForm, titre: e.target.value })}
            />
            <textarea
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              placeholder="Contenu"
              rows={4}
              value={actuForm.contenu}
              onChange={(e) => setActuForm({ ...actuForm, contenu: e.target.value })}
            />
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              placeholder="URL image"
              value={actuForm.image_url}
              onChange={(e) => setActuForm({ ...actuForm, image_url: e.target.value })}
            />
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await uploadImage(f, "actualites");
                if (url) setActuForm({ ...actuForm, image_url: url });
              }}
            />
            <button
              onClick={addActualite}
              className="bg-[#1F2C3F] text-white px-6 py-2 rounded-full font-medium"
            >
              Publier
            </button>
          </div>

          <div className="space-y-3">
            {actualites.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-xl border border-stone-200 p-4 flex justify-between gap-4"
              >
                <div>
                  <div className="font-semibold">{a.titre}</div>
                  <div className="text-xs text-stone-500">{a.date_publication}</div>
                  <p className="text-sm text-stone-600 mt-1 line-clamp-2">{a.contenu}</p>
                </div>
                <div className="flex flex-col gap-2 text-xs shrink-0">
                  <button
                    onClick={() => toggleActualite(a.id, !a.visible)}
                    className="text-blue-700 hover:underline"
                  >
                    {a.visible ? "Masquer" : "Afficher"}
                  </button>
                  <button
                    onClick={() => deleteActualite(a.id)}
                    className="text-red-700 hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== PHOTOS ========== */}
      {tab === "photos" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-2xl space-y-4">
            <h2 className="text-xl font-bold text-[#1F2C3F]">Ajouter une photo</h2>
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              placeholder="Titre"
              value={photoForm.titre}
              onChange={(e) => setPhotoForm({ ...photoForm, titre: e.target.value })}
            />
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              placeholder="URL de l'image"
              value={photoForm.url}
              onChange={(e) => setPhotoForm({ ...photoForm, url: e.target.value })}
            />
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await uploadImage(f, "galerie");
                if (url) setPhotoForm({ ...photoForm, url });
              }}
            />
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2"
              placeholder="Album (ex: general, 2026, course)"
              value={photoForm.album}
              onChange={(e) => setPhotoForm({ ...photoForm, album: e.target.value })}
            />
            <button
              onClick={addPhoto}
              disabled={uploading}
              className="bg-[#1F2C3F] text-white px-6 py-2 rounded-full font-medium"
            >
              {uploading ? "Upload..." : "Ajouter"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.titre || ""} className="w-full h-32 object-cover" />
                <div className="p-2 text-xs">
                  <div className="font-medium truncate">{p.titre || "Sans titre"}</div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => togglePhoto(p.id, !p.visible)}
                      className="text-blue-700"
                    >
                      {p.visible ? "Masquer" : "Afficher"}
                    </button>
                    <button onClick={() => deletePhoto(p.id)} className="text-red-700">
                      Suppr.
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      
      {tab === "categories" && <CategoriesAdmin />}
      {tab === "documents" && <DocumentsAdmin />}
      {tab === "audit" && <AuditAdmin />}
      {tab === "footer" && (
        <FooterAdmin settings={settings} setSettings={setSettings} saveSettings={saveSettings} />
      )}
      {tab === "courses" && <CoursesAdmin />}

{/* ========== RÉSULTATS ========== */}
      {tab === "resultats" && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-3xl space-y-4">
          <h2 className="text-xl font-bold text-[#1F2C3F]">Importer les résultats</h2>
          <p className="text-sm text-stone-600">
            Collez un tableau JSON. Format attendu :
            <code className="block mt-1 text-xs bg-stone-50 p-2 rounded">
              {`[{"position":1,"nom":"Rakoto","temps":"2:15:30","course":"Trail Endurance","categorie":"SEH","genre":"H"}]`}
            </code>
          </p>
          <textarea
            className="w-full border border-stone-300 rounded-lg px-4 py-3 font-mono text-xs"
            rows={12}
            value={resultatsText}
            onChange={(e) => setResultatsText(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              onClick={saveResultats}
              className="bg-[#1F2C3F] text-white px-6 py-2 rounded-full font-medium"
            >
              Enregistrer les résultats
            </button>
            <button
              onClick={() =>
                toggleSetting("resultats_visibles", !settings.resultats_visibles)
              }
              className="border border-stone-300 px-6 py-2 rounded-full text-sm"
            >
              {settings.resultats_visibles
                ? "Masquer sur le site"
                : "Afficher sur le site"}
            </button>
          </div>
          <p className="text-sm text-stone-500">{resultats.length} résultat(s) en base</p>
        </div>
      )}
    </div>
  );
}
