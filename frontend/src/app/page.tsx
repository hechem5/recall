import Link from 'next/link';
import { ArrowRight, Lock, Search, Download, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-black/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold tracking-widest uppercase flex items-center gap-2">
            Recall<span className="text-emerald-500">_</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <a href="#how-it-works" className="text-neutral-400 hover:text-white transition-colors">How it works</a>
            <Link href="/unlock" className="bg-white text-black px-4 py-2 rounded-full hover:bg-neutral-200 transition-colors flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Unlock Safe
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[120px] -z-10"></div>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Your personal memory <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">cryptographically secured.</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Recall is a local-first semantic search engine. Save websites, PDFs, and text snippets directly from your browser, and instantly retrieve them by meaning.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-4 rounded-full flex items-center justify-center gap-2 transition-transform hover:scale-105">
              <Download className="w-5 h-5" />
              Get Chrome Extension
            </button>
            <Link href="/unlock" className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 font-semibold px-8 py-4 rounded-full flex items-center justify-center gap-2 transition-colors">
              Access Web Vault <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-24 bg-neutral-950 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Built for Absolute Privacy</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">We designed Recall as a Hardware-Bound Safe. There are no usernames, no email lists, and no tracking.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-black border border-white/10 p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Hardware Locked</h3>
              <p className="text-neutral-400 leading-relaxed">
                Your safe is locked not just by your password, but by the physical hardware signature of your device. Even if someone steals your password, they cannot access your memories from another computer.
              </p>
            </div>

            <div className="bg-black border border-white/10 p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-6">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">1-Click Save</h3>
              <p className="text-neutral-400 leading-relaxed">
                Using the Recall Chrome Extension, you can save entire webpages, articles, or highlighted text with a single click. Everything is embedded and archived instantly.
              </p>
            </div>

            <div className="bg-black border border-white/10 p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Semantic Search</h3>
              <p className="text-neutral-400 leading-relaxed">
                Don't remember the exact keyword? Recall uses advanced vector embeddings to let you search by meaning, concept, or asking a question directly to your memories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-neutral-500 text-sm">
        <p>Recall © {new Date().getFullYear()} — Your Memory, Secured.</p>
      </footer>
    </div>
  );
}
