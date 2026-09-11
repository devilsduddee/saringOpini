"use client";

import React, { useState, useRef } from "react";
import { Search, Link as LinkIcon, MessageSquare, AlertCircle, Sparkles } from "lucide-react";
import { 
  animateChipPress, 
  animateTextareaInjection, 
  animateSubmitCtaPulse, 
  smoothAutoScroll 
} from "@/lib/gsap";

interface VerificationFormProps {
  onVerify: (query: string) => void;
  isLoading: boolean;
}

const SAMPLE_QUERIES = [
  {
    id: "hoax",
    label: "Contoh Hoax WhatsApp",
    text: "Pemerintah bagikan kuota internet 100GB gratis sambut tahun ajaran baru, daftar sekarang sebelum kuota habis di link bit.ly/kuota-kominfo-2026",
  },
  {
    id: "url",
    label: "Contoh Berita URL",
    text: "https://news.detik.com/berita/d-1234567/skb-3-menteri-resmi-tetapkan-libur-nasional",
  },
  {
    id: "medis",
    label: "Contoh Isu Medis",
    text: "Minum air rebusan serai campur madu setiap pagi terbukti bisa menyembuhkan diabetes stadium akhir tanpa obat dokter.",
  },
];

export function VerificationForm({ onVerify, isLoading }: VerificationFormProps) {
  const [input, setInput] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed.length < 5) {
      setValidationError("Masukkan minimal 5 karakter kalimat klaim atau tautan URL yang valid.");
      return;
    }
    setValidationError(null);
    onVerify(trimmed);
  };

  const handleSelectPreset = (sampleId: string, text: string, e: React.MouseEvent<HTMLButtonElement>) => {
    animateChipPress(e.currentTarget);
    setSelectedPreset(sampleId);
    setInput(text);
    setValidationError(null);

    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(text.length, text.length);
    }

    animateTextareaInjection("#verification-input");
    smoothAutoScroll(textareaRef.current);

    setTimeout(() => {
      animateSubmitCtaPulse("#verify-button");
    }, 120);
  };

  return (
    <div id="tool" ref={formContainerRef} className="w-full max-w-[960px] mx-auto scroll-mt-24">
      <div className="rounded-3xl border-2 sm:border-3 border-[#FFD12F] bg-[#141414] p-5 sm:p-8 shadow-2xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-[#27272A]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 rounded-full bg-[#FFD12F]" aria-hidden="true"></span>
            <h2 className="text-base sm:text-xl font-black uppercase tracking-wider text-white">
              Pusat Verifikasi Fakta
            </h2>
          </div>
          <span className="text-xs text-[#71717A] font-semibold">
            Mendukung URL Berita & Teks Bebas
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="relative">
            <label htmlFor="verification-input" className="sr-only">
              Tautan berita atau teks klaim yang ingin diverifikasi
            </label>
            <textarea
              id="verification-input"
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setSelectedPreset(null);
                if (validationError) setValidationError(null);
              }}
              placeholder="Tempel tautan berita (https://...) atau tulis narasi/broadcast pesan WhatsApp yang ingin Anda cek kebenarannya di sini..."
              rows={4}
              disabled={isLoading}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? "input-error-msg" : undefined}
              className="w-full min-h-[150px] resize-y rounded-2xl border border-[#27272A] bg-[#0D0D0D] p-4 text-sm sm:text-base text-white placeholder:text-[#71717A] focus:border-[#FFD12F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 transition-all disabled:opacity-50 font-normal leading-relaxed break-words"
            />
          </div>

          {validationError && (
            <div 
              id="input-error-msg"
              role="alert"
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#EF4444] bg-[#EF4444]/10 p-3.5 rounded-xl border border-[#EF4444]/30"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3 text-xs text-[#A1A1AA]">
              <span className="flex items-center gap-1.5 font-medium bg-[#1C1C1C] px-2.5 py-1 rounded-md border border-[#27272A]">
                <LinkIcon className="h-3.5 w-3.5 text-[#FFD12F]" /> URL Link
              </span>
              <span className="flex items-center gap-1.5 font-medium bg-[#1C1C1C] px-2.5 py-1 rounded-md border border-[#27272A]">
                <MessageSquare className="h-3.5 w-3.5 text-[#FFD12F]" /> Pesan Broadcast
              </span>
            </div>

            <button
              type="submit"
              id="verify-button"
              disabled={isLoading}
              aria-label={isLoading ? "Sedang memproses verifikasi" : "Jalankan verifikasi fakta"}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#FFD12F] px-8 text-sm sm:text-base font-black uppercase tracking-wider text-[#0D0D0D] hover:bg-[#FFE164] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
            >
              <Search className="h-5 w-5 stroke-[3]" aria-hidden="true" />
              <span>{isLoading ? "Memproses Pipeline..." : "Verifikasi Sekarang"}</span>
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-[#27272A]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5 text-[#FFD12F]" aria-hidden="true" />
            <span>Coba Contoh Kasus Nyata:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SAMPLE_QUERIES.map((sample) => {
              const isSelected = selectedPreset === sample.id;
              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={(e) => handleSelectPreset(sample.id, sample.text, e)}
                  disabled={isLoading}
                  aria-label={`Muat ${sample.label}`}
                  className={`rounded-xl p-3 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 transition-all text-left min-h-[44px] flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? "border border-[#FFD12F] bg-[#FFD12F]/15 text-white shadow-md"
                      : "border border-[#27272A] bg-[#1C1C1C] text-[#A1A1AA] hover:border-[#FFD12F] hover:text-white"
                  }`}
                >
                  <span className={isSelected ? "text-[#FFD12F] font-bold" : ""}>
                    {sample.label}
                  </span>
                  <span className={`font-bold transition-transform ${isSelected ? "text-[#FFD12F] translate-x-0.5" : "text-[#71717A] group-hover:text-[#FFD12F]"}`}>
                    →
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
