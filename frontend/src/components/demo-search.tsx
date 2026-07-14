"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

const DEMO_QUERIES = [
  {
    query: "What was the link that compared Next.js vs Vite performance?",
    answer: "The article you saved yesterday compared Next.js and Vite. It concluded that Vite is significantly faster for local development due to native ES modules, while Next.js excels in production for server-side rendered applications [1].",
    sources: [{ title: "Frontend Framework Performance Showdown", url: "#" }]
  },
  {
    query: "Which PDF contains my tax documents for 2024?",
    answer: "Your 2024 tax documents are located in the file you uploaded last week. Specifically, your W2 and 1099 forms are combined in the second section [1].",
    sources: [{ title: "2024_Tax_Returns_Final.pdf", url: "#" }]
  }
];

export function DemoSearch() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<typeof DEMO_QUERIES[0] | null>(null);

  const handleSearch = (selectedQuery: string) => {
    setQuery(selectedQuery);
    setResult(null);
    setIsSearching(true);

    const match = DEMO_QUERIES.find(q => q.query === selectedQuery) || DEMO_QUERIES[0];

    // Simulate network delay
    setTimeout(() => {
      setIsSearching(false);
      setResult(match);
    }, 1500);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    handleSearch(query);
  };

  return (
    <div className="w-full max-w-2xl border border-[#262626] bg-[#0A0A0A] p-6 shadow-2xl relative overflow-hidden group hover:border-[#FF3366] transition-colors">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF3366]/0 via-[#FF3366] to-[#FF3366]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <form onSubmit={onSubmit} className="relative mb-6">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask your memory..."
          className="w-full bg-transparent border-b border-[#262626] focus:border-[#FF3366] py-4 pl-10 text-sm outline-none transition-colors placeholder:text-[#404040]"
        />
        <button
          type="submit"
          className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-bold tracking-widest text-[#737373] hover:text-[#FF3366] transition-colors"
        >
          [ SEARCH ]
        </button>
      </form>

      {!isSearching && !result && (
        <div className="flex flex-col space-y-3">
          <span className="text-[10px] tracking-widest uppercase text-[#404040] font-bold">Try an example:</span>
          {DEMO_QUERIES.map((demo, idx) => (
            <button
              key={idx}
              onClick={() => handleSearch(demo.query)}
              className="text-left text-sm text-[#737373] hover:text-[#E5E5E5] transition-colors hover:underline decoration-[#262626] underline-offset-4"
            >
              "{demo.query}"
            </button>
          ))}
        </div>
      )}

      {isSearching && (
        <div className="flex items-center space-x-3 text-[#FF3366] animate-pulse py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs tracking-widest uppercase font-bold">Searching vault...</span>
        </div>
      )}

      {result && !isSearching && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="text-xs font-bold text-[#FF3366] tracking-widest uppercase mb-3">Recall Synthesized</div>
          <p className="text-sm leading-relaxed text-[#E5E5E5] mb-6">
            {result.answer}
          </p>
          <div className="text-[10px] font-bold text-[#737373] tracking-widest uppercase mb-2 border-t border-[#262626] pt-4">Sources</div>
          <div className="flex flex-col space-y-2">
            {result.sources.map((src, i) => (
              <div key={i} className="text-xs text-[#E5E5E5]">
                <span className="text-[#737373] mr-2">[{i + 1}]</span>
                <span className="underline decoration-[#262626] underline-offset-2">{src.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
