"use client";

import { useCallback, useEffect, useState } from "react";

type Sponsor = {
  id: string;
  nom: string;
  image_url: string;
  site_url?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  actif: boolean;
  ordre: number;
  afficher_popup: boolean;
  afficher_bande: boolean;
  vues: number;
  clics: number;
};

const empty = {
  nom: "",
  image_url: "",
  site_url: "",
  date_debut: "",
  date_fin: "",
  actif: true,
  ordre: 0,
  afficher_popup: false,
  afficher_bande: true,
};

export default function SponsorsAdmin() {
  const [list, setList] = useState<Sponsor[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/sponsors");
    if (res.ok) {
      const d = await res.json();
      setList(d.sponsors || []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (file: File) => {
    setUploading(true);
    setMsg("");
    const fd = new FormData();
    fd.set("action", "upload_image");
    fd.set("file", file);
    const res = await fetch("/api/admin/sponsors", { method: "POST", body: fd });
    const d = await res.json();
    setUploading(false);
    if (!res.ok) {
      setMsg(d.error || "Erreur upload");
      return;
    }
    setForm((f) => ({ ...f, image_url: d.url }));
    setMsg("Image enregistrée");
  };

  const save = async () => {
    setMsg("");
    if (!form.nom.trim()) {
      setMsg("Le nom est obligatoire");
      return;
    }
    const body = editId
      ? { action: "update", id: editId, ...form }
      : { action: "create", ...form };
    const res = await fetch("/api/admin/sponsors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!res.ok) {
      setMsg(d.error || "Erreur");
      return;
    }
    setMsg(editId ? "Sponsor mis à jour" : "Sponsor créé");
    setForm({ ...empty });
    setEditId(null);
    await load();
  };

  const startEdit = (s: Sponsor) => {
    setEditId(s.id);
    setForm({
      nom: s.nom,
      image_url: s.image_url || "",
      site_url: s.site_url || "",
      date_debut: s.date_debut ? String(s.date_debut).slice(0, 10) : "",
      date_fin: s.date_fin ? String(s.date_fin).slice(0, 10) : "",
      actif: s.actif,
      ordre: s.ordre,
      afficher_popup: s.afficher_popup,
      afficher_bande: s.afficher_bande,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#1F2C3F]">Sponsors (publicité)</h2>
        <p className="text-sm text-stone-600 mt-1">
          Pop-up (une fois par visite) et bande de logos en bas des pages publiques. Compteurs
          anonymes uniquement.
        </p>
      </div>

      {msg && (
        <div className="text-sm bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">{msg}</div>
      )}

      <section className="border border-stone-200 rounded-2xl p-5 space-y-3 max-w-xl">
        <h3 className="font-semibold">{editId ? "Modifier" : "Ajouter"} un sponsor</h3>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Nom *"
          value={form.nom}
          onChange={(e) => setForm({ ...form, nom: e.target.value })}
        />
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Lien site (https://…)"
          value={form.site_url}
          onChange={(e) => setForm({ ...form, site_url: e.target.value })}
        />
        <div>
          <label className="text-xs text-stone-500">Image PNG / JPG / WebP (max 2 Mo)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block mt-1 text-sm"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          {form.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} alt="" className="mt-2 max-h-16 object-contain" />
          )}
          {uploading && <p className="text-xs text-stone-500">Upload…</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs">Début</label>
            <input
              type="date"
              className="w-full border rounded-lg px-2 py-2 text-sm"
              value={form.date_debut}
              onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs">Fin</label>
            <input
              type="date"
              className="w-full border rounded-lg px-2 py-2 text-sm"
              value={form.date_fin}
              onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="text-xs">Ordre d&apos;affichage</label>
          <input
            type="number"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.ordre}
            onChange={(e) => setForm({ ...form, ordre: Number(e.target.value) })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.actif}
            onChange={(e) => setForm({ ...form, actif: e.target.checked })}
          />
          Actif
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.afficher_popup}
            onChange={(e) => setForm({ ...form, afficher_popup: e.target.checked })}
          />
          Afficher en pop-up
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.afficher_bande}
            onChange={(e) => setForm({ ...form, afficher_bande: e.target.checked })}
          />
          Afficher dans la bande de logos
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            className="bg-[#1F2C3F] text-white px-5 py-2 rounded-full text-sm font-medium"
          >
            {editId ? "Enregistrer" : "Créer"}
          </button>
          {editId && (
            <button
              type="button"
              className="border px-4 py-2 rounded-full text-sm"
              onClick={() => {
                setEditId(null);
                setForm({ ...empty });
              }}
            >
              Annuler
            </button>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-[#1F2C3F]">Liste ({list.length})</h3>
        {list.length === 0 && (
          <p className="text-sm text-stone-500">Aucun sponsor. Créez-en un ci-dessus.</p>
        )}
        {list.map((s) => (
          <div
            key={s.id}
            className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              {s.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image_url} alt="" className="h-10 w-16 object-contain" />
              ) : (
                <div className="h-10 w-16 bg-stone-100 rounded" />
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {s.nom}{" "}
                  {!s.actif && (
                    <span className="text-xs text-stone-400">(désactivé)</span>
                  )}
                </p>
                <p className="text-xs text-stone-500">
                  Ordre {s.ordre} · Pop-up {s.afficher_popup ? "oui" : "non"} · Bande{" "}
                  {s.afficher_bande ? "oui" : "non"} · Vues {s.vues ?? 0} · Clics {s.clics ?? 0}
                </p>
              </div>
            </div>
            <div className="flex gap-2 text-sm">
              <button type="button" className="text-blue-700" onClick={() => startEdit(s)}>
                Modifier
              </button>
              <button
                type="button"
                className="text-stone-600"
                onClick={async () => {
                  await fetch("/api/admin/sponsors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "update", id: s.id, actif: !s.actif }),
                  });
                  await load();
                }}
              >
                {s.actif ? "Désactiver" : "Activer"}
              </button>
              <button
                type="button"
                className="text-red-700"
                onClick={async () => {
                  if (!confirm("Supprimer ce sponsor ?")) return;
                  await fetch("/api/admin/sponsors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "delete", id: s.id }),
                  });
                  await load();
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
