'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import fpPromise from '@fingerprintjs/fingerprintjs';

import Link from 'next/link';

export default function UnlockPage() {
  const [password, setPassword] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await fpPromise.load();
      const result = await fp.get();
      setDeviceId(result.visitorId);
    };
    getFingerprint();
  }, []);

  const handleAuth = async (action: 'create' | 'unlock') => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, deviceId, action })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'AUTHENTICATION FAILED');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-[#E5E5E5] p-8 md:p-16 flex flex-col items-center justify-center font-mono relative">
      
      <Link href="/" className="absolute top-8 left-8 text-[#737373] hover:text-[#FF3366] transition-colors flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
        ← BACK TO HOME
      </Link>

      <div className="w-full max-w-lg flex flex-col items-center">
        {/* Header */}
        <div className="w-full border-b border-[#262626] pb-4 mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-widest uppercase mb-2">
            The Vault<span className="text-[#FF3366]">_</span>
          </h1>
          <p className="text-xs text-[#737373] tracking-widest uppercase">
            A cryptographically secured memory archive.
          </p>
        </div>

        {/* Input Form */}
        <div className="w-full space-y-8">
          <div className="space-y-4 text-center">
            <label className="block text-xs font-bold tracking-widest uppercase text-[#737373]">
              Vault Key
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ENTER KEY..."
              className="w-full bg-transparent border-b-2 border-[#262626] focus:border-[#FF3366] py-4 text-center text-xl tracking-[0.5em] outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="text-xs font-bold tracking-widest uppercase text-[#FF3366] text-center bg-[#FF3366]/10 border border-[#FF3366]/30 py-3">
              [ ERROR: {error} ]
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={() => handleAuth('unlock')}
              disabled={loading || !password || !deviceId}
              className="w-full sm:w-1/2 border border-[#262626] hover:border-[#FF3366] text-xs font-bold tracking-widest uppercase py-4 transition-colors disabled:opacity-50 hover:text-[#FF3366]"
            >
              [ {loading ? 'PROCESSING...' : 'UNLOCK'} ]
            </button>
            <button 
              onClick={() => handleAuth('create')}
              disabled={loading || !password || !deviceId}
              className="w-full sm:w-1/2 border border-[#262626] hover:border-[#E5E5E5] text-xs font-bold tracking-widest uppercase py-4 transition-colors disabled:opacity-50"
            >
              [ CREATE NEW ]
            </button>
          </div>
        </div>

        {/* Hardware Status */}
        <div className="w-full border-t border-[#262626] mt-16 pt-8 text-center space-y-2">
          <p className="text-xs text-[#737373] tracking-widest uppercase">
            Vault bounds to device hardware.
          </p>
          <p className="text-xs tracking-widest uppercase text-[#FF3366]">
            {deviceId ? `HWID: ${deviceId.substring(0, 16)}` : 'GENERATING HARDWARE SIGNATURE...'}
          </p>
        </div>
      </div>

    </main>
  );
}
