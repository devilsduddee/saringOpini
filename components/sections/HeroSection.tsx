"use client";

import React from "react";
import { ArrowDown, Search, ShieldCheck, Database, CheckCircle, Globe2 } from "lucide-react";
import { smoothScrollToSection } from "@/lib/gsap";

export function HeroSection() {
  return (
    <section id="hero-section" className="relative overflow-hidden pt-6 pb-6 md:pt-8 md:pb-8 border-b border-[#27272A]/40 bg-[#0D0D0D]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Left Column: Bold Headline & Copy */}
          <div className="lg:col-span-7 space-y-5 hero-content">
            <h1 className="hero-headline text-white drop-shadow-sm">
              Cek Dulu. <br />
              Baru <span className="text-[#FFD12F] underline decoration-4 underline-offset-8">Sebarkan.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#D4D4D8] max-w-xl leading-relaxed font-normal">
              Verifikasi kebenaran link berita atau pesan broadcast WhatsApp secara instan dengan analisis perbandingan multi-sumber AI tepercaya.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => smoothScrollToSection("#tool")}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#FFD12F] px-6 text-sm font-black uppercase tracking-wider text-[#0D0D0D] hover:bg-[#FFE164] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 shadow-lg cursor-pointer transition-all"
              >
                <Search className="h-4 w-4 stroke-[3]" />
                <span>Periksa Sekarang</span>
              </button>
              <button
                type="button"
                onClick={() => smoothScrollToSection("#cara-kerja")}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#27272A] bg-[#141414] px-5 text-sm font-bold text-white hover:border-[#A1A1AA] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 cursor-pointer transition-all"
              >
                <span>Lihat Cara Kerja</span>
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>

            {/* Compact Editorial Trust Bar */}
            <div className="pt-2">
              <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-[#27272A] bg-[#141414] px-3.5 py-2 text-xs font-semibold text-[#A1A1AA]">
                <span className="flex items-center gap-1.5 text-white font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FFD12F]" aria-hidden="true" />
                  Stateless
                </span>
                <span className="text-[#3F3F46]">•</span>
                <span className="flex items-center gap-1.5 text-white font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" aria-hidden="true" />
                  Zero Database
                </span>
                <span className="text-[#3F3F46]">•</span>
                <span className="text-[#D4D4D8]">
                  Media Resmi Dewan Pers
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: High-conviction Architecture Value Card */}
          <div className="lg:col-span-5 hero-visual">
            <div className="rounded-2xl border-2 border-[#27272A] bg-[#141414] p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#FFD12F]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Standar Verifikasi Saring Opini
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#D4D4D8]">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0D0D0D] border border-[#27272A]">
                  <Globe2 className="h-4 w-4 text-[#FFD12F] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white mb-0.5">Penelusuran Multi-Portal</strong>
                    Klaim diverifikasi silang terhadap portal berita resmi yang terdaftar di Dewan Pers.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0D0D0D] border border-[#27272A]">
                  <Database className="h-4 w-4 text-[#FFD12F] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white mb-0.5">Arsitektur Stateless</strong>
                    Pesan Anda diproses di memori server dan langsung dibuang setelah analisis selesai.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0D0D0D] border border-[#27272A]">
                  <CheckCircle className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white mb-0.5">Bukti Terbuka & Transparan</strong>
                    Setiap kesimpulan menyertakan tautan rujukan artikel pembanding asli.
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
