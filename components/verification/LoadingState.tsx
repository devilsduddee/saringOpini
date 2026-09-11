"use client";

import React, { useEffect, useRef } from "react";
import { 
  CheckCircle2, 
  ShieldCheck, 
  Search, 
  FileText, 
  Sparkles, 
  CheckCheck,
  Loader2
} from "lucide-react";
import { VerificationStage } from "@/types/verification";
import { animateLoadingProgress, animatePipelineStep } from "@/lib/gsap";

interface LoadingStateProps {
  stage: VerificationStage;
  stageMessage?: string;
  progressPercent?: number;
}

interface StageConfig {
  id: VerificationStage;
  number: number;
  label: string;
  defaultDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  targetPercent: number;
}

const STAGES: StageConfig[] = [
  {
    id: "validation",
    number: 1,
    label: "1. Validasi Input",
    defaultDescription: "Memvalidasi teks klaim dan parameter sistem...",
    icon: ShieldCheck,
    targetPercent: 10,
  },
  {
    id: "extraction",
    number: 2,
    label: "2. Ekstraksi Entitas & Klaim",
    defaultDescription: "Mengekstraksi entitas utama dari artikel...",
    icon: FileText,
    targetPercent: 25,
  },
  {
    id: "searching",
    number: 3,
    label: "3. Pencarian Sumber Berita",
    defaultDescription: "Mencari berita pembanding dengan lokasi yang sama...",
    icon: Search,
    targetPercent: 40,
  },
  {
    id: "scraping",
    number: 4,
    label: "4. Pengambilan Artikel Referensi",
    defaultDescription: "Mengambil artikel referensi dan menyaring relevansi...",
    icon: FileText,
    targetPercent: 60,
  },
  {
    id: "analyzing",
    number: 5,
    label: "5. Analisis Bukti & AI",
    defaultDescription: "Menganalisis bukti dan sumber pembanding...",
    icon: Sparkles,
    targetPercent: 80,
  },
  {
    id: "synthesizing",
    number: 6,
    label: "6. Menyusun Hasil Akhir",
    defaultDescription: "Menyusun kesimpulan akhir...",
    icon: CheckCheck,
    targetPercent: 95,
  },
];

export function LoadingState({ stage, stageMessage, progressPercent }: LoadingStateProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Determine active stage index
  const currentStageIndex = STAGES.findIndex((s) => s.id === stage);
  const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;
  const currentConfig = STAGES[activeIndex] || STAGES[0];

  const currentPercent = progressPercent ?? currentConfig.targetPercent;
  const displayMessage = stageMessage || currentConfig.defaultDescription;

  useEffect(() => {
    animateLoadingProgress("#active-loading-progress-bar", currentPercent);
  }, [currentPercent]);

  // Animate step cards upon active stage advancement
  useEffect(() => {
    if (cardRefs.current[activeIndex]) {
      animatePipelineStep(cardRefs.current[activeIndex], false);
    }
    if (activeIndex > 0 && cardRefs.current[activeIndex - 1]) {
      animatePipelineStep(cardRefs.current[activeIndex - 1], true);
    }
  }, [activeIndex]);

  return (
    <div
      id="verification-loader-container"
      aria-live="polite"
      aria-busy="true"
      role="status"
      className="w-full max-w-[960px] mx-auto my-8 rounded-3xl border-2 border-[#27272A] bg-[#141414] p-5 sm:p-8 md:p-10 shadow-2xl space-y-7 transition-all"
    >
      {/* 1. Header & Live Status Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-[#FFD12F]/10 border border-[#FFD12F]/30 shrink-0">
            <Loader2 className="h-5 w-5 text-[#FFD12F] animate-spin" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>Proses Verifikasi Real-Time</span>
              <span className="text-xs font-mono font-normal text-[#71717A]">
                ({activeIndex + 1}/6)
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-[#FFD12F] font-medium pt-0.5" aria-atomic="true">
              {displayMessage}
            </p>
          </div>
        </div>

        {/* Real-time Numeric Progress Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs sm:text-sm font-bold text-[#A1A1AA] bg-[#0D0D0D] px-3.5 py-1.5 rounded-xl border border-[#27272A]">
          <span>Progres:</span>
          <span className="text-white font-black">{currentPercent}%</span>
        </div>
      </div>

      {/* 2. Linear Progress Bar */}
      <div className="space-y-1.5">
        <div 
          className="h-2.5 w-full rounded-full bg-[#0D0D0D] overflow-hidden border border-[#27272A] relative"
          role="progressbar"
          aria-valuenow={currentPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            id="active-loading-progress-bar"
            ref={progressBarRef}
            className="h-full rounded-full bg-gradient-to-r from-[#FFD12F] to-[#FFE164] transition-all duration-300 relative overflow-hidden"
            style={{ width: `${currentPercent}%` }}
          >
            {/* Shimmer highlight overlay */}
            <div className="absolute inset-0 bg-white/20 -skew-x-12 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* 3. 6-Stage Interactive Step Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {STAGES.map((s, idx) => {
          const isCompleted = idx < activeIndex || currentPercent === 100;
          const isActive = idx === activeIndex && currentPercent < 100;
          const isPending = idx > activeIndex && currentPercent < 100;
          const StageIcon = s.icon;

          let cardStyles = "border-[#27272A] bg-[#0D0D0D] text-[#71717A] opacity-50";
          let badgeStyles = "bg-[#1C1C1C] text-[#71717A] border-[#27272A]";

          if (isActive) {
            cardStyles = "border-[#FFD12F] bg-[#FFD12F]/10 text-white shadow-lg scale-[1.02] opacity-100 ring-1 ring-[#FFD12F]/60";
            badgeStyles = "bg-[#FFD12F] text-[#0D0D0D] border-[#FFD12F] font-black";
          } else if (isCompleted) {
            cardStyles = "border-[#22C55E]/40 bg-[#22C55E]/5 text-[#E4E4E7] opacity-90";
            badgeStyles = "bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/40";
          }

          return (
            <div
              key={s.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className={`flex items-start gap-3 rounded-2xl p-3.5 border transition-all duration-300 ease-out ${cardStyles}`}
            >
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-xs font-mono font-bold transition-all ${badgeStyles}`}>
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E] step-check-icon" />
                ) : (
                  <span>{s.number}</span>
                )}
              </div>

              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs sm:text-sm font-bold truncate">
                    {s.label}
                  </h4>
                  {isActive && (
                    <StageIcon className="h-3.5 w-3.5 text-[#FFD12F] shrink-0 animate-spin" />
                  )}
                </div>
                <p className="text-[11px] text-[#A1A1AA] line-clamp-1 leading-snug">
                  {isCompleted ? "Selesai diverifikasi" : isPending ? "Menunggu giliran" : displayMessage}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


