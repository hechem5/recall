"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Digest {
  id: string;
  content: string;
  createdAt: string;
}

export default function DigestPage() {
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDigests() {
      try {
        const res = await fetch("/api/proxy/jobs/digests");
        const data = await res.json();
        if (data.digests) {
          setDigests(data.digests);
        }
      } catch (err) {
        console.error("Failed to load digests");
      } finally {
        setLoading(false);
      }
    }
    fetchDigests();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 pt-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black relative overflow-x-hidden">
      
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-purple-600/10 blur-[150px] rounded-[100%] pointer-events-none" />

      <div className="z-10 w-full max-w-4xl mx-auto flex flex-col space-y-12">
        
        <div className="space-y-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-gradient-to-b from-white via-white/90 to-white/40 bg-clip-text text-transparent pb-2">
            Weekly Digests
          </h1>
          <p className="text-xl text-zinc-400 font-medium">
            AI-synthesized summaries of your saved memories.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-zinc-500" />
          </div>
        ) : digests.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
            <p className="text-zinc-400 text-lg">No digests have been generated yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {digests.map((digest) => (
              <div key={digest.id} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:bg-white/10">
                <div className="flex items-center gap-3 text-purple-400 mb-6 border-b border-white/10 pb-4">
                  <Calendar className="w-5 h-5" />
                  <h2 className="text-lg font-semibold tracking-wide">
                    {format(new Date(digest.createdAt), "MMMM d, yyyy")}
                  </h2>
                </div>
                
                <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed">
                  {digest.content.split('\n').map((para, i) => (
                    <p key={i} className={para.trim() ? "mb-4" : ""}>{para}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
