export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="mb-10">
        <p className="section-kicker mb-3">Écrivez-nous</p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-[#0f1b2d] mb-4 tracking-tight">Contact</h1>
        <p className="text-stone-600 max-w-2xl">Une question sur les courses, les inscriptions ou le partenariat ? Nous sommes à votre écoute.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-[1fr_1.4fr]">
        <div className="premium-card rounded-3xl p-7 sm:p-8">
          <h2 className="text-lg font-semibold text-[#0f1b2d] mb-4">Association Trail Tafaray</h2>
          <p className="text-stone-600 leading-relaxed mb-4">Anjeva, Madagascar</p>
          <p className="text-stone-600">
            <span className="text-stone-500">Email :</span>{" "}
            <a href="mailto:contact@trailtafaray.mg" className="text-[#b7793d] hover:underline">contact@trailtafaray.mg</a>
          </p>
        </div>
        <div className="premium-card rounded-3xl p-7 sm:p-8">
          <form className="space-y-4">
            <input placeholder="Nom" className="w-full border border-stone-200 bg-white/80 rounded-xl px-4 py-3.5 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-[rgba(183,121,61,0.15)] focus:border-[#b7793d]" />
            <input type="email" placeholder="Email" className="w-full border border-stone-200 bg-white/80 rounded-xl px-4 py-3.5 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-[rgba(183,121,61,0.15)] focus:border-[#b7793d]" />
            <textarea placeholder="Message" rows={5} className="w-full border border-stone-200 bg-white/80 rounded-xl px-4 py-3.5 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-[rgba(183,121,61,0.15)] focus:border-[#b7793d] resize-y" />
            <button className="bg-gradient-to-r from-[#b7793d] to-[#d9a441] text-[#0f1b2d] px-7 py-3 rounded-full font-semibold hover:brightness-110 transition shadow-lg shadow-black/10">
              Envoyer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
