export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-[#1F2C3F] mb-8">Contact</h1>
      <div className="bg-white rounded-2xl border border-stone-200 p-8">
        <p className="text-stone-700 mb-6">Association Trail Tafaray<br />Anjeva, Madagascar</p>
        <p className="text-stone-700 mb-6">Email : contact@trailtafaray.mg</p>
        <form className="space-y-4">
          <input placeholder="Nom" className="w-full border border-stone-300 rounded-lg px-4 py-3" />
          <input type="email" placeholder="Email" className="w-full border border-stone-300 rounded-lg px-4 py-3" />
          <textarea placeholder="Message" rows={5} className="w-full border border-stone-300 rounded-lg px-4 py-3" />
          <button className="bg-[#A1532D] text-white px-6 py-3 rounded-full font-medium hover:bg-[#8a4526]">Envoyer</button>
        </form>
      </div>
    </div>
  );
}
