"use client";

import { useCallback, useEffect, useState } from "react";

type Edition = {
  id: string;
  code: string;
  label: string;
  published: boolean;
  results_version: number;
  template_confirmed: boolean;
  results_public: boolean;
  template_bg_path?: string;
  previous_snapshot?: unknown;
};

export default function CertificatsAdmin() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [editionId, setEditionId] = useState("");
  const [newCode, setNewCode] = useState("2026");
  const [newLabel, setNewLabel] = useState("Trail Tafaray 2026");
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [resultsFile, setResultsFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/certificats");
    if (res.ok) {
      const data = await res.json();
      setEditions(data);
      if (!editionId && data[0]) setEditionId(data[0].id);
    }
  }, [editionId]);

  useEffect(() => {
    load();
  }, [load]);

  const ed = editions.find((e) => e.id === editionId);

  const postJson = async (body: object) => {
    const res = await fetch("/api/admin/certificats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Erreur");
    return data;
  };

  const createEdition = async () => {
    try {
      const data = await postJson({
        action: "create_edition",
        code: newCode,
        label: newLabel,
      });
      setMsg(`Édition ${data.code} créée`);
      await load();
      setEditionId(data.id);
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const previewResults = async () => {
    if (!resultsFile) return setMsg("Choisissez un fichier CSV ou XLSX");
    const fd = new FormData();
    fd.set("action", "preview_results");
    fd.set("file", resultsFile);
    const res = await fetch("/api/admin/certificats", { method: "POST", body: fd });
    const data = await res.json();
    setPreview(data);
    setMsg(data.ok ? "Aperçu OK — confirmez pour importer" : "Erreurs dans le fichier");
  };

  const confirmResults = async () => {
    if (!resultsFile || !editionId) return;
    if (!preview?.ok) return setMsg("Corrigez le fichier avant confirmation");
    const fd = new FormData();
    fd.set("action", "confirm_results");
    fd.set("edition_id", editionId);
    fd.set("file", resultsFile);
    const res = await fetch("/api/admin/certificats", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) setMsg(data.error || "Erreur import");
    else {
      setMsg(`Import version ${data.version} : ${data.total} lignes, ${data.finishers} finishers`);
      setPreview(null);
      await load();
    }
  };

  const uploadPackage = async (file: File) => {
    if (!editionId) return;
    const fd = new FormData();
    fd.set("action", "upload_tmh_package");
    fd.set("edition_id", editionId);
    fd.set("file", file);
    const res = await fetch("/api/admin/certificats", { method: "POST", body: fd });
    const data = await res.json();
    setMsg(res.ok ? `Paquet TMH accepté (${(data.fonts || []).join(", ")})` : data.error);
    await load();
  };

  const uploadBg = async (file: File) => {
    if (!editionId) return;
    const fd = new FormData();
    fd.set("action", "upload_template_image");
    fd.set("edition_id", editionId);
    fd.set("file", file);
    const res = await fetch("/api/admin/certificats", { method: "POST", body: fd });
    const data = await res.json();
    setMsg(res.ok ? "Fond enregistré" : data.error);
    await load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#1F2C3F] mb-1">Certificats finisher</h2>
        <p className="text-sm text-stone-600">
          Source officielle : TMH / GmCAP. Le site ne calcule aucun temps et n&apos;édite pas le
          graphique du certificat.
        </p>
      </div>

      {msg && (
        <div className="text-sm bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">{msg}</div>
      )}

      <section className="border border-stone-200 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-[#1F2C3F]">1. Édition</h3>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-stone-500">Édition active</label>
            <select
              className="block border rounded-lg px-3 py-2 text-sm"
              value={editionId}
              onChange={(e) => setEditionId(e.target.value)}
            >
              <option value="">—</option>
              {editions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.code} — {e.label} {e.published ? "(publiée)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500">Code</label>
            <input
              className="block border rounded-lg px-3 py-2 text-sm"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-stone-500">Libellé</label>
            <input
              className="block border rounded-lg px-3 py-2 text-sm"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={createEdition}
            className="bg-[#1F2C3F] text-white px-4 py-2 rounded-full text-sm"
          >
            Créer
          </button>
        </div>
        {ed && (
          <p className="text-xs text-stone-500">
            Version résultats : {ed.results_version} · Modèle confirmé :{" "}
            {ed.template_confirmed ? "oui" : "non"} · Publiée : {ed.published ? "oui" : "non"}
          </p>
        )}
      </section>

      <section className="border border-stone-200 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-[#1F2C3F]">2. Import résultats (CSV / XLSX)</h3>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => setResultsFile(e.target.files?.[0] || null)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={previewResults}
            className="border border-stone-300 px-4 py-2 rounded-full text-sm"
          >
            Aperçu
          </button>
          <button
            type="button"
            onClick={confirmResults}
            className="bg-[#A1532D] text-white px-4 py-2 rounded-full text-sm"
          >
            Confirmer l&apos;import
          </button>
          {ed?.previous_snapshot != null && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await postJson({ action: "rollback", edition_id: editionId });
                  setMsg("Version précédente restaurée");
                  await load();
                } catch (e: any) {
                  setMsg(e.message);
                }
              }}
              className="border border-amber-300 text-amber-900 px-4 py-2 rounded-full text-sm"
            >
              Revenir en arrière
            </button>
          )}
        </div>
        {preview && (
          <div className="text-sm bg-stone-50 rounded-xl p-4 space-y-1">
            <p>
              Lignes : {preview.total} · Finishers : {preview.finishers} · OK :{" "}
              {preview.ok ? "oui" : "non"}
            </p>
            {(preview.errors || []).map((e: string, i: number) => (
              <p key={i} className="text-red-700">
                {e}
              </p>
            ))}
            {(preview.duplicates || []).map((e: string, i: number) => (
              <p key={i} className="text-amber-800">
                Doublon : {e}
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="border border-stone-200 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-[#1F2C3F]">3. Modèle TMH (fond + paquet ZIP)</h3>
        <p className="text-xs text-stone-500">
          Le modèle est créé dans TMH. Importez le fond (JPG/PNG) et le paquet ZIP (fond HD, JSON,
          polices TTF/OTF, PDF de référence). Aucune substitution de police.
        </p>
        <div className="flex flex-wrap gap-4">
          <label className="text-sm">
            Fond seul
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="block mt-1"
              onChange={(e) => e.target.files?.[0] && uploadBg(e.target.files[0])}
            />
          </label>
          <label className="text-sm">
            Paquet ZIP TMH
            <input
              type="file"
              accept=".zip"
              className="block mt-1"
              onChange={(e) => e.target.files?.[0] && uploadPackage(e.target.files[0])}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            className="border border-stone-300 px-4 py-2 rounded-full text-sm"
            href={`/api/admin/certificats`}
            onClick={async (e) => {
              e.preventDefault();
              const res = await fetch("/api/admin/certificats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "preview_pdf", edition_id: editionId }),
              });
              if (!res.ok) {
                const d = await res.json();
                setMsg(d.error || "Aperçu impossible");
                return;
              }
              const blob = await res.blob();
              window.open(URL.createObjectURL(blob), "_blank");
            }}
          >
            Aperçu PDF (coureur fictif)
          </a>
          <button
            type="button"
            className="bg-emerald-700 text-white px-4 py-2 rounded-full text-sm"
            onClick={async () => {
              try {
                await postJson({ action: "confirm_template", edition_id: editionId });
                setMsg("Modèle confirmé");
                await load();
              } catch (e: any) {
                setMsg(e.message);
              }
            }}
          >
            Confirmer le modèle
          </button>
        </div>
      </section>

      <section className="border border-stone-200 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-[#1F2C3F]">4. Publication</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="bg-[#5b4dff] text-white px-4 py-2 rounded-full text-sm"
            onClick={async () => {
              try {
                await postJson({ action: "publish", edition_id: editionId });
                setMsg("Édition publiée");
                await load();
              } catch (e: any) {
                setMsg(e.message);
              }
            }}
          >
            Publier
          </button>
          <button
            type="button"
            className="border border-stone-300 px-4 py-2 rounded-full text-sm"
            onClick={async () => {
              await postJson({ action: "unpublish", edition_id: editionId });
              setMsg("Édition masquée");
              await load();
            }}
          >
            Masquer
          </button>
          <button
            type="button"
            className="border border-stone-300 px-4 py-2 rounded-full text-sm"
            onClick={async () => {
              await postJson({
                action: "set_results_public",
                edition_id: editionId,
                value: !ed?.results_public,
              });
              await load();
            }}
          >
            {ed?.results_public
              ? "Masquer page résultats"
              : "Activer page résultats (colonnes fichier uniquement)"}
          </button>
        </div>
      </section>
    </div>
  );
}
