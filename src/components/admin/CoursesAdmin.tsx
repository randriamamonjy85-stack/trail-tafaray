"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  nom: string;
  slug: string;
  distance: string;
  denivele: string;
  type_epreuve: string;
  tarif: number;
  heure_depart: string;
  niveau: string;
  description: string;
  historique: string;
  particularites: string;
  conditions: string;
  image_url: string;
  carte_url: string;
  profil_url: string;
  gpx_url: string;
  tee_shirt: boolean;
  active: boolean;
  ordre: number;
};

const empty: Partial<Course> = {
  nom: "",
  slug: "",
  distance: "",
  denivele: "",
  type_epreuve: "RUN",
  tarif: 0,
  heure_depart: "",
  niveau: "",
  description: "",
  historique: "",
  particularites: "",
  conditions: "",
  image_url: "",
  carte_url: "",
  profil_url: "",
  gpx_url: "",
  tee_shirt: true,
  active: true,
  ordre: 0,
};

export default function CoursesAdmin() {
  const supabase = createClient();
  const [list, setList] = useState<Course[]>([]);
  const [edit, setEdit] = useState<Partial<Course> | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("courses").select("*").order("ordre");
    setList((data as Course[]) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const save = async () => {
    if (!edit?.nom) return alert("Nom requis");
    const payload = {
      ...edit,
      slug: edit.slug || slugify(edit.nom),
      tarif: Number(edit.tarif) || 0,
      ordre: Number(edit.ordre) || 0,
    };
    if (edit.id) {
      const { id, ...rest } = payload as Course;
      const { error } = await supabase.from("courses").update(rest).eq("id", id);
      if (error) return alert(error.message);
    } else {
      const { error } = await supabase.from("courses").insert(payload);
      if (error) return alert(error.message);
    }
    setEdit(null);
    load();
  };

  const upload = async (file: File, field: keyof Course) => {
    setUploading(true);
    const path = `courses/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("photos").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) return alert(error.message);
    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    setEdit((e) => ({ ...e, [field]: data.publicUrl }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#1F2C3F]">Courses</h2>
        <button
          onClick={() => setEdit({ ...empty })}
          className="bg-[#1F2C3F] text-white px-4 py-2 rounded-full text-sm"
        >
          + Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {list.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap justify-between gap-2 items-center"
          >
            <div>
              <div className="font-semibold">
                {c.nom}{" "}
                {!c.active && (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    désactivée
                  </span>
                )}
              </div>
              <div className="text-xs text-stone-500">
                {c.distance} · {Number(c.tarif).toLocaleString("fr-MG")} Ar · ordre {c.ordre}
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <a href={`/courses/${c.slug}`} className="text-stone-500 hover:underline" target="_blank">
                Voir
              </a>
              <button onClick={() => setEdit(c)} className="text-[#A1532D] hover:underline">
                Modifier
              </button>
              <button
                onClick={async () => {
                  await supabase.from("courses").update({ active: !c.active }).eq("id", c.id);
                  load();
                }}
                className="text-stone-600 hover:underline"
              >
                {c.active ? "Désactiver" : "Activer"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {edit && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-3 max-w-2xl">
          <h3 className="font-bold text-[#1F2C3F]">
            {edit.id ? "Modifier la course" : "Nouvelle course"}
          </h3>
          {(
            [
              ["nom", "Nom"],
              ["slug", "Slug (URL)"],
              ["distance", "Distance"],
              ["denivele", "Dénivelé"],
              ["type_epreuve", "Type"],
              ["heure_depart", "Heure de départ"],
              ["niveau", "Niveau"],
            ] as const
          ).map(([k, lab]) => (
            <div key={k}>
              <label className="text-xs font-medium">{lab}</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={(edit as any)[k] || ""}
                onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium">Tarif (Ar)</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2"
              value={edit.tarif ?? 0}
              onChange={(e) => setEdit({ ...edit, tarif: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Ordre</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2"
              value={edit.ordre ?? 0}
              onChange={(e) => setEdit({ ...edit, ordre: Number(e.target.value) })}
            />
          </div>
          {(["description", "historique", "particularites", "conditions"] as const).map((k) => (
            <div key={k}>
              <label className="text-xs font-medium capitalize">{k}</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                rows={2}
                value={(edit as any)[k] || ""}
                onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
              />
            </div>
          ))}
          {(["image_url", "carte_url", "profil_url", "gpx_url"] as const).map((k) => (
            <div key={k}>
              <label className="text-xs font-medium">{k}</label>
              <input
                className="w-full border rounded-lg px-3 py-2 mb-1"
                value={(edit as any)[k] || ""}
                onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
              />
              <input
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f, k);
                }}
              />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={edit.tee_shirt !== false}
              onChange={(e) => setEdit({ ...edit, tee_shirt: e.target.checked })}
            />
            T-shirt inclus
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={edit.active !== false}
              onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
            />
            Active (visible)
          </label>
          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              disabled={uploading}
              className="bg-[#1F2C3F] text-white px-5 py-2 rounded-full text-sm"
            >
              {uploading ? "Upload..." : "Enregistrer"}
            </button>
            <button onClick={() => setEdit(null)} className="text-sm text-stone-500">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
