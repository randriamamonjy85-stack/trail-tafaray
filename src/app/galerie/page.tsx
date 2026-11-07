import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GaleriePage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("visible", true)
    .order("ordre");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-[#1F2C3F] mb-4">Galerie</h1>
      <p className="text-stone-600 mb-10">Photos des événements Trail Tafaray.</p>

      {!photos || photos.length === 0 ? (
        <p className="text-stone-500">Aucune photo publiée pour le moment.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((p: any) => (
            <figure key={p.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.titre || "Photo Trail Tafaray"}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              {(p.titre || p.album) && (
                <figcaption className="p-2 text-xs text-stone-600 truncate">
                  {p.titre || p.album}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
