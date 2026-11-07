"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Doc = {
  id?: string;
  titre: string;
  description: string;
  url: string;
  type_doc: string;
  visible: boolean;
  ordre: number;
};

export default function DocumentsAdmin() {
  const supabase = createClient();
  const [list, setList] = useState<Doc[]>([]);
  const [form, setForm] = useState<Doc>({
    titre: "",
    description: "",
    url: "",
    type_doc: "reglement",
    visible: true,
    ordre: 0,
  });

  const load = async () => {
    const { data } = await supabase.from("documents").select("*").order("ordre");
    setList((data as Doc[]) || []);
  };
  useEffect(() => {
    load();
  }, []);

  const upload = async (file: File) => {
    const path = `docs/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("photos").upload(path, file, { upsert: true });
    if (error) return alert(error.message);
    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    setForm((f) => ({ ...f, url: data.publicUrl }));
  };

  const add = async () => {
    if (!form.titre || !form.url) return alert("Titre et fichier/URL requis");
    const { error } = await supabase.from("documents").insert(form);
    if (error) return alert(error.message);
    setForm({ titre: "", description: "", url: "", type_doc: "reglement", visible: true, ordre: 0 });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    await supabase.from("documents").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#1F2C3F]">Documents téléchargeables</h2>
      <div className="bg-white border rounded-2xl p-5 space-y-3 max-w-xl">
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Titre"
          value={form.titre}
          onChange={(e) => setForm({ ...form, titre: e.target.value })}
        />
        <textarea
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select
          className="w-full border rounded-lg px-3 py-2"
          value={form.type_doc}
          onChange={(e) => setForm({ ...form, type_doc: e.target.value })}
        >
          <option value="reglement">Règlement</option>
          <option value="guide">Guide</option>
          <option value="carte">Carte / plan</option>
          <option value="gpx">GPX</option>
          <option value="autre">Autre</option>
        </select>
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="URL"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
        />
        <input type="file" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <button onClick={add} className="bg-[#1F2C3F] text-white px-5 py-2 rounded-full text-sm">
          Ajouter
        </button>
      </div>
      <ul className="space-y-2">
        {list.map((d) => (
          <li key={d.id} className="bg-white border rounded-xl p-3 flex justify-between gap-2">
            <div>
              <div className="font-medium">{d.titre}</div>
              <div className="text-xs text-stone-500">{d.type_doc}</div>
            </div>
            <button onClick={() => del(d.id!)} className="text-red-600 text-sm">
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
