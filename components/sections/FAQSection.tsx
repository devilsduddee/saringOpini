"use client";

import React, { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { animateFaqAccordion } from "@/lib/gsap";

interface FAQItem {
  id: string;
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    id: "faq-privacy",
    q: "Apakah pesan atau tautan yang saya masukkan disimpan di database?",
    a: "Tidak sama sekali. Saring Opini dirancang dengan arsitektur Stateless SPA (tanpa database). Teks atau tautan yang Anda masukkan hanya diproses secara real-time di memori server untuk perbandingan fakta dan langsung dibuang setelah analisis selesai.",
  },
  {
    id: "faq-method",
    q: "Bagaimana cara sistem menentukan suatu informasi adalah Fakta atau Hoax?",
    a: "Sistem mengekstrak klaim inti dari input pengguna, lalu mencari artikel rujukan pembanding dari portal berita terpercaya yang terdaftar resmi di Dewan Pers. AI menganalisis kesesuaian antara narasi klaim dan laporan faktual dari sumber-sumber tersebut.",
  },
  {
    id: "faq-uncertainty",
    q: "Mengapa ada kesimpulan 'Perlu Verifikasi Lanjut'?",
    a: "Status ini diberikan ketika sumber berita resmi belum memuat konfirmasi yang cukup, atau peristiwa baru saja terjadi sehingga fakta di lapangan masih berkembang (breaking news).",
  },
  {
    id: "faq-free",
    q: "Apakah platform ini gratis untuk digunakan?",
    a: "Ya, Saring Opini sepenuhnya gratis untuk membantu meningkatkan literasi digital dan menekan laju penyebaran hoaks di masyarakat.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toggle = (index: number) => {
    if (openIndex === index) {
      if (contentRefs.current[index]) {
        animateFaqAccordion(contentRefs.current[index], false, () => {
          setOpenIndex(null);
        });
      } else {
        setOpenIndex(null);
      }
    } else {
      if (openIndex !== null && contentRefs.current[openIndex]) {
        animateFaqAccordion(contentRefs.current[openIndex], false);
      }
      setOpenIndex(index);
      setTimeout(() => {
        if (contentRefs.current[index]) {
          animateFaqAccordion(contentRefs.current[index], true);
        }
      }, 10);
    }
  };

  return (
    <section id="faq" className="py-16 md:py-24 border-t border-[#27272A] bg-[#141414] scroll-mt-16">
      <div className="mx-auto max-w-[960px] px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="section-headline text-white">
            Pertanyaan Sering Diajukan
          </h2>
          <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed">
            Jawaban lengkap seputar cara kerja, privasi data, dan keandalan sistem Saring Opini.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const panelId = `faq-panel-${faq.id}`;
            const buttonId = `faq-button-${faq.id}`;

            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-[#27272A] bg-[#0D0D0D] overflow-hidden transition-all shadow-sm"
              >
                <button
                  id={buttonId}
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left text-sm sm:text-base font-bold text-white hover:text-[#FFD12F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-[#71717A] shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#FFD12F]" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div 
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    ref={(el) => {
                      contentRefs.current[idx] = el;
                    }}
                    className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm leading-relaxed text-[#A1A1AA] border-t border-[#27272A]/50 pt-4 overflow-hidden"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
