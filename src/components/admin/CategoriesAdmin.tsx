"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Rule = {
  id: string;
  discipline: string;
  code_base: string;
  label_homme: string;
  label_femme: string;
  annee_naissance_min: number;
  annee_naissance_max: number;
  age_min: number | null;
  age_max: number | null;
  courses_autorisees: string[] | null;
  ordre: number;
  actif: boolean;
};

export default function CategoriesAdmin() {
  const supabase = createClient();
  const [rules, setRules] = useState<Rule[]>([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("category_rules")
      .select("*")
      .order("discipline")
      .order("ordre");
    setRules((data as Rule[]) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (rule: Rule) => {
    const { error } = await supabase
      .from("category_rules")
      .update({
        annee_naissance_min: Number(rule.annee_naissance_min),
        annee_naissance_max: Number(rule.annee_naissance_max),
        age_min: rule.age_min,
        age_max: rule.age_max,
        label_homme: rule.label_homme,
        label_femme: rule.label_femme,
        actif: rule.actif,
        ordre: rule.ordre,
      })
      .eq("id", rule.id);
    if (error) alert(error.message);
    else {
      setMsg("Enregistré");
      setTimeout(() => setMsg(""), 2000);
      load();
    }
  };

  const updateLocal = (id: string, patch: Partial<Rule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const byDisc = (d: string) => rules.filter((r) => r.discipline === d);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#1F2C3F] mb-2">Catégories d&apos;âge</h2>
        <p className="text-sm text-stone-600 mb-4">
          Modifiez les années de naissance pour chaque édition. Ces règles alimentent le calcul
          automatique à l&apos;inscription (pas de code à changer).
        </p>
        {msg && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            {msg}
          </p>
        )}
      </div>

      {(["trail", "vtt", "duathlon"] as const).map((disc) => (
        <div key={disc} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="bg-stone-50 px-4 py-3 font-semibold text-[#1F2C3F] uppercase text-sm">
            {disc}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-stone-100">
                  <th className="p-2">Code</th>
                  <th className="p-2">Label H</th>
                  <th className="p-2">Label F</th>
                  <th className="p-2">An. min</th>
                  <th className="p-2">An. max</th>
                  <th className="p-2">Actif</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {byDisc(disc).map((r) => (
                  <tr key={r.id} className="border-b border-stone-50">
                    <td className="p-2 font-mono text-xs">{r.code_base}</td>
                    <td className="p-2">
                      <input
                        className="border rounded px-2 py-1 w-full min-w-[140px]"
                        value={r.label_homme}
                        onChange={(e) => updateLocal(r.id, { label_homme: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="border rounded px-2 py-1 w-full min-w-[140px]"
                        value={r.label_femme}
                        onChange={(e) => updateLocal(r.id, { label_femme: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-20"
                        value={r.annee_naissance_min}
                        onChange={(e) =>
                          updateLocal(r.id, { annee_naissance_min: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-20"
                        value={r.annee_naissance_max}
                        onChange={(e) =>
                          updateLocal(r.id, { annee_naissance_max: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={r.actif}
                        onChange={(e) => updateLocal(r.id, { actif: e.target.checked })}
                      />
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => save(r)}
                        className="text-xs text-[#A1532D] font-medium hover:underline"
                      >
                        Sauver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
