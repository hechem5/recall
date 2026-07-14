import Link from 'next/link';
import { DemoSearch } from '@/components/demo-search';

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
      <section className="px-6 py-24 md:py-32 max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-12 border-l border-[#262626] ml-6 md:ml-12 pl-6 md:pl-12">
        <div className="flex-1 flex flex-col items-start">
          <div className="text-xs font-bold tracking-widest uppercase text-[#FF3366] mb-8 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-[#FF3366]"></span>
            Personal Memory Extension
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none mb-8">
            Never lose<br />
            information<br />
            <span className="text-[#737373]">again.</span>
          </h1>
          
          <p className="max-w-xl text-sm md:text-base text-[#A3A3A3] leading-relaxed mb-12">
            Recall is a cryptographically secure memory extension built directly into your browser. 
            It is not a note-taking app—it is a perfect recall of everything you've ever read. 
            Save instantly, ask questions naturally, and let the AI synthesize the answers with exact citations.
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
        </div>

        <div className="flex-1 w-full flex flex-col items-center md:items-end mt-12 md:mt-0 relative z-10">
          <div className="text-xs font-bold tracking-widest uppercase text-[#737373] mb-4 flex items-center gap-3">
            <span className="w-2 h-2 bg-[#FF3366] animate-pulse"></span>
            [ INTERACTIVE DEMO ]
          </div>
          <DemoSearch />
        </div>
      </section>

      {/* Workflow (Replacing Technical Features) */}
      <section className="border-y border-[#262626] bg-[#0A0A0A]">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#262626]">
          
          <div className="p-12 hover:bg-[#111111] transition-colors flex flex-col">
            <div className="text-[#FF3366] font-bold text-2xl mb-6">01.</div>
            <h3 className="text-lg font-bold tracking-widest uppercase mb-4">Save</h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              Find something interesting? One click in the browser extension instantly archives the entire article, document, or snippet to your vault without breaking your workflow.
            </p>
          </div>

          <div className="p-12 hover:bg-[#111111] transition-colors flex flex-col">
            <div className="text-[#FF3366] font-bold text-2xl mb-6">02.</div>
            <h3 className="text-lg font-bold tracking-widest uppercase mb-4">Ask</h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              Months later, don't waste time searching for keywords. Just ask your vault a natural question like "What was that article explaining RAG pipelines?"
            </p>
          </div>

          <div className="p-12 hover:bg-[#111111] transition-colors flex flex-col">
            <div className="text-[#FF3366] font-bold text-2xl mb-6">03.</div>
            <h3 className="text-lg font-bold tracking-widest uppercase mb-4">Remember</h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              Recall reads through your archived memories and synthesizes a direct, accurate answer complete with source citations linking back to your original files.
            </p>
          </div>

        </div>
      </section>

      {/* Extension Superpowers */}
      <section className="border-b border-[#262626] bg-[#0A0A0A]">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#262626]">
          
          <div className="p-12 hover:bg-[#111111] transition-colors flex flex-col">
            <div className="text-[#FF3366] font-bold text-2xl mb-6">04.</div>
            <h3 className="text-lg font-bold tracking-widest uppercase mb-4">Highlight to Save</h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              Don't need the whole article? Just highlight any text on any website, right-click, and hit <span className="text-[#FF3366]">"Save to Recall."</span> It instantly stores the exact quote and its source URL so your AI can cite it perfectly later.
            </p>
          </div>

          <div className="p-12 hover:bg-[#111111] transition-colors flex flex-col">
            <div className="text-[#FF3366] font-bold text-2xl mb-6">05.</div>
            <h3 className="text-lg font-bold tracking-widest uppercase mb-4">Continue Watching</h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              Never forget which episode you were on. With Smart Saves enabled, the extension passively remembers where you left off in videos across the web, letting you pin your current shows directly in your browser toolbar.
            </p>
          </div>

        </div>
      </section>

      {/* Trust & Privacy Section */}
      <section className="px-6 py-24 md:py-32 max-w-4xl mx-auto border-l border-[#262626] ml-6 md:ml-12 pl-6 md:pl-12">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-8">
          Trust & Privacy<span className="text-[#FF3366]">_</span>
        </h2>
        <p className="max-w-2xl text-sm md:text-base text-[#A3A3A3] leading-relaxed">
          Recall is designed for remembering knowledge, not just storing files in a generic cloud drive. 
          To ensure absolute privacy, your vault generates a unique cryptographic signature based on your physical hardware. 
          Even with the correct password, your memories cannot be accessed from an unrecognized device.
        </p>
      </section>

      {/* Extension Setup */}
      <section id="extension" className="p-12 md:p-24 max-w-4xl mx-auto border-l border-[#262626] ml-6 md:ml-12 pl-6 md:pl-12 mb-24 border-t border-[#262626]">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-12">
          Extension<br/>Integration<span className="text-[#FF3366]">_</span>
        </h2>
        
        <div className="space-y-12">
          <div className="flex gap-6">
            <div className="text-[#262626] font-bold text-xl">01</div>
            <div>
              <h4 className="text-sm font-bold tracking-widest uppercase mb-2">Add to Browser</h4>
              <p className="text-xs text-[#737373]">
                <a href="/recall-extension-v2.zip" download className="text-[#FF3366] hover:text-[#E5E5E5] transition-colors underline underline-offset-4 decoration-[#FF3366]/30 hover:decoration-[#E5E5E5]">Download the Recall extension</a>
                , open <span className="text-[#E5E5E5]">chrome://extensions</span>, enable "Developer mode", and drag the unzipped folder in.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-[#262626] font-bold text-xl">02</div>
            <div>
              <h4 className="text-sm font-bold tracking-widest uppercase mb-2">Secure Access</h4>
              <p className="text-xs text-[#737373]">Type your vault password. Your browser is now cryptographically locked to your safe and ready to save memories with one click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#262626] p-6 text-center text-xs text-[#404040] tracking-widest uppercase flex justify-center items-center gap-4">
        <span>MADE BY HECHEM KLAI</span>
        <span>//</span>
        <a href="https://www.linkedin.com/in/hechem-klai/" target="_blank" rel="noopener noreferrer" className="text-[#FF3366] hover:text-[#E5E5E5] transition-colors">LINKEDIN</a>
        <span>//</span>
        <a href="https://github.com/hechem5" target="_blank" rel="noopener noreferrer" className="text-[#FF3366] hover:text-[#E5E5E5] transition-colors">GITHUB</a>
      </footer>

    </main>
  );
}
