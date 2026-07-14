'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import fpPromise from '@fingerprintjs/fingerprintjs';

export default function UnlockPage() {
  const [password, setPassword] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Generate the unique hardware signature when the page loads
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
        throw new Error(data.error || 'Authentication failed');
      }

      // Successfully authenticated
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">The Vault</h1>
          <p className="text-neutral-400 text-sm">Enter your key to unlock your personal safe.</p>
        </div>

        <div className="space-y-6">
          <div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Vault Key"
              className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-neutral-600 text-center text-lg tracking-widest font-mono"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleAuth('unlock')}
              disabled={loading || !password || !deviceId}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Unlock Safe'}
            </button>
            <button 
              onClick={() => handleAuth('create')}
              disabled={loading || !password || !deviceId}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 px-4 rounded-xl transition-colors border border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create New
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-neutral-600">
          <p>This vault is cryptographically bound to your current device.</p>
          <p className="mt-1 font-mono">{deviceId ? `Hardware ID: ${deviceId.substring(0, 8)}...` : 'Generating hardware signature...'}</p>
        </div>
      </div>
    </div>
  );
}
