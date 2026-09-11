"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error securely
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#0D0D0D] px-4 font-sans text-white">
        <div className="max-w-md space-y-6 rounded-3xl border-3 border-[#EF4444] bg-[#141414] p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
            <AlertTriangle className="h-8 w-8 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-sm font-bold uppercase text-[#EF4444]">
              Kendala Sistem Terdeteksi
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Terjadi Kesalahan Tidak Terduga
            </h1>
            <p className="text-sm text-[#A1A1AA]">
              Aplikasi mengalami gangguan sementara. Silakan coba muat ulang halaman atau ulangi beberapa saat lagi.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#FFD12F] px-6 text-sm font-extrabold uppercase tracking-wider text-[#0D0D0D] hover:bg-[#FFE164] transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            Muat Ulang Halaman
          </button>
        </div>
      </body>
    </html>
  );
}
