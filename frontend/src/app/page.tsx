import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-[#E5E5E5] font-mono selection:bg-[#FF3366] selection:text-white">
      
      {/* Navigation */}
      <nav className="w-full border-b border-[#262626] p-6 flex justify-between items-center">
        <div className="text-xl font-bold tracking-widest uppercase">
          Recall<span className="text-[#FF3366]">_</span>
        </div>
        <Link 
          href="/unlock"
          className="text-xs font-bold tracking-widest uppercase text-[#737373] hover:text-[#FF3366] transition-colors border border-[#262626] hover:border-[#FF3366] px-6 py-2"
        >
          [ ACCESS VAULT ]
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-24 md:py-32 max-w-4xl mx-auto flex flex-col items-start border-l border-[#262626] ml-6 md:ml-12 pl-6 md:pl-12">
        <div className="text-xs font-bold tracking-widest uppercase text-[#FF3366] mb-8 flex items-center gap-4">
          <span className="w-8 h-[1px] bg-[#FF3366]"></span>
          System Initialization
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none mb-8">
          Total<br />
          Information<br />
          <span className="text-[#737373]">Retrieval.</span>
        </h1>
        
        <p className="max-w-xl text-sm md:text-base text-[#A3A3A3] leading-relaxed mb-12">
          RECALL is a locally bound, cryptographically secured memory extension. Save articles, 
          PDFs, and text snippets instantly via the browser extension, and retrieve them via 
          semantic vector search.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
          <Link 
            href="/unlock"
            className="w-full bg-[#FF3366] hover:bg-[#E5E5E5] text-black text-center text-xs font-bold tracking-widest uppercase py-4 transition-colors"
          >
            INITIATE SAFE
          </Link>
          <a 
            href="#extension"
            className="w-full border border-[#262626] hover:border-[#FF3366] text-[#E5E5E5] text-center text-xs font-bold tracking-widest uppercase py-4 transition-colors hover:text-[#FF3366]"
          >
            GET EXTENSION
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-[#262626] bg-[#0A0A0A]">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#262626]">
          
          <div className="p-12 hover:bg-[#111111] transition-colors">
            <div className="text-[#FF3366] font-bold text-2xl mb-6">01.</div>
            <h3 className="text-lg font-bold tracking-widest uppercase mb-4">Hardware Bound</h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              Your vault generates a unique cryptographic signature based on your physical device. 
              Even with the correct password, access is denied from unrecognized hardware.
            </p>
          </div>

          <div className="p-12 hover:bg-[#111111] transition-colors">
            <div className="text-[#FF3366] font-bold text-2xl mb-6">02.</div>
            <h3 className="text-lg font-bold tracking-widest uppercase mb-4">Semantic Search</h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              Data is automatically chunked and embedded. Search not just for keywords, but for 
              meaning, concepts, and ideas. Recall instantly understands the context of your query.
            </p>
          </div>

          <div className="p-12 hover:bg-[#111111] transition-colors">
            <div className="text-[#FF3366] font-bold text-2xl mb-6">03.</div>
            <h3 className="text-lg font-bold tracking-widest uppercase mb-4">AI Synthesis</h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              Queries don't just return links. An integrated language model synthesizes the exact 
              answer directly from your saved sources, complete with citations.
            </p>
          </div>

        </div>
      </section>

      {/* Extension Setup */}
      <section id="extension" className="p-12 md:p-24 max-w-4xl mx-auto border-l border-[#262626] ml-6 md:ml-12 pl-6 md:pl-12 mt-12 mb-24">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-12">
          Extension<br/>Integration<span className="text-[#FF3366]">_</span>
        </h2>
        
        <div className="space-y-12">
          <div className="flex gap-6">
            <div className="text-[#262626] font-bold text-xl">01</div>
            <div>
              <h4 className="text-sm font-bold tracking-widest uppercase mb-2">Add to Browser</h4>
              <p className="text-xs text-[#737373]">Download the Recall extension folder, open <span className="text-[#E5E5E5]">chrome://extensions</span>, enable "Developer mode", and load the folder.</p>
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="text-[#262626] font-bold text-xl">02</div>
            <div>
              <h4 className="text-sm font-bold tracking-widest uppercase mb-2">Link Your Safe</h4>
              <p className="text-xs text-[#737373]">Right-click the Recall icon, open Options, and paste your personal server link (e.g., your Render URL).</p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-[#262626] font-bold text-xl">03</div>
            <div>
              <h4 className="text-sm font-bold tracking-widest uppercase mb-2">Secure Access</h4>
              <p className="text-xs text-[#737373]">Type your vault password. Your browser is now cryptographically locked to your safe and ready to save memories with one click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#262626] p-6 text-center text-xs text-[#404040] tracking-widest uppercase">
        SYSTEM ONLINE // ENCRYPTION ACTIVE // RECALL_ 2026
      </footer>

    </main>
  );
}
