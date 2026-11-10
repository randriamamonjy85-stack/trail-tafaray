"use client";

import { useEffect, useState } from "react";

export default function MonCertificatPage() {
  const [editions, setEditions] = useState<{ code: string; label: string }[]>([]);
  const [edition, setEdition] = useState("");
  const [dossard, setDossard] = useState("");
  const [nom, setNom] = useState("");
  const [msg, setMsg] = useState("");
  const [canDl, setCanDl] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // published editions via public results endpoint won't list all; use lookup only
    // minimal: user types edition code known from event
  }, []);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setCanDl(false);
    setLoading(true);
    try {
      const res = await fetch("/api/certificat/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edition, dossard, nom }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Erreur");
      } else if (!data.found) {
        setMsg(data.message || "Aucune correspondance");
      } else if (!data.finisher) {
        setMsg(data.message || "Certificat non disponible");
      } else {
        setMsg(`Finisher trouvé : ${data.prenom} ${data.nom} — ${data.course} — ${data.temps}`);
        setCanDl(true);
      }
    } catch {
      setMsg("Erreur réseau");
    }
    setLoading(false);
  };

  const download = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/certificat/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edition, dossard, nom }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(d.error || "Téléchargement impossible");
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificat-${edition}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMsg("Erreur réseau");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#1F2C3F] mb-2">Mon certificat</h1>
      <p className="text-stone-600 text-sm mb-8">
        Résultats officiels TMH / GmCAP. Saisissez l&apos;édition, votre dossard et votre nom de
        famille.
      </p>
      <form onSubmit={lookup} className="space-y-4 bg-white border border-stone-200 rounded-2xl p-6">
        <div>
          <label className="text-sm font-medium">Édition</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            placeholder="ex. 2026"
            value={edition}
            onChange={(e) => setEdition(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">N° de dossard</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={dossard}
            onChange={(e) => setDossard(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Nom de famille</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1F2C3F] text-white py-3 rounded-full font-medium disabled:opacity-50"
        >
          Vérifier
        </button>
      </form>
      {msg && <p className="mt-4 text-sm text-stone-700">{msg}</p>}
      {canDl && (
        <button
          type="button"
          onClick={download}
          disabled={loading}
          className="mt-4 w-full bg-[#A1532D] text-white py-3 rounded-full font-medium"
        >
          Télécharger le PDF
        </button>
      )}
    </div>
  );
}
