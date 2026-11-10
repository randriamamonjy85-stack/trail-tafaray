"use client";

import { useCallback, useEffect, useState } from "react";
import { FIELD_IDS, FIELD_LABELS, type FieldId } from "@/lib/certificats/validate-settings";

type Edition = {
  id: string;
  code: string;
  label: string;
  published: boolean;
  results_version: number;
  template_confirmed: boolean;
  template_reference_pdf_path?: string | null;
  template_offsets?: Partial<Record<FieldId, { dx_mm?: number; dy_mm?: number }>>;
  previous_snapshot?: unknown;
};

type Preview = {
  ok?: boolean;
  total?: number;
  finishers?: number;
  errors?: string[];
  duplicates?: string[];
};

type OffsetInputs = Record<FieldId, { dx: string; dy: string }>;

const emptyOffsets = (): OffsetInputs => {
  const o = {} as OffsetInputs;
  for (const id of FIELD_IDS) o[id] = { dx: "0", dy: "0" };
  return o;
};

function num(raw: string): number | null {
  const n = Number(raw.trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export default function CertificatsAdmin() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [editionId, setEditionId] = useState("");
  const [newCode, setNewCode] = useState("2026");
  const [newLabel, setNewLabel] = useState("Trail Tafaray 2026");
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [resultsFile, setResultsFile] = useState<File | null>(null);
  const [offsets, setOffsets] = useState<OffsetInputs>(emptyOffsets);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [refUrl, setRefUrl] = useState<string | null>(null);
  const [compared, setCompared] = useState(false);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/certificats");
    if (!res.ok) return;
    const data = await res.json();
    setEditions(data);
    setEditionId((cur) => cur || data[0]?.id || "");
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/certificats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || cancelled) return;
        setEditions(data);
        setEditionId((cur) => cur || data[0]?.id || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const ed = editions.find((e) => e.id === editionId);
  const storedKey = `${editionId}|${JSON.stringify(ed?.template_offsets || {})}`;
  const [syncKey, setSyncKey] = useState("");
  if (storedKey !== syncKey) {
    const stored = ed?.template_offsets || {};
    const next = emptyOffsets();
    for (const id of FIELD_IDS) {
      next[id] = {
        dx: String(stored[id]?.dx_mm ?? 0),
        dy: String(stored[id]?.dy_mm ?? 0),
      };
    }
    setSyncKey(storedKey);
    setOffsets(next);
    setAck(false);
    setCompared(false);
    setSiteUrl(null);
    setRefUrl(null);
  }

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

  const offsetsPayload = () => {
    const o: Record<string, { dx_mm: number; dy_mm: number }> = {};
    for (const id of FIELD_IDS) {
      const dx = num(offsets[id]?.dx ?? "0");
      const dy = num(offsets[id]?.dy ?? "0");
      if (dx === null || dy === null) return null;
      o[id] = { dx_mm: dx, dy_mm: dy };
    }
    return o;
  };

  const setOffset = (id: FieldId, axis: "dx" | "dy", value: string) => {
    setOffsets((prev) => ({ ...prev, [id]: { ...prev[id], [axis]: value } }));
    setAck(false);
    setCompared(false);
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
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Erreur");
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
    if (!res.ok) setMsg(data.error || "Paquet refusé");
    else {
      const warn = (data.warnings || []).join(" ");
      setMsg(
        `Paquet TMH accepté (${(data.fonts || []).join(", ")}).${warn ? " " + warn : ""}`
      );
    }
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

  const openPdf = async (action: "preview_pdf" | "reference_pdf") => {
    const payload = offsetsPayload();
    if (!payload) {
      setMsg("Les décalages doivent être des nombres (mm).");
      return null;
    }
    const res = await fetch("/api/admin/certificats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, edition_id: editionId, offsets: payload }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || "PDF indisponible");
    }
    const blob = new Blob([await res.arrayBuffer()], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  };

  const compare = async () => {
    if (!editionId) return;
    setBusy(true);
    setAck(false);
    try {
      const [site, ref] = await Promise.all([openPdf("preview_pdf"), openPdf("reference_pdf")]);
      if (siteUrl) URL.revokeObjectURL(siteUrl);
      if (refUrl) URL.revokeObjectURL(refUrl);
      setSiteUrl(site);
      setRefUrl(ref);
      setCompared(!!site && !!ref);
      setMsg(
        site && ref
          ? "Comparez les deux PDF. Le nom du coureur fictif peut différer de l'exemple TMH."
          : "Comparaison incomplète."
      );
    } catch (e: unknown) {
      setCompared(false);
      setMsg(e instanceof Error ? e.message : "Comparaison impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#1F2C3F] mb-1">Certificats finisher</h2>
        <p className="text-sm text-stone-600">
          Source officielle : TMH / GmCAP. Le site ne calcule aucun temps. Le modèle graphique
          s&apos;édite dans TMH, pas ici.
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
            {ed.template_confirmed ? "oui" : "non"} · Publiée : {ed.published ? "oui" : "non"} ·
            PDF de référence : {ed.template_reference_pdf_path ? "oui" : "non"}
          </p>
        )}
      </section>

      <section className="border border-stone-200 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-[#1F2C3F]">2. Import résultats (CSV / XLSX)</h3>
        <p className="text-xs text-stone-500">
          13 colonnes, dans l&apos;ordre du fichier certificats. Pas de saisie manuelle des temps.
        </p>
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
                } catch (e: unknown) {
                  setMsg(e instanceof Error ? e.message : "Erreur");
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
            {(preview.errors || []).map((e, i) => (
              <p key={i} className="text-red-700">
                {e}
              </p>
            ))}
            {(preview.duplicates || []).map((e, i) => (
              <p key={i} className="text-amber-800">
                Doublon : {e}
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="border border-stone-200 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-[#1F2C3F]">3. Modèle TMH</h3>
        <p className="text-xs text-stone-500">
          Importez le paquet ZIP créé dans TMH (fond, réglages JSON, polices TTF/OTF, PDF de
          référence). Une police manquante ou illisible refuse le modèle. Le gras utilise le
          fichier Bold du paquet.
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
              accept=".zip,application/zip"
              className="block mt-1"
              onChange={(e) => e.target.files?.[0] && uploadPackage(e.target.files[0])}
            />
          </label>
        </div>

        <div>
          <h4 className="text-sm font-medium text-[#1F2C3F] mb-2">
            Décalage de secours (mm) — droite / bas
          </h4>
          <div className="grid sm:grid-cols-2 gap-2">
            {FIELD_IDS.map((id) => (
              <div key={id} className="flex items-center gap-2 text-sm">
                <span className="w-28 text-stone-600">{FIELD_LABELS[id]}</span>
                <label className="text-xs text-stone-500">
                  dx
                  <input
                    className="ml-1 w-16 border rounded px-2 py-1"
                    value={offsets[id]?.dx ?? "0"}
                    onChange={(e) => setOffset(id, "dx", e.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <label className="text-xs text-stone-500">
                  dy
                  <input
                    className="ml-1 w-16 border rounded px-2 py-1"
                    value={offsets[id]?.dy ?? "0"}
                    onChange={(e) => setOffset(id, "dy", e.target.value)}
                    inputMode="decimal"
                  />
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 border border-stone-300 px-4 py-2 rounded-full text-sm"
            onClick={async () => {
              const payload = offsetsPayload();
              if (!payload) return setMsg("Les décalages doivent être des nombres (mm).");
              try {
                await postJson({ action: "save_offsets", edition_id: editionId, offsets: payload });
                setMsg("Décalages enregistrés. Le modèle doit être comparé et confirmé à nouveau.");
                await load();
              } catch (e: unknown) {
                setMsg(e instanceof Error ? e.message : "Erreur");
              }
            }}
          >
            Enregistrer les décalages
          </button>
        </div>

        <button
          type="button"
          disabled={busy || !editionId}
          onClick={compare}
          className="bg-[#1F2C3F] text-white px-4 py-2 rounded-full text-sm disabled:opacity-50"
        >
          {busy ? "Génération…" : "Comparer aperçu du site et PDF TMH"}
        </button>
        <p className="text-xs text-stone-500">
          Coureur fictif : Aina RABE, Trail Découverte, temps 01:42:18, scratch 12, genre 3,
          catégorie 2. Le champ Édition reprend le code de l&apos;édition.
        </p>

        {(siteUrl || refUrl) && (
          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Aperçu du site (coureur fictif)</p>
              {siteUrl ? (
                <iframe title="Aperçu certificat du site" src={siteUrl} className="w-full h-[480px] border rounded-xl bg-white" />
              ) : (
                <p className="text-sm text-stone-500">Aperçu indisponible.</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-2">PDF de référence TMH</p>
              {refUrl ? (
                <iframe title="PDF de référence TMH" src={refUrl} className="w-full h-[480px] border rounded-xl bg-white" />
              ) : (
                <p className="text-sm text-stone-500">PDF de référence absent.</p>
              )}
            </div>
          </div>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={ack}
            disabled={!compared}
            onChange={(e) => setAck(e.target.checked)}
          />
          <span>
            J&apos;ai comparé l&apos;aperçu du site au PDF de référence TMH (fond, polices,
            positions) pour le coureur fictif. Je confirme ce modèle.
          </span>
        </label>
        <button
          type="button"
          disabled={!ack || !compared}
          className="bg-emerald-700 text-white px-4 py-2 rounded-full text-sm disabled:opacity-40"
          onClick={async () => {
            const payload = offsetsPayload();
            if (!payload) return setMsg("Les décalages doivent être des nombres (mm).");
            try {
              await postJson({
                action: "confirm_template",
                edition_id: editionId,
                confirmed: true,
                offsets: payload,
              });
              setMsg("Modèle confirmé");
              await load();
            } catch (e: unknown) {
              setMsg(e instanceof Error ? e.message : "Erreur");
            }
          }}
        >
          Confirmer le modèle
        </button>
      </section>

      <section className="border border-stone-200 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-[#1F2C3F]">4. Publication</h3>
        <p className="text-xs text-stone-500">
          La publication exige un modèle confirmé. Il n&apos;y a pas de liste publique des coureurs :
          chacun cherche son certificat avec édition, dossard et nom.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="bg-[#5b4dff] text-white px-4 py-2 rounded-full text-sm"
            onClick={async () => {
              try {
                await postJson({ action: "publish", edition_id: editionId });
                setMsg("Édition publiée");
                await load();
              } catch (e: unknown) {
                setMsg(e instanceof Error ? e.message : "Erreur");
              }
            }}
          >
            Publier
          </button>
          <button
            type="button"
            className="border border-stone-300 px-4 py-2 rounded-full text-sm"
            onClick={async () => {
              try {
                await postJson({ action: "unpublish", edition_id: editionId });
                setMsg("Édition masquée");
                await load();
              } catch (e: unknown) {
                setMsg(e instanceof Error ? e.message : "Erreur");
              }
            }}
          >
            Masquer
          </button>
        </div>
      </section>
    </div>
  );
}
