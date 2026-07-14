"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface WatchProgress {
  id: string;
  url: string;
  title: string | null;
  currentTime: number;
  duration: number;
  percentComplete: number;
  updatedAt: string;
  isFavorite: boolean;
}

export function ContinueWatching() {
  const [records, setRecords] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch("/api/proxy/watch-progress");
        if (res.ok) {
          const data = await res.json();
          setRecords(data);
        }
      } catch (err) {
        console.error("Failed to fetch watch progress", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/proxy/watch-progress/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecords(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete watch progress", err);
    }
  };

  const handleFavoriteToggle = async (id: string, currentStatus: boolean) => {
    setErrorMsg(null);
    const newStatus = !currentStatus;
    
    // Optimistic update
    setRecords(prev => prev.map(r => r.id === id ? { ...r, isFavorite: newStatus } : r));

    try {
      const res = await fetch(`/api/proxy/watch-progress/${id}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newStatus })
      });
      
      if (!res.ok) {
        // Revert on failure
        setRecords(prev => prev.map(r => r.id === id ? { ...r, isFavorite: currentStatus } : r));
        const data = await res.json();
        if (res.status === 409) {
          setErrorMsg(data.error || "Maximum 2 favorites. Unfavorite one first.");
        } else {
          setErrorMsg("Failed to update favorite status.");
        }
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
      // Revert on failure
      setRecords(prev => prev.map(r => r.id === id ? { ...r, isFavorite: currentStatus } : r));
      setErrorMsg("Network error updating favorite status.");
    }
  };

  if (loading) return null;
  if (records.length === 0) return null;

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '00:00';
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sc = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sc}`;
  };

  return (
    <div className="w-full pt-16 mt-16 border-t border-[#262626]">
      <div className="mb-8">
        <h2 className="text-xl font-bold uppercase tracking-widest">Continue Watching</h2>
        <p className="text-sm text-[#737373] mt-2 uppercase">Your recently watched videos across the web. Title is extracted best-effort from the page.</p>
        {errorMsg && (
          <p className="text-sm text-[#FF3366] mt-4 uppercase border border-[#FF3366] p-2 inline-block">
            {errorMsg}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.map((record) => {
          const progressPercent = Math.min(100, Math.max(0, record.percentComplete * 100));
          const timeAgo = formatDistanceToNow(new Date(record.updatedAt), { addSuffix: true });
          
          return (
            <div key={record.id} className="group flex flex-col p-4 border border-[#262626] bg-[#0A0A0A] hover:border-[#404040] transition-all relative">
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleFavoriteToggle(record.id, record.isFavorite)}
                  className={`p-2 transition-colors ${record.isFavorite ? 'text-[#FF3366] opacity-100' : 'text-[#737373] hover:text-[#FF3366]'}`}
                  title={record.isFavorite ? "Unfavorite" : "Favorite for extension popup"}
                >
                  {record.isFavorite ? "★" : "☆"}
                </button>
                <button 
                  onClick={() => handleDelete(record.id)}
                  className="p-2 text-[#737373] hover:text-[#FF3366] transition-colors"
                  title="Remove from history"
                >
                  ✕
                </button>
              </div>
              
              <a href={record.url} target="_blank" rel="noopener noreferrer" className="flex flex-col flex-1 min-w-0 pr-16">
                <span className="text-sm font-medium text-[#E5E5E5] group-hover:text-[#FF3366] truncate transition-colors">
                  {record.title || record.url}
                </span>
                <span className="text-xs text-[#737373] mt-2 mb-4">
                  {formatTime(record.currentTime)} / {formatTime(record.duration)} • Updated {timeAgo}
                </span>
                
                <div className="w-full bg-[#262626] h-1.5 mt-auto">
                  <div 
                    className="bg-[#FF3366] h-full" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
