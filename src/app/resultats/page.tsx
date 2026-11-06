import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ResultatsPage() {
  const settings = await getSettings();

  if (!settings.resultats_visibles) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-[#1F2C3F] mb-4">Résultats</h1>
        <p className="text-stone-600">
          Les résultats ne sont pas encore publiés. Revenez après l&apos;événement.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: resultats } = await supabase
    .from("resultats")
    .select("*")
    .order("position", { ascending: true });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-[#1F2C3F] mb-4">Résultats</h1>
      <p className="text-stone-600 mb-10">Classements officiels Trail Tafaray.</p>

      <div className="overflow-x-auto bg-white rounded-2xl border border-stone-200">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left">
            <tr>
              <th className="p-3">Pos.</th>
              <th className="p-3">Nom</th>
              <th className="p-3">Temps</th>
              <th className="p-3">Course</th>
              <th className="p-3">Catégorie</th>
            </tr>
          </thead>
          <tbody>
            {!resultats || resultats.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-stone-500">
                  Aucun résultat pour le moment.
                </td>
              </tr>
            ) : (
              resultats.map((r: any) => (
                <tr key={r.id} className="border-t border-stone-100">
                  <td className="p-3 font-medium">{r.position}</td>
                  <td className="p-3">{r.nom}</td>
                  <td className="p-3 font-mono">{r.temps}</td>
                  <td className="p-3">{r.course}</td>
                  <td className="p-3 text-xs">{r.categorie}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
