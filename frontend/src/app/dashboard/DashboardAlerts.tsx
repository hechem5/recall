'use client';

import { useState } from 'react';

export default function DashboardAlerts({ 
  usedRecoveryCode, 
  remainingRecoveryCodes 
}: { 
  usedRecoveryCode?: boolean, 
  remainingRecoveryCodes?: number 
}) {
  const [showUsedCodeBanner, setShowUsedCodeBanner] = useState(!!usedRecoveryCode);
  const [showRegeneratePrompt, setShowRegeneratePrompt] = useState(
    remainingRecoveryCodes !== undefined && remainingRecoveryCodes <= 3
  );
  
  const [loading, setLoading] = useState(false);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/regenerate', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || 'Failed to regenerate recovery codes');
        return;
      }
      
      setNewCodes(data.recoveryCodes);
    } catch (err) {
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleModalProceed = () => {
    if (!savedConfirmed) return;
    setNewCodes(null);
    setShowRegeneratePrompt(false);
  };

  return (
    <>
      {showUsedCodeBanner && (
        <div className="w-full bg-[#FF3366] text-black font-bold tracking-widest text-xs py-3 px-4 flex justify-between items-center z-50 sticky top-0 uppercase">
          <span>[ ALERT ] Your vault was accessed from a new device. A recovery code was burned.</span>
          <button 
            onClick={() => setShowUsedCodeBanner(false)}
            className="border border-black px-3 py-1 hover:bg-black hover:text-[#FF3366] transition-colors"
          >
            DISMISS
          </button>
        </div>
      )}

      {showRegeneratePrompt && !newCodes && (
        <div className="fixed bottom-8 right-8 bg-[#111111] border border-[#FF3366] p-6 max-w-sm shadow-2xl z-40">
          <h4 className="text-[#FF3366] font-bold tracking-widest uppercase mb-2">CRITICAL WARNING</h4>
          <p className="text-xs text-[#A3A3A3] mb-4">
            You only have {remainingRecoveryCodes} recovery codes remaining. If you run out, you will lose access to your vault if your browser cookies are cleared.
          </p>
          <button 
            onClick={handleRegenerate}
            disabled={loading}
            className="w-full border border-[#FF3366] text-[#FF3366] font-bold tracking-widest text-xs py-3 uppercase hover:bg-[#FF3366] hover:text-black transition-colors disabled:opacity-50"
          >
            {loading ? 'GENERATING...' : 'GENERATE NEW BATCH'}
          </button>
        </div>
      )}

      {newCodes && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="max-w-2xl w-full bg-[#111111] border border-[#FF3366] p-8 md:p-12 space-y-8 animate-in fade-in zoom-in-95">
            <div className="border-b border-[#FF3366]/30 pb-4">
              <h2 className="text-2xl font-bold tracking-widest text-[#FF3366] uppercase">Critical: Save New Recovery Codes</h2>
              <p className="text-[#A3A3A3] text-sm mt-2">
                Your previous unused codes have been securely destroyed. You MUST securely save this new batch of recovery codes.
              </p>
              <p className="text-[#E5E5E5] font-bold text-sm mt-2 uppercase tracking-widest">
                These will never be shown again.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {newCodes.map((code, idx) => (
                <div key={idx} className="bg-black border border-[#262626] p-4 text-center font-bold tracking-widest text-lg text-[#E5E5E5]">
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
                  I confirm that I have securely saved these new recovery codes. I understand that my old codes are now invalid.
                </span>
              </label>

              <button 
                onClick={handleModalProceed}
                disabled={!savedConfirmed}
                className="w-full bg-[#FF3366] text-black font-bold tracking-widest uppercase py-4 disabled:opacity-50 disabled:bg-[#262626] disabled:text-[#737373] transition-colors"
              >
                [ RETURN TO DASHBOARD ]
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
