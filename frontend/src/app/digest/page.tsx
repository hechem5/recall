"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Calendar, Archive, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface OrphanedSource {
  id: string;
  title?: string;
  originalUrl?: string;
  type: string;
  createdAt: string;
}

interface Digest {
  id: string;
  content: string;
  createdAt: string;
  orphanedSources?: OrphanedSource[];
}

export default function DigestPage() {
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDigests();
  }, []);

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

  const handleKeep = async (digestId: string, sourceId: string) => {
    try {
      await fetch(`/api/proxy/memories/${sourceId}/access`, { method: "POST" });
      setDigests(prev => prev.map(d => {
        if (d.id !== digestId) return d;
        return {
          ...d,
          orphanedSources: d.orphanedSources?.filter(s => s.id !== sourceId)
        };
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (digestId: string, sourceId: string) => {
    if (!confirm("Delete this memory permanently?")) return;
    try {
      await fetch(`/api/proxy/memories/${sourceId}`, { method: "DELETE" });
      setDigests(prev => prev.map(d => {
        if (d.id !== digestId) return d;
        return {
          ...d,
          orphanedSources: d.orphanedSources?.filter(s => s.id !== sourceId)
        };
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeepAll = async (digestId: string) => {
    const digest = digests.find(d => d.id === digestId);
    if (!digest || !digest.orphanedSources) return;
    
    try {
      await Promise.all(digest.orphanedSources.map(s => 
        fetch(`/api/proxy/memories/${s.id}/access`, { method: "POST" })
      ));
      setDigests(prev => prev.map(d => d.id === digestId ? { ...d, orphanedSources: [] } : d));
    } catch (e) {
      console.error("Failed to keep all", e);
    }
  };

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
                
                <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed mb-8">
                  {digest.content.split('\n').map((para, i) => (
                    <p key={i} className={para.trim() ? "mb-4" : ""}>{para}</p>
                  ))}
                </div>

                {digest.orphanedSources && digest.orphanedSources.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-zinc-200 font-medium flex items-center gap-2">
                        <Archive className="w-4 h-4 text-zinc-400" />
                        Dusty Memories
                      </h3>
                      <button 
                        onClick={() => handleKeepAll(digest.id)}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Keep All
                      </button>
                    </div>
                    <p className="text-sm text-zinc-400 mb-4">These items haven't been opened in a while. Keep them or clean them up?</p>
                    
                    <div className="space-y-3">
                      {digest.orphanedSources.map((source) => (
                        <div key={source.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                          <div className="truncate mr-4 mb-3 sm:mb-0">
                            <div className="text-sm text-zinc-200 truncate font-medium">
                              {source.originalUrl ? (
                                <a href={source.originalUrl} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
                                  {source.title || source.originalUrl}
                                </a>
                              ) : (
                                source.title || "Untitled"
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 mt-1">
                              Saved {format(new Date(source.createdAt), "MMM d, yyyy")}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 shrink-0">
                            <button 
                              onClick={() => handleKeep(digest.id, source.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Keep
                            </button>
                            <button 
                              onClick={() => handleDelete(digest.id, source.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                            >
                              <Archive className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
