"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ExternalLink, 
  Copy, 
  RotateCcw,
  Check,
  ShieldCheck,
  FileText
} from "lucide-react";
import { VerificationResult, VerificationStatus } from "@/types/verification";
import { animateConfidenceGauge } from "@/lib/gsap";

interface ResultCardProps {
  result: VerificationResult;
  onReset: () => void;
}

export function ResultCard({ result, onReset }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    animateConfidenceGauge("#confidence-bar", result.confidenceScore, (val) => {
      setDisplayedScore(val);
    });

    // Programmatically move focus to result card without forced scroll jump
    if (containerRef.current) {
      containerRef.current.focus({ preventScroll: true });
    }
  }, [result.confidenceScore]);

  const getStatusConfig = (status: VerificationStatus) => {
    switch (status) {
      case "FAKTA":
        return {
          label: "FAKTA / TERVERIFIKASI",
          bgColor: "bg-[#22C55E]/15",
          textColor: "text-[#22C55E]",
          borderColor: "border-[#22C55E]",
          icon: CheckCircle2,
          barColor: "bg-[#22C55E]",
          description: "Informasi ini sesuai dengan laporan resmi dan diverifikasi oleh media terpercaya.",
        };
      case "HOAX":
        return {
          label: "HOAX / MISINFORMASI",
          bgColor: "bg-[#EF4444]/15",
          textColor: "text-[#EF4444]",
          borderColor: "border-[#EF4444]",
          icon: XCircle,
          barColor: "bg-[#EF4444]",
          description: "Klaim terbukti tidak benar, dimanipulasi, atau merupakan penipuan berantai.",
        };
      case "TIDAK_DAPAT_DIPASTIKAN":
      default:
        return {
          label: "PERLU VERIFIKASI LANJUT",
          bgColor: "bg-[#F59E0B]/15",
          textColor: "text-[#F59E0B]",
          borderColor: "border-[#F59E0B]",
          icon: HelpCircle,
          barColor: "bg-[#F59E0B]",
          description: "Sumber rujukan belum cukup untuk menarik kesimpulan pasti atas klaim ini.",
        };
    }
  };

  const statusConfig = getStatusConfig(result.status);
  const StatusIcon = statusConfig.icon;

  const handleCopySummary = async () => {
    const textToCopy = `[HASIL SARING OPINI]\nStatus: ${result.status}\nKeyakinan: ${result.confidenceScore}%\n\nKlaim: ${result.query}\n\nAlasan: ${result.alasan}\n\nCek mandiri di: https://saringopini.id`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div 
      id="result-card" 
      ref={containerRef}
      tabIndex={-1}
      aria-label={`Hasil Verifikasi: ${result.status}`}
      className="w-full max-w-[960px] mx-auto my-8 rounded-3xl border-3 border-[#FFD12F] bg-[#1C1C1C] p-5 sm:p-8 md:p-10 shadow-2xl space-y-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 transition-all"
    >
      {/* 1. Status Section (Highest Visual Priority) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-[#27272A]">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase text-[#71717A] tracking-wider block">
            Kesimpulan Analisis Sistem
          </span>
          <div className={`status-badge-pop inline-flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-base sm:text-xl font-black uppercase tracking-wider ${statusConfig.bgColor} ${statusConfig.textColor} border-2 ${statusConfig.borderColor} shadow-lg`}>
            <StatusIcon className="h-6 w-6 stroke-[2.5] shrink-0" aria-hidden="true" />
            <span>{statusConfig.label}</span>
          </div>
          <p className="text-xs text-[#A1A1AA] pt-1 max-w-lg">
            {statusConfig.description}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleCopySummary}
            type="button"
            aria-label="Salin ringkasan ke clipboard"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#27272A] bg-[#141414] px-4 text-xs font-bold text-white hover:border-[#FFD12F] hover:text-[#FFD12F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 active:scale-[0.97] transition-all cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4 text-[#22C55E]" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Tersalin!" : "Salin Hasil"}</span>
          </button>
          <button
            onClick={onReset}
            type="button"
            aria-label="Lakukan verifikasi baru"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#27272A] bg-[#141414] px-4 text-xs font-bold text-[#A1A1AA] hover:text-white hover:border-[#A1A1AA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 active:scale-[0.97] transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Cek Lagi</span>
          </button>
        </div>
      </div>

      {/* 2. Confidence Score Gauge */}
      <div className="space-y-2.5 bg-[#141414] p-4 sm:p-5 rounded-2xl border border-[#27272A]">
        <div className="flex justify-between text-xs sm:text-sm font-bold uppercase tracking-wider">
          <span className="text-[#A1A1AA]">Tingkat Keyakinan Sistem</span>
          <span className={`${statusConfig.textColor} font-mono font-black text-sm sm:text-base`} aria-live="polite">
            {displayedScore}%
          </span>
        </div>
        <div className="h-3.5 w-full rounded-full bg-[#0D0D0D] overflow-hidden border border-[#27272A]">
          <div
            id="confidence-bar"
            className={`h-full rounded-full transition-all ${statusConfig.barColor}`}
            style={{ width: `${result.confidenceScore}%` }}
            role="progressbar"
            aria-valuenow={result.confidenceScore}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* 3. Original Claim Analyzed */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717A] flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Klaim yang Dianalisis:
        </h4>
        <div className="rounded-2xl border border-[#27272A] bg-[#141414] p-4 sm:p-5 text-sm sm:text-base text-white font-medium leading-relaxed break-words overflow-hidden">
          &ldquo;{result.query}&rdquo;
        </div>
      </div>

      {/* 4. Analytical Reasoning & Fact Points */}
      <div className="space-y-4">
        {/* AI Synthesis Narrative */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFD12F] flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Kesimpulan Analisis AI:
          </h4>
          <div className="rounded-2xl border border-[#27272A] bg-[#141414] p-5 text-sm sm:text-base leading-relaxed text-[#D4D4D8] break-words">
            <p className="leading-relaxed font-normal">{result.alasan}</p>
          </div>
        </div>

        {/* Factual Evidence & Counter-Points */}
        {result.ringkasanFakta && result.ringkasanFakta.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" aria-hidden="true" />
              {result.status === "HOAX" 
                ? "Poin Temuan Bantahan Resmi:" 
                : result.status === "FAKTA"
                ? "Poin Fakta Terkonfirmasi dari Sumber Resmi:"
                : "Poin Catatan Verifikasi:"}
            </h4>
            <div className="rounded-2xl border border-[#27272A] bg-[#0D0D0D] p-5 text-xs sm:text-sm text-[#D4D4D8]">
              <ul className="space-y-2.5">
                {result.ringkasanFakta.map((fakta, i) => (
                  <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="font-mono text-[#FFD12F] font-bold shrink-0 mt-0.5">{i + 1}.</span>
                    <span>{fakta}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {result.status === "TIDAK_DAPAT_DIPASTIKAN" && (!result.ringkasanFakta || result.ringkasanFakta.length === 0) && (
          <div className="rounded-2xl border border-[#27272A] bg-[#0D0D0D] p-4 text-xs text-[#A1A1AA] italic">
            Belum ditemukan data pembanding yang cukup kuat untuk mengonfirmasi atau membantah klaim ini secara definitif.
          </div>
        )}
      </div>

      {/* 5. Reference Sources */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#71717A]">
          Sumber Referensi & Pembanding Resmi ({result.sources.length}):
        </h4>
        {result.sources.length === 0 ? (
          <p className="text-xs text-[#71717A] italic bg-[#141414] p-4 rounded-xl border border-[#27272A]">
            Tidak ada sumber rujukan eksternal langsung yang ditemukan.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {result.sources.map((src, idx) => (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Buka sumber berita ${src.title} (${src.domain}) di tab baru`}
                className="flex items-start justify-between gap-3 rounded-2xl border border-[#27272A] bg-[#141414] p-4 hover:border-[#FFD12F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 active:scale-[0.98] transition-all group shadow-sm"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#FFD12F] uppercase block truncate font-mono">
                    {src.domain}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#FFE164] line-clamp-2 break-words leading-snug">
                    {src.title}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-[#71717A] group-hover:text-white shrink-0 mt-0.5" aria-hidden="true" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
