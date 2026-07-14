'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UnlockPage() {
  const [password, setPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [recoveryCodesModal, setRecoveryCodesModal] = useState<string[] | null>(null);
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  const router = useRouter();

  const handleAuth = async (action: 'create' | 'unlock') => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, recoveryCode: showRecoveryInput ? recoveryCode : undefined, action })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error && data.error.toLowerCase().includes('unrecognized device')) {
          setShowRecoveryInput(true);
        }
        throw new Error(data.error || 'AUTHENTICATION FAILED');
      }

      if (action === 'create' && data.recoveryCodes) {
        setRecoveryCodesModal(data.recoveryCodes);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  const handleModalProceed = () => {
    if (!savedConfirmed) return;
    setRecoveryCodesModal(null);
    router.push('/dashboard');
    router.refresh();
  };

  if (recoveryCodesModal) {
    return (
      <main className="min-h-screen bg-black text-[#E5E5E5] p-8 flex items-center justify-center font-mono">
        <div className="max-w-2xl w-full bg-[#111111] border border-[#FF3366] p-8 md:p-12 space-y-8">
          <div className="border-b border-[#FF3366]/30 pb-4">
            <h2 className="text-2xl font-bold tracking-widest text-[#FF3366] uppercase">Critical: Save Recovery Codes</h2>
            <p className="text-[#A3A3A3] text-sm mt-2">
              Your vault is locked to this specific browser. If you lose access, clear your cookies, or log in from a new device, you MUST use one of these one-time recovery codes to regain access.
            </p>
            <p className="text-[#E5E5E5] font-bold text-sm mt-2 uppercase tracking-widest">
              These will never be shown again.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {recoveryCodesModal.map((code, idx) => (
              <div key={idx} className="bg-black border border-[#262626] p-4 text-center font-bold tracking-widest text-lg">
                {code}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#262626] space-y-6">
            <label className="flex items-start gap-4 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={savedConfirmed}
                onChange={(e) => setSavedConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 bg-transparent border border-[#737373] checked:bg-[#FF3366] appearance-none cursor-pointer"
              />
              <span className="text-sm tracking-widest uppercase text-[#737373] group-hover:text-[#E5E5E5] transition-colors">
                I confirm that I have securely saved these recovery codes. I understand that if I lose them and my browser tokens, my vault cannot be recovered.
              </span>
            </label>

            <button 
              onClick={handleModalProceed}
              disabled={!savedConfirmed}
              className="w-full bg-[#FF3366] text-black font-bold tracking-widest uppercase py-4 disabled:opacity-50 disabled:bg-[#262626] disabled:text-[#737373] transition-colors"
            >
              [ PROCEED TO DASHBOARD ]
            </button>
          </div>
        </div>
      </main>
    );
  }

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

          {showRecoveryInput && (
            <div className="space-y-4 text-center animate-in fade-in slide-in-from-top-4">
              <label className="block text-xs font-bold tracking-widest uppercase text-[#FF3366]">
                New Device Detected. Enter Recovery Code:
              </label>
              <input 
                type="text" 
                value={recoveryCode}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                  let formatted = '';
                  for (let i = 0; i < val.length; i++) {
                    if (i > 0 && i % 4 === 0) formatted += '-';
                    formatted += val[i];
                  }
                  setRecoveryCode(formatted.substring(0, 14));
                }}
                placeholder="XXXX-XXXX-XXXX"
                className="w-full bg-[#111111] border-b-2 border-[#FF3366] py-4 text-center text-xl tracking-widest outline-none transition-colors uppercase"
              />
            </div>
          )}

          {error && (
            <div className="text-xs font-bold tracking-widest uppercase text-[#FF3366] text-center bg-[#FF3366]/10 border border-[#FF3366]/30 py-3">
              [ ERROR: {error} ]
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={() => handleAuth('unlock')}
              disabled={loading || !password || (showRecoveryInput && !recoveryCode)}
              className="w-full sm:w-1/2 border border-[#262626] hover:border-[#FF3366] text-xs font-bold tracking-widest uppercase py-4 transition-colors disabled:opacity-50 hover:text-[#FF3366]"
            >
              [ {loading ? 'PROCESSING...' : 'UNLOCK'} ]
            </button>
            <button 
              onClick={() => handleAuth('create')}
              disabled={loading || !password || showRecoveryInput}
              className="w-full sm:w-1/2 border border-[#262626] hover:border-[#E5E5E5] text-xs font-bold tracking-widest uppercase py-4 transition-colors disabled:opacity-50"
            >
              [ CREATE NEW ]
            </button>
          </div>
        </div>

        {/* Hardware Status */}
        <div className="w-full border-t border-[#262626] mt-16 pt-8 text-center space-y-2">
          <p className="text-xs text-[#737373] tracking-widest uppercase">
            Vault bounds to device securely.
          </p>
          <p className="text-xs tracking-widest uppercase text-[#FF3366]">
            SECURE TOKEN ACTIVE
          </p>
        </div>
      </div>
    </main>
  );
}
