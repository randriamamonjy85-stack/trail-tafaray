import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .eq("visible", true)
    .order("ordre");

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-[#1F2C3F] mb-4">Documents</h1>
      <p className="text-stone-600 mb-10">
        Règlements, guides et fichiers utiles au téléchargement.
      </p>
      {!docs || docs.length === 0 ? (
        <p className="text-stone-500">Aucun document publié.</p>
      ) : (
        <ul className="space-y-3">
          {docs.map((d: any) => (
            <li
              key={d.id}
              className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap justify-between gap-3 items-center"
            >
              <div>
                <div className="font-semibold text-[#1F2C3F]">{d.titre}</div>
                {d.description && (
                  <p className="text-sm text-stone-500">{d.description}</p>
                )}
                {d.type_doc && (
                  <span className="text-xs text-[#A1532D] uppercase">{d.type_doc}</span>
                )}
              </div>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1F2C3F] text-white px-4 py-2 rounded-full text-sm"
              >
                Télécharger
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
