"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

interface Memory {
  id: string;
  type: string;
  title?: string;
  originalUrl?: string;
  rawText?: string;
  createdAt: string;
}

export default function MemoriesPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const res = await fetch("/api/proxy/memories");
      if (!res.ok) throw new Error("Failed to fetch memories");
      const data = await res.json();
      setMemories(data);
    } catch (err) {
      console.error(err);
      setError("Could not load your memories.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this memory? This action cannot be undone and will permanently remove it from your vault.")) return;

    try {
      const res = await fetch(`/api/proxy/memories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete memory");
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete memory. Please try again.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-black text-[#E5E5E5] p-8 md:p-16 flex flex-col items-center">
      {/* Top Bar */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-16 border-b border-[#262626] pb-4">
        <Link href="/" className="text-xl font-bold tracking-widest uppercase hover:text-[#FF3366] transition-colors cursor-pointer text-decoration-none">
          Recall<span className="text-[#FF3366]">_</span>
        </Link>
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-xs tracking-widest uppercase text-[#737373] hover:text-[#FF3366] transition-colors hidden md:block"
          >
            [ ARCHIVE ]
          </button>
          <button 
            onClick={() => router.push('/dashboard/settings')}
            className="text-xs tracking-widest uppercase text-[#737373] hover:text-[#FF3366] transition-colors"
          >
            [ SETTINGS ]
          </button>
          <button 
            onClick={handleLogout}
            className="text-xs tracking-widest uppercase hover:text-[#FF3366] transition-colors"
          >
            [ LOGOUT ]
          </button>
        </div>
      </div>

      <div className="w-full max-w-5xl flex flex-col space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">
            Manage Memories
          </h1>
          <p className="text-sm md:text-base text-[#737373] max-w-2xl uppercase tracking-wider">
            View and delete items saved in your vault.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center space-x-4 mt-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF3366]" />
            <span className="text-sm font-bold tracking-widest uppercase text-[#737373]">Loading...</span>
          </div>
        ) : error ? (
          <div className="text-[#FF3366] border border-[#FF3366] p-4 text-sm font-bold uppercase mt-8">
            Error: {error}
          </div>
        ) : memories.length === 0 ? (
          <div className="text-[#737373] mt-8 text-sm uppercase tracking-widest">
            Your vault is empty.
          </div>
        ) : (
          <div className="grid gap-4 mt-8">
            {memories.map((memory) => (
              <div key={memory.id} className="flex justify-between items-center border border-[#262626] p-4 hover:border-[#FF3366] transition-colors group bg-[#0A0A0A] min-w-0">
                <div className="flex-1 flex flex-col overflow-hidden mr-4 min-w-0">
                  <div className="text-xs text-[#737373] mb-1 font-bold tracking-wider uppercase">
                    {memory.type === 'url' ? 'Website' : memory.type === 'highlight' ? 'Highlight' : memory.type === 'text' ? 'Text Note' : 'Document'}
                  </div>
                  <div className="truncate w-full">
                    {memory.type === 'highlight' ? (
                      <div className="text-sm font-medium text-[#E5E5E5] truncate">
                        "{memory.rawText?.split('\n\n--- Context ---')[0] || "Highlighted snippet"}"
                        {memory.originalUrl && (
                          <a href={memory.originalUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-[#FF3366] hover:underline underline-offset-2">
                            (Source)
                          </a>
                        )}
                      </div>
                    ) : memory.originalUrl ? (
                      <a href={memory.originalUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#E5E5E5] group-hover:text-[#FF3366] truncate transition-colors underline decoration-[#262626] underline-offset-4 group-hover:decoration-[#FF3366]">
                        {memory.title || memory.originalUrl}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-[#E5E5E5] truncate">
                        {memory.title || "Untitled"}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#737373] mt-2 italic">
                    Saved: {new Date(memory.createdAt).toLocaleString("en-GB", { timeZone: "Africa/Tunis", dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDelete(memory.id)}
                  className="p-2 text-[#737373] hover:text-[#FF3366] transition-colors flex-shrink-0 border border-transparent hover:border-[#FF3366]"
                  title="Delete Memory"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
