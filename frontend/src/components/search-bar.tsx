"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Source {
  id: string;
  title?: string;
  url?: string;
  type?: string;
  savedAt?: string;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ answer: string; sources: Source[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/proxy/search?q=${encodeURIComponent(query)}&timeRange=${timeRange}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to process query.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-12">
      <form onSubmit={handleSearch} className="relative w-full group flex flex-col space-y-2">
        <div className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question or search..."
            className="w-full bg-transparent border-b-2 border-[#262626] focus:border-[#FF3366] py-6 pr-24 md:pr-32 text-xl md:text-3xl font-medium outline-none transition-colors placeholder:text-[#404040]"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-sm font-bold tracking-widest text-[#737373] hover:text-[#FF3366] transition-colors disabled:opacity-50"
          >
            {loading ? "SEARCHING..." : "SEARCH"}
          </button>
        </div>
        <div className="flex justify-end">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)} 
            className="bg-transparent text-xs font-bold tracking-widest uppercase text-[#737373] hover:text-[#FF3366] outline-none cursor-pointer transition-colors border-none"
          >
            <option value="all" className="bg-[#0A0A0A]">Time: All</option>
            <option value="week" className="bg-[#0A0A0A]">Time: Past Week</option>
            <option value="month" className="bg-[#0A0A0A]">Time: Past Month</option>
            <option value="year" className="bg-[#0A0A0A]">Time: Past Year</option>
          </select>
        </div>
      </form>

      {error && (
        <div className="text-[#FF3366] border border-[#FF3366] p-4 text-sm font-bold uppercase">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-6">
            <div className="text-xs font-bold text-[#FF3366] tracking-widest uppercase">
              Answer
            </div>
            <div className="prose prose-invert max-w-none text-[#E5E5E5] leading-relaxed prose-a:text-[#FF3366] prose-a:no-underline hover:prose-a:underline bg-[#111111] border border-[#262626] border-l-4 border-l-[#FF3366] p-6 md:p-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result.answer}
              </ReactMarkdown>
            </div>
          </div>

          {result.sources.length > 0 && (
            <div className="space-y-4 pt-8 border-t border-[#262626]">
              <div className="text-xs font-bold text-[#737373] tracking-widest uppercase mb-6">
                Sources Used
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {result.sources.map((source, idx) => (
                  <div key={idx} className="flex flex-col border border-[#262626] p-4 hover:border-[#FF3366] transition-colors group bg-[#0A0A0A] min-w-0">
                    <div className="text-xs text-[#737373] mb-2 font-bold tracking-wider uppercase">
                      {source.type === 'url' ? 'Website' : source.type === 'text' ? 'Text Note' : 'Document'}
                    </div>
                    <div className="truncate w-full">
                      {source.url ? (
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#E5E5E5] group-hover:text-[#FF3366] truncate transition-colors underline decoration-[#262626] underline-offset-4 group-hover:decoration-[#FF3366]">
                          {source.title || (source.type === 'url' ? source.url : "Untitled Document")}
                        </a>
                      ) : source.type === 'text' ? (
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-[#E5E5E5] truncate">
                            {source.title || "Untitled Note"}
                          </span>
                          <span className="text-xs text-[#737373] mt-1 italic truncate">
                            (Saved: {source.savedAt || "Unknown date"})
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-[#E5E5E5] truncate">
                            {source.title || "Untitled Document"}
                          </span>
                          <span className="text-xs text-[#737373] mt-1 italic truncate">
                            (Text only - uploaded before download update)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
