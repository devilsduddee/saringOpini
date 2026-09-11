"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Menu, X, Search, ArrowRight } from "lucide-react";
import { smoothScrollToSection } from "@/lib/gsap";

const NAV_ITEMS = [
  { id: "cara-kerja", label: "Cara Kerja" },
  { id: "faq", label: "FAQ" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  // Smooth scroll click handler
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    e.preventDefault();
    closeMenu();
    smoothScrollToSection(`#${targetId}`);
  };

  // Observe active section based on scroll position
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sections = ["tool", "cara-kerja", "faq"];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140; // sticky header + buffer

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sections[i]);
            return;
          }
        }
      }
      setActiveSection("");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#27272A] bg-[#0D0D0D] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo / Brand */}
          <Link 
            href="/" 
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                closeMenu();
                smoothScrollToSection("body");
              }
            }}
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 rounded-lg p-1"
            aria-label="Saring Opini Beranda"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFD12F] text-[#0D0D0D]">
              <ShieldCheck className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              SARING<span className="text-[#FFD12F]">OPINI</span>
            </span>
          </Link>

          {/* Desktop / Tablet Navigation (Hidden on Mobile < 768px) */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Navigasi Utama">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`relative text-sm font-semibold transition-all px-3 py-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 ${
                    isActive
                      ? "text-[#FFD12F] bg-[#FFD12F]/10 font-bold"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1C]"
                  }`}
                  aria-current={isActive ? "true" : undefined}
                >
                  {item.label}
                  {isActive && (
                    <span 
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#FFD12F] rounded-full" 
                      aria-hidden="true"
                    />
                  )}
                </a>
              );
            })}

            <div className="ml-3">
              <a
                href="#tool"
                onClick={(e) => handleNavClick(e, "tool")}
                className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#FFD12F] px-4 text-xs font-black uppercase tracking-wider text-[#0D0D0D] hover:bg-[#FFE164] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 transition-all shadow-sm cursor-pointer"
              >
                Periksa Cepat
              </a>
            </div>
          </nav>

          {/* Mobile Hamburger Button (Visible only on < 768px) */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={toggleMenu}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              aria-label={isOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#27272A] bg-[#141414] text-white hover:border-[#FFD12F] hover:text-[#FFD12F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD12F]/70 active:scale-[0.97] transition-all cursor-pointer"
            >
              {isOpen ? <X className="h-6 w-6 stroke-[2.5]" /> : <Menu className="h-6 w-6 stroke-[2.5]" />}
            </button>
          </div>

        </div>
      </header>

      {/* Pure Fixed Overlay Drawer on Root Level (Independent of Header Flow) */}
      {isOpen && (
        <div
          id="mobile-navigation"
          className="fixed inset-x-0 top-16 bottom-0 z-50 bg-[#0D0D0D] border-t border-[#27272A] px-5 py-6 md:hidden overflow-y-auto flex flex-col justify-between animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="flex flex-col space-y-3.5 w-full max-w-sm mx-auto">
            <a
              href="#cara-kerja"
              onClick={(e) => handleNavClick(e, "cara-kerja")}
              className={`flex items-center justify-between rounded-2xl border p-4 text-base font-bold transition-all ${
                activeSection === "cara-kerja"
                  ? "border-[#FFD12F] bg-[#FFD12F]/10 text-[#FFD12F]"
                  : "border-[#27272A] bg-[#141414] text-white hover:border-[#FFD12F] hover:text-[#FFD12F]"
              }`}
            >
              <span>Cara Kerja & Sumber</span>
              <ArrowRight className="h-4 w-4 text-[#71717A]" />
            </a>

            <a
              href="#faq"
              onClick={(e) => handleNavClick(e, "faq")}
              className={`flex items-center justify-between rounded-2xl border p-4 text-base font-bold transition-all ${
                activeSection === "faq"
                  ? "border-[#FFD12F] bg-[#FFD12F]/10 text-[#FFD12F]"
                  : "border-[#27272A] bg-[#141414] text-white hover:border-[#FFD12F] hover:text-[#FFD12F]"
              }`}
            >
              <span>Pertanyaan Umum (FAQ)</span>
              <ArrowRight className="h-4 w-4 text-[#71717A]" />
            </a>

            {/* Primary CTA in Mobile Menu */}
            <div className="pt-4 border-t border-[#27272A]">
              <a
                href="#tool"
                onClick={(e) => handleNavClick(e, "tool")}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#FFD12F] px-6 text-sm font-black uppercase tracking-wider text-[#0D0D0D] hover:bg-[#FFE164] active:scale-[0.97] transition-all shadow-lg cursor-pointer"
              >
                <Search className="h-4 w-4 stroke-[3]" />
                <span>Mulai Cek Fakta Sekarang</span>
              </a>
            </div>
          </div>

          <div className="pt-8 pb-4 text-center text-xs text-[#71717A]">
            Saring Opini • Platform Verifikasi Berita & Anti-Hoax
          </div>
        </div>
      )}
    </>
  );
}

