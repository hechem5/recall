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
}

export function ContinueWatching() {
  const [records, setRecords] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return null;
  if (records.length === 0) return null;

  return (
    <div className="w-full pt-16 mt-16 border-t border-[#262626]">
      <div className="mb-8">
        <h2 className="text-xl font-bold uppercase tracking-widest">Continue Watching</h2>
        <p className="text-sm text-[#737373] mt-2 uppercase">Your recently watched videos across the web. Title is extracted best-effort from the page.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.map((record) => {
          const progressPercent = Math.min(100, Math.max(0, record.percentComplete * 100));
          const timeAgo = formatDistanceToNow(new Date(record.updatedAt), { addSuffix: true });
          
          return (
            <div key={record.id} className="group flex flex-col p-4 border border-[#262626] bg-[#0A0A0A] hover:border-[#404040] transition-all relative">
              <button 
                onClick={() => handleDelete(record.id)}
                className="absolute top-2 right-2 p-2 text-[#737373] hover:text-[#FF3366] transition-colors opacity-0 group-hover:opacity-100"
                title="Remove from history"
              >
                ✕
              </button>
              
              <a href={record.url} target="_blank" rel="noopener noreferrer" className="flex flex-col flex-1 min-w-0 pr-6">
                <span className="text-sm font-medium text-[#E5E5E5] group-hover:text-[#FF3366] truncate transition-colors">
                  {record.title || record.url}
                </span>
                <span className="text-xs text-[#737373] mt-2 mb-4">
                  {Math.round(record.currentTime / 60)}m / {Math.round(record.duration / 60)}m watched • Updated {timeAgo}
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
