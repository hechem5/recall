"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Link as LinkIcon, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type UploadMode = "file" | "url" | "text";

export function UploadDropzone() {
  const [mode, setMode] = useState<UploadMode>("file");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "file");
    formData.append("title", file.name);

    await submitToApi(formData);
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    await submitToApi(JSON.stringify({ type: "url", content: url }));
    setUrl("");
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;
    
    await submitToApi(JSON.stringify({ type: "text", content: text }));
    setText("");
  };

  const submitToApi = async (body: BodyInit) => {
    setIsUploading(true);
    try {
      const isFormData = body instanceof FormData;
      const res = await fetch("/api/proxy/ingest", {
        method: "POST",
        headers: isFormData ? {} : { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) throw new Error("Failed to ingest content");
      
      toast.success("Content successfully ingested to your memory.");
    } catch (err) {
      toast.error("Failed to ingest. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto border border-[#262626] bg-[#0A0A0A] p-8 transition-all duration-300">
      <div className="flex gap-4 mb-8 border-b border-[#262626] pb-4">
        <button
          onClick={() => setMode("file")}
          className={cn("text-xs font-bold uppercase tracking-widest transition-colors", mode === "file" ? "text-[#FF3366]" : "text-[#737373] hover:text-[#E5E5E5]")}
        >
          UPLOAD FILE
        </button>
        <button
          onClick={() => setMode("url")}
          className={cn("text-xs font-bold uppercase tracking-widest transition-colors", mode === "url" ? "text-[#FF3366]" : "text-[#737373] hover:text-[#E5E5E5]")}
        >
          SAVE LINK
        </button>
        <button
          onClick={() => setMode("text")}
          className={cn("text-xs font-bold uppercase tracking-widest transition-colors", mode === "text" ? "text-[#FF3366]" : "text-[#737373] hover:text-[#E5E5E5]")}
        >
          SAVE TEXT
        </button>
      </div>

      <div className="min-h-[200px] flex flex-col relative">
        {isUploading && (
          <div className="absolute inset-0 z-10 bg-[#0A0A0A]/90 flex flex-col items-center justify-center">
            <div className="text-[#FF3366] text-xs font-bold tracking-widest uppercase animate-pulse">
              SAVING TO MEMORY...
            </div>
          </div>
        )}

        {mode === "file" && (
          <div
            className={cn(
              "relative w-full border-2 border-dashed p-12 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group bg-[#0A0A0A]",
              isDragging ? "border-[#FF3366] bg-[#FF3366]/5" : "border-[#262626] hover:border-[#FF3366]"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.txt,.md"
              disabled={isUploading}
            />
            
            <div className="flex flex-col items-center space-y-4">
              <div className="text-xs font-bold text-[#737373] tracking-widest uppercase mb-2 group-hover:text-[#FF3366] transition-colors">
                {isDragging ? "DROP FILE HERE" : "CLICK OR DRAG FILES HERE"}
              </div>
              <p className="text-xs text-[#404040] uppercase tracking-wider">
                Supported: PDF, TXT, MD
              </p>
            </div>
          </div>
        )}

        {mode === "url" && (
          <form onSubmit={handleUrlSubmit} className="flex flex-col space-y-8 h-full">
            <input
              type="url"
              placeholder="Paste a web link here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-transparent border-b-2 border-[#262626] focus:border-[#FF3366] py-6 text-lg font-medium outline-none transition-colors placeholder:text-[#404040]"
              disabled={isUploading}
            />
            <button
              type="submit"
              disabled={isUploading || !url.trim()}
              className="self-end text-sm font-bold tracking-widest text-[#737373] hover:text-[#FF3366] transition-colors disabled:opacity-50"
            >
              SAVE LINK
            </button>
          </form>
        )}

        {mode === "text" && (
          <form onSubmit={handleTextSubmit} className="flex flex-col space-y-8 h-full">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste text here..."
              className="w-full min-h-[160px] bg-transparent border border-[#262626] focus:border-[#FF3366] p-4 text-sm outline-none transition-colors placeholder:text-[#404040] resize-none"
              disabled={isUploading}
            />
            <button
              type="submit"
              disabled={isUploading || !text.trim()}
              className="self-end text-sm font-bold tracking-widest text-[#737373] hover:text-[#FF3366] transition-colors disabled:opacity-50"
            >
              SAVE TEXT
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
