import React from "react";
import { Search, Globe2, Cpu, CheckCircle2, ArrowRight } from "lucide-react";

const PIPELINE_STAGES = [
  {
    step: "01",
    tag: "Ingestion",
    title: "Input Klaim & Ekstraksi",
    desc: "Mengekstrak entitas utama (lokasi, tanggal, tokoh, institusi) dari broadcast WhatsApp atau tautan berita.",
    icon: Search,
  },
  {
    step: "02",
    tag: "Retrieval",
    title: "Pencarian Multi-Portal",
    desc: "Melakukan penelusuran fakta terarah ke portal berita arus utama yang terverifikasi Dewan Pers.",
    icon: Globe2,
  },
  {
    step: "03",
    tag: "Cross-Check",
    title: "Analisis Bukti Kritis",
    desc: "Membedah kesesuaian fakta, membantah disinformasi manipulatif, dan menguji tanggal & konteks peristiwa.",
    icon: Cpu,
  },
  {
    step: "04",
    tag: "Verdict",
    title: "Putusan & Sumber Terbuka",
    desc: "Menghasilkan label status objektif (Fakta/Hoax/Perlu Verifikasi) lengkap dengan tautan bukti pembanding asli.",
    icon: CheckCircle2,
  },
];

export function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="py-16 md:py-20 border-t border-[#27272A] bg-[#0D0D0D] scroll-mt-16">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
          <h2 className="section-headline text-white">
            Alur Kerja Verifikasi Saring Opini
          </h2>
          <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed">
            Arsitektur penelusuran multi-sumber independen tanpa database untuk menjamin kesimpulan objektif dan privasi data mutlak.
          </p>
        </div>

        {/* Forensic Pipeline Schematic */}
        <div className="relative">
          {/* Connecting Track Line for Desktop Viewports */}
          <div className="hidden lg:block absolute top-[28px] left-[60px] right-[60px] h-[2px] bg-gradient-to-r from-[#27272A] via-[#FFD12F]/40 to-[#27272A] z-0" aria-hidden="true" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {PIPELINE_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isLast = idx === PIPELINE_STAGES.length - 1;

              return (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-2xl border border-[#27272A] bg-[#141414] p-5 sm:p-6 hover:border-[#FFD12F]/80 transition-all group shadow-sm relative space-y-4"
                >
                  <div className="space-y-4">
                    {/* Header: Step Number, Pin Badge & Icon */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0D0D0D] border border-[#27272A] text-xs font-mono font-bold text-[#FFD12F]">
                          {stage.step}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] bg-[#1C1C1C] px-2 py-0.5 rounded-md border border-[#27272A]">
                          {stage.tag}
                        </span>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1C1C1C] border border-[#27272A] text-white group-hover:bg-[#FFD12F] group-hover:text-[#0D0D0D] group-hover:border-[#FFD12F] transition-all">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {stage.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                        {stage.desc}
                      </p>
                    </div>
                  </div>

                  {/* Flow Arrow Indicator */}
                  <div className="pt-2 border-t border-[#27272A]/50 flex items-center justify-between text-xs text-[#71717A]">
                    <span className="font-mono text-[11px]">Tahap {idx + 1} dari 4</span>
                    {!isLast && (
                      <span className="hidden lg:flex items-center gap-1 text-[#FFD12F] font-bold text-xs">
                        <span>Lanjut</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {isLast && (
                      <span className="flex items-center gap-1 text-[#22C55E] font-bold text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Selesai</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
