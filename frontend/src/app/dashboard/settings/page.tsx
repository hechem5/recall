"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Settings() {
  const router = useRouter();
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/unlock");
    router.refresh();
  };

  const generateCodes = async () => {
    if (!confirm("Are you sure? This will instantly invalidate all your old recovery codes.")) return;
    
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/proxy/auth/regenerate-recovery-codes", { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to generate codes");
      } else {
        setCodes(data.recoveryCodes);
      }
    } catch (err) {
      setErrorMsg("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <main className="min-h-screen bg-black text-[#E5E5E5] p-8 md:p-16 flex flex-col items-center">
      {/* Top Bar */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-24 border-b border-[#262626] pb-4">
        <a href="/" className="text-xl font-bold tracking-widest uppercase hover:text-[#FF3366] transition-colors cursor-pointer text-decoration-none">
          Recall<span className="text-[#FF3366]">_</span>
        </a>
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/dashboard')} className="text-xs tracking-widest uppercase text-[#737373] hover:text-[#FF3366] transition-colors">
            [ ARCHIVE ]
          </button>
          <button onClick={handleLogout} className="text-xs tracking-widest uppercase hover:text-[#FF3366] transition-colors">
            [ LOGOUT ]
          </button>
        </div>
      </div>

      <div className="w-full max-w-2xl flex flex-col space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight uppercase">Settings</h1>
          <p className="text-sm md:text-base text-[#737373] uppercase tracking-wider">
            Manage your account security and recovery codes.
          </p>
        </div>

        <div className="p-8 border border-[#262626] bg-[#0A0A0A] flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest mb-2">Device Recovery Codes</h2>
            <p className="text-sm text-[#737373] uppercase leading-relaxed">
              If you wipe the extension or install Recall on a new device, you will need a Recovery Code to log in. Each code can only be used once. If you run out or lost them, generate a new batch here.
            </p>
          </div>

          <button
            onClick={generateCodes}
            disabled={loading}
            className="w-full bg-[#E5E5E5] text-black py-4 font-bold tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? "GENERATING..." : "GENERATE NEW RECOVERY CODES"}
          </button>

          {errorMsg && (
            <p className="text-[#FF3366] text-sm uppercase font-bold">{errorMsg}</p>
          )}

          {codes.length > 0 && (
            <div className="mt-8 border-t border-[#262626] pt-8">
              <p className="text-[#FF3366] text-sm font-bold uppercase mb-6">
                Please copy these codes and store them securely!
              </p>
              <div className="grid grid-cols-2 gap-4">
                {codes.map((code, idx) => (
                  <button
                    key={idx}
                    onClick={() => copyCode(code, idx)}
                    className="p-3 border border-[#262626] hover:border-[#FF3366] text-[#E5E5E5] font-mono text-center text-sm transition-colors relative"
                  >
                    {code}
                    {copied === idx && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#FF3366] text-xs font-bold uppercase">
                        Copied
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
