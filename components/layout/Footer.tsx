"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { smoothScrollToSection } from "@/lib/gsap";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    e.preventDefault();
    smoothScrollToSection(`#${targetId}`);
  };

  return (
    <footer className="w-full border-t border-[#27272A] bg-[#141414] py-12 text-[#A1A1AA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#FFD12F] text-[#0D0D0D]">
                <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                SARING<span className="text-[#FFD12F]">OPINI</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#71717A]">
              Platform verifikasi berita dan anti-hoax independen berbasis analisis multi-sumber AI. Membantu masyarakat menyaring informasi sebelum disebarkan.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Navigasi Cepat
            </h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <a
                  href="#tool"
                  onClick={(e) => handleScroll(e, "tool")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Alat Verifikasi
                </a>
              </li>
              <li>
                <a
                  href="#cara-kerja"
                  onClick={(e) => handleScroll(e, "cara-kerja")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Cara Kerja & Sumber Data
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => handleScroll(e, "faq")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Pertanyaan Sering Diajukan
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Prinsip & Transparansi
            </h3>
            <p className="text-xs leading-relaxed text-[#71717A]">
              Saring Opini tidak menyimpan teks broadcast pribadi dan membandingkan setiap klaim terhadap portal berita resmi yang terdaftar di Dewan Pers.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-[#27272A] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#71717A]">
          <p>© {currentYear} Saring Opini. Verifikasi Fakta Berbasis AI.</p>
          <div className="mt-2 sm:mt-0 flex gap-4">
            <Link href="/" className="hover:text-white">Privasi</Link>
            <Link href="/" className="hover:text-white">Ketentuan Layanan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
