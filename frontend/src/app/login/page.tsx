"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        toast.success("Welcome back to Recall.");
        router.push("/");
        router.refresh();
      } else {
        toast.error("Incorrect password.");
      }
    } catch (err) {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-[#E5E5E5] p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl flex flex-col space-y-12">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-widest uppercase">
            Recall<span className="text-[#FF3366]">_</span>
          </h1>
          <p className="text-xs text-[#737373] tracking-widest uppercase">
            Please log in to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col space-y-12">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
            className="w-full bg-transparent border-b-2 border-[#262626] focus:border-[#FF3366] py-6 text-2xl text-center font-medium outline-none transition-colors placeholder:text-[#404040] text-[#E5E5E5] tracking-widest"
            required
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="self-center text-sm font-bold tracking-widest text-[#737373] hover:text-[#FF3366] transition-colors disabled:opacity-50"
          >
            {loading ? "PROCESSING..." : "LOGIN"}
          </button>
        </form>
      </div>
    </main>
  );
}
