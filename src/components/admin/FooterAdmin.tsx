"use client";

type Props = {
  settings: any;
  setSettings: (s: any) => void;
  saveSettings: () => void;
};

export default function FooterAdmin({ settings, setSettings, saveSettings }: Props) {
  const field = (key: string, label: string) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        className="w-full border border-stone-300 rounded-lg px-4 py-2"
        value={settings[key] || ""}
        onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-xl font-bold text-[#1F2C3F]">Pied de page & réseaux</h2>
      {field("footer_texte", "Texte du pied de page")}
      {field("footer_email", "E-mail public")}
      {field("footer_tel", "Téléphone")}
      {field("footer_adresse", "Adresse")}
      {field("facebook_url", "Facebook URL")}
      {field("instagram_url", "Instagram URL")}
      {field("youtube_url", "YouTube URL")}
      <button
        onClick={saveSettings}
        className="bg-[#1F2C3F] text-white px-6 py-3 rounded-full font-medium"
      >
        Enregistrer
      </button>
    </div>
  );
}
