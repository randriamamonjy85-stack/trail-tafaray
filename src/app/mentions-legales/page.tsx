import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function MentionsPage() {
  const settings = await getSettings();
  const content =
    (settings as any).mentions_legales ||
    "Mentions légales de l'Association Trail Tafaray. Contenu à compléter depuis l'administration.";

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-[#1F2C3F] mb-8">Mentions légales</h1>
      <div className="bg-white rounded-2xl border border-stone-200 p-8 prose prose-stone max-w-none whitespace-pre-line text-stone-700">
        {content}
      </div>
    </div>
  );
}
