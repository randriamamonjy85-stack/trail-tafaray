"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { COURSES } from "@/lib/types";
import CertificatsAdmin from "@/components/admin/CertificatsAdmin";
import SponsorsAdmin from "@/components/admin/SponsorsAdmin";
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
  | "footer"
  | "certificats"
  | "sponsors";

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
  hero_image_url?: string;
  evenement_image_url?: string;
  countdown_bg_url?: string;
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
  hero_image_url: "",
  evenement_image_url: "",
  countdown_bg_url: "",
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
  const [smsTexte, setSmsTexte] = useState("");
  const [smsMatches, setSmsMatches] = useState<any[]>([]);
  const [smsMsg, setSmsMsg] = useState("");
  const [gate, setGate] = useState<{ id: string; status: "checking" | "ok" | "denied" }>({
    id: "",
    status: "checking",
  });

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

  const sessionKey = session?.user?.id ?? "";
  if (gate.id !== sessionKey) {
    setGate({ id: sessionKey, status: "checking" });
  }
  const adminOk = sessionKey !== "" && gate.id === sessionKey && gate.status === "ok";
  const adminDenied = sessionKey !== "" && gate.id === sessionKey && gate.status === "denied";

  useEffect(() => {
    if (!sessionKey) return;
    let cancelled = false;
    fetch("/api/admin/me")
      .then((r) => {
        if (cancelled) return;
        const status = r.ok ? "ok" : "denied";
        setGate({ id: sessionKey, status });
        if (r.ok) {
          loadInscriptions();
          loadSettings();
          loadPartenaires();
          loadActualites();
          loadPhotos();
        }
      })
      .catch(() => {
        if (!cancelled) setGate({ id: sessionKey, status: "denied" });
      });
    return () => {
      cancelled = true;
    };
    // Chargement initial une fois le droit admin confirmé.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

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

    if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-stone-300">
        Chargement de l&apos;administration…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-stone-100">
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F2C3F] text-white font-bold mb-4">
              TT
            </div>
            <h1 className="text-2xl font-bold text-[#1F2C3F]">Administration</h1>
            <p className="text-sm text-stone-500 mt-1">Trail Tafaray — accès réservé</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@…"
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b4dff]/40"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b4dff]/40"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#5b4dff] hover:bg-[#4a3de0] text-white py-3 rounded-xl font-semibold text-sm transition"
            >
              Connexion
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!adminOk) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-stone-100 text-center">
          {!adminDenied ? (
            <p className="text-stone-600">Vérification des droits…</p>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#1F2C3F]">Accès refusé</h1>
              <p className="text-sm text-stone-600 mt-3">
                Ce compte n&apos;est pas administrateur, ou la liste ADMIN_EMAILS n&apos;est pas
                renseignée sur le serveur. Sans cette liste, personne n&apos;a accès à
                l&apos;administration.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-6 border border-stone-300 px-4 py-2 rounded-full text-sm"
              >
                Se déconnecter
              </button>
            </>
          )}
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

  const navGroups: { title: string; items: { id: Tab; label: string; icon: string }[] }[] = [
    {
      title: "Gestion",
      items: [
        { id: "inscriptions", label: "Inscriptions", icon: "📋" },
        { id: "mobile", label: "Mobile Money", icon: "💳" },
        { id: "courses", label: "Courses", icon: "🏃" },
        { id: "categories", label: "Catégories âge", icon: "🏷️" },
      ],
    },
    {
      title: "Contenu du site",
      items: [
        { id: "contenu", label: "Textes & accueil", icon: "✏️" },
        { id: "visibilite", label: "Visibilité modules", icon: "👁️" },
        { id: "partenaires", label: "Partenaires", icon: "🤝" },
        { id: "sponsors", label: "Sponsors", icon: "📢" },
        { id: "actualites", label: "Actualités", icon: "📰" },
        { id: "photos", label: "Photos", icon: "🖼️" },
        { id: "documents", label: "Documents", icon: "📄" },
        { id: "footer", label: "Pied de page", icon: "⬇️" },
        { id: "certificats", label: "Certificats", icon: "🏅" },
        { id: "resultats", label: "Résultats", icon: "🏆" },
      ],
    },
    {
      title: "Système",
      items: [{ id: "audit", label: "Journal audit", icon: "🔒" }],
    },
  ];

  const currentLabel =
    navGroups.flatMap((g) => g.items).find((i) => i.id === tab)?.label || "Administration";

  return (
    <div className="min-h-screen bg-[#eef1f6] flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-[#0f172a] text-stone-300">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#5b4dff] flex items-center justify-center text-white text-xs font-bold">
              TT
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Trail Tafaray</p>
              <p className="text-[11px] text-stone-400">Administration</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="px-2 mb-2 text-[10px] uppercase tracking-widest text-stone-500 font-semibold">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition ${
                      tab === item.id
                        ? "bg-[#5b4dff] text-white shadow-sm"
                        : "text-stone-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="text-base leading-none w-5 text-center">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 text-[11px] text-stone-500">
          Connecté
          <p className="text-stone-300 truncate mt-0.5">{session.user.email}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-stone-200/80 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="md:hidden">
              <select
                value={tab}
                onChange={(e) => setTab(e.target.value as Tab)}
                className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm max-w-[11rem]"
              >
                {navGroups.flatMap((g) =>
                  g.items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.label}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-stone-400 font-medium">
                Paramètres
              </p>
              <h1 className="text-lg sm:text-xl font-bold text-[#1F2C3F] truncate">
                {currentLabel}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-stone-500 truncate max-w-[180px]">
              {session.user.email}
            </span>
            <span className="hidden sm:inline text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#5b4dff]/10 text-[#5b4dff]">
              Administrateur
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-stone-500 hover:text-[#5b4dff] font-medium"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {message && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm">
              {message}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-4 sm:p-6">
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
            <div className="ml-auto flex flex-wrap gap-2">
              <a
                href="/api/export?mark=0"
                className="border border-stone-300 text-stone-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-stone-50"
                title="Télécharge le CSV sans marquer les lignes comme exportées"
              >
                Prévisualiser CSV
              </a>
              <a
                href="/api/export"
                className="bg-[#A1532D] text-white px-4 py-2 rounded-full text-sm font-medium"
                title="Export toutes les validées et marque comme exportées"
              >
                Export TMH (validées)
              </a>
              <a
                href="/api/export?nouvelles=1"
                className="bg-stone-700 text-white px-4 py-2 rounded-full text-sm font-medium"
                title="Seulement les validées pas encore exportées"
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
            <label className="block text-sm font-medium mb-1">Image page Événements (affichée à côté du texte, URL)</label>
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2 mb-2"
              placeholder="https://... ou uploadez ci-dessous"
              value={(settings as any).evenement_image_url || ""}
              onChange={(e) => setSettings({ ...settings, evenement_image_url: e.target.value } as any)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await uploadImage(f, "evenements");
                if (url) setSettings({ ...settings, evenement_image_url: url } as any);
              }}
            />
            {(settings as any).evenement_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(settings as any).evenement_image_url} alt="Événement" className="mt-2 h-32 object-cover rounded-lg" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image de fond sous le compte à rebours (accueil)</label>
            <input
              className="w-full border border-stone-300 rounded-lg px-4 py-2 mb-2"
              placeholder="https://... ou uploadez ci-dessous"
              value={(settings as any).countdown_bg_url || ""}
              onChange={(e) => setSettings({ ...settings, countdown_bg_url: e.target.value } as any)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await uploadImage(f, "countdown");
                if (url) setSettings({ ...settings, countdown_bg_url: url } as any);
              }}
            />
            {(settings as any).countdown_bg_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(settings as any).countdown_bg_url} alt="Fond compte à rebours" className="mt-2 h-32 object-cover rounded-lg" />
            )}
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
      {tab === "certificats" && <CertificatsAdmin />}
      {tab === "sponsors" && <SponsorsAdmin />}

      {tab === "resultats" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-950">
            <p className="font-semibold">Saisie manuelle des temps désactivée</p>
            <p className="mt-1">
              La source officielle est TMH / GmCAP. Utilisez l&apos;onglet{" "}
              <strong>Certificats</strong> pour importer le fichier résultats-certificats
              (13 colonnes). L&apos;ancien import JSON n&apos;est plus accepté par le serveur.
            </p>
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}
