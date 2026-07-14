"use client";

import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/components/upload-dropzone";
import { SearchBar } from "@/components/search-bar";

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/unlock");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-black text-[#E5E5E5] p-8 md:p-16 flex flex-col items-center">
      
      {/* Top Bar */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-24 border-b border-[#262626] pb-4">
        <div className="text-xl font-bold tracking-widest uppercase">
          Recall<span className="text-[#FF3366]">_</span>
        </div>
        <button 
          onClick={handleLogout}
          className="text-xs tracking-widest uppercase hover:text-[#FF3366] transition-colors"
        >
          [ LOGOUT ]
        </button>
      </div>

      <div className="w-full max-w-5xl flex flex-col space-y-16">
        
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight uppercase">
            Search Archive
          </h1>
          <p className="text-sm md:text-base text-[#737373] max-w-2xl uppercase tracking-wider">
            Search through your saved memories, documents, and links.
          </p>
        </div>

        <SearchBar />

        <div className="w-full pt-16 mt-16 border-t border-[#262626]">
          <div className="mb-8">
            <h2 className="text-xl font-bold uppercase tracking-widest">Add to Archive</h2>
            <p className="text-sm text-[#737373] mt-2 uppercase">Save new documents, links, or text to your memory.</p>
          </div>
          <UploadDropzone />
        </div>

      </div>
    </main>
  );
}
