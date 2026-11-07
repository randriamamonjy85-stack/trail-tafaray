"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Rule = {
  id?: string;
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

const emptyRule = (discipline: string): Rule => ({
  discipline,
  code_base: "",
  label_homme: "",
  label_femme: "",
  annee_naissance_min: 1990,
  annee_naissance_max: 2000,
  age_min: null,
  age_max: null,
  courses_autorisees: [],
  ordre: 99,
  actif: true,
});

export default function CategoriesAdmin() {
  const supabase = createClient();
  const [rules, setRules] = useState<Rule[]>([]);
  const [msg, setMsg] = useState("");
  const [adding, setAdding] = useState<Rule | null>(null);
  const [coursesList, setCoursesList] = useState<string[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("category_rules")
      .select("*")
      .order("discipline")
      .order("ordre");
    setRules((data as Rule[]) || []);
    const { data: courses } = await supabase.from("courses").select("nom").eq("active", true);
    if (courses?.length) setCoursesList(courses.map((c: any) => c.nom));
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2500);
  };

  const updateLocal = (id: string, patch: Partial<Rule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const save = async (rule: Rule) => {
    if (!rule.id) return;
    const { error } = await supabase
      .from("category_rules")
      .update({
        code_base: rule.code_base,
        annee_naissance_min: Number(rule.annee_naissance_min),
        annee_naissance_max: Number(rule.annee_naissance_max),
        age_min: rule.age_min,
        age_max: rule.age_max,
        label_homme: rule.label_homme,
        label_femme: rule.label_femme,
        courses_autorisees: rule.courses_autorisees || [],
        actif: rule.actif,
        ordre: Number(rule.ordre) || 0,
        discipline: rule.discipline,
      })
      .eq("id", rule.id);
    if (error) alert(error.message);
    else {
      flash("Catégorie enregistrée");
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer définitivement cette catégorie ?")) return;
    const { error } = await supabase.from("category_rules").delete().eq("id", id);
    if (error) alert(error.message);
    else {
      flash("Catégorie supprimée");
      load();
    }
  };

  const create = async () => {
    if (!adding) return;
    if (!adding.code_base || !adding.label_homme || !adding.label_femme) {
      return alert("Code, label homme et label femme sont obligatoires.");
    }
    const { error } = await supabase.from("category_rules").insert({
      discipline: adding.discipline,
      code_base: adding.code_base,
      label_homme: adding.label_homme,
      label_femme: adding.label_femme,
      annee_naissance_min: Number(adding.annee_naissance_min),
      annee_naissance_max: Number(adding.annee_naissance_max),
      age_min: adding.age_min,
      age_max: adding.age_max,
      courses_autorisees: adding.courses_autorisees || [],
      ordre: Number(adding.ordre) || 99,
      actif: true,
    });
    if (error) alert(error.message);
    else {
      setAdding(null);
      flash("Catégorie ajoutée");
      load();
    }
  };

  const toggleCourse = (rule: Rule, course: string, isNew = false) => {
    const current = [...(rule.courses_autorisees || [])];
    const idx = current.indexOf(course);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(course);
    if (isNew) setAdding({ ...rule, courses_autorisees: current });
    else if (rule.id) updateLocal(rule.id, { courses_autorisees: current });
  };

  const byDisc = (d: string) => rules.filter((r) => r.discipline === d);

  const defaultCourses =
    coursesList.length > 0
      ? coursesList
      : [
          "Zaza Tafaray",
          "Trail Découverte",
          "Trail Endurance",
          "Trail Intense",
          "VTT BEKA",
          "Duathlon Nature",
        ];

  const RuleFormFields = ({
    rule,
    onChange,
    isNew,
  }: {
    rule: Rule;
    onChange: (patch: Partial<Rule>) => void;
    isNew?: boolean;
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
      <div>
        <label className="text-xs text-stone-500">Code</label>
        <input
          className="w-full border rounded px-2 py-1.5"
          value={rule.code_base}
          onChange={(e) => onChange({ code_base: e.target.value })}
          placeholder="M1"
        />
      </div>
      <div>
        <label className="text-xs text-stone-500">Label homme</label>
        <input
          className="w-full border rounded px-2 py-1.5"
          value={rule.label_homme}
          onChange={(e) => onChange({ label_homme: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs text-stone-500">Label femme</label>
        <input
          className="w-full border rounded px-2 py-1.5"
          value={rule.label_femme}
          onChange={(e) => onChange({ label_femme: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs text-stone-500">Ordre</label>
        <input
          type="number"
          className="w-full border rounded px-2 py-1.5"
          value={rule.ordre}
          onChange={(e) => onChange({ ordre: Number(e.target.value) })}
        />
      </div>
      <div>
        <label className="text-xs text-stone-500">Année naissance min</label>
        <input
          type="number"
          className="w-full border rounded px-2 py-1.5"
          value={rule.annee_naissance_min}
          onChange={(e) => onChange({ annee_naissance_min: Number(e.target.value) })}
        />
      </div>
      <div>
        <label className="text-xs text-stone-500">Année naissance max</label>
        <input
          type="number"
          className="w-full border rounded px-2 py-1.5"
          value={rule.annee_naissance_max}
          onChange={(e) => onChange({ annee_naissance_max: Number(e.target.value) })}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs text-stone-500">Courses autorisées</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {defaultCourses.map((c) => (
            <label key={c} className="flex items-center gap-1 text-xs border rounded px-2 py-1">
              <input
                type="checkbox"
                checked={(rule.courses_autorisees || []).includes(c)}
                onChange={() => toggleCourse(rule, c, isNew)}
              />
              {c}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#1F2C3F] mb-2">Catégories d&apos;âge</h2>
        <p className="text-sm text-stone-600 mb-4">
          Ajoutez, modifiez ou supprimez les catégories. Les années de naissance pilotent le calcul
          automatique à l&apos;inscription.
        </p>
        {msg && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            {msg}
          </p>
        )}
      </div>

      {(["trail", "vtt", "duathlon"] as const).map((disc) => (
        <div key={disc} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="bg-stone-50 px-4 py-3 flex flex-wrap justify-between items-center gap-2">
            <span className="font-semibold text-[#1F2C3F] uppercase text-sm">{disc}</span>
            <button
              type="button"
              onClick={() => setAdding(emptyRule(disc))}
              className="text-sm bg-[#1F2C3F] text-white px-3 py-1.5 rounded-full"
            >
              + Ajouter une catégorie
            </button>
          </div>

          {adding && adding.discipline === disc && (
            <div className="p-4 border-b border-amber-200 bg-amber-50 space-y-3">
              <p className="text-sm font-medium text-amber-900">Nouvelle catégorie ({disc})</p>
              <RuleFormFields
                rule={adding}
                isNew
                onChange={(patch) => setAdding({ ...adding, ...patch })}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={create}
                  className="bg-[#A1532D] text-white px-4 py-2 rounded-full text-sm"
                >
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(null)}
                  className="text-sm text-stone-600 px-3"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-stone-100">
            {byDisc(disc).length === 0 && (
              <p className="p-4 text-sm text-stone-500">Aucune catégorie pour cette discipline.</p>
            )}
            {byDisc(disc).map((r) => (
              <div key={r.id} className="p-4 space-y-3">
                <div className="flex flex-wrap justify-between gap-2 items-center">
                  <div className="font-mono text-xs text-stone-500">{r.code_base}</div>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={r.actif}
                      onChange={(e) => updateLocal(r.id!, { actif: e.target.checked })}
                    />
                    Actif
                  </label>
                </div>
                <RuleFormFields
                  rule={r}
                  onChange={(patch) => updateLocal(r.id!, patch)}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => save(r)}
                    className="text-sm text-[#A1532D] font-medium hover:underline"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r.id!)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
