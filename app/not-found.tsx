import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0D0D] px-4 text-center">
      <div className="max-w-md space-y-6 rounded-3xl border-3 border-[#FFD12F] bg-[#141414] p-8 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFD12F] text-[#0D0D0D]">
          <ShieldAlert className="h-8 w-8 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-sm font-bold uppercase text-[#FFD12F]">
            Error 404
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm text-[#A1A1AA]">
            Halaman yang Anda tuju tidak tersedia atau tautan telah kedaluwarsa.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#FFD12F] px-6 text-sm font-extrabold uppercase tracking-wider text-[#0D0D0D] hover:bg-[#FFE164] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
