# Saring Opini

Platform verifikasi berita dan anti-hoax independen berbasis analisis multi-sumber AI.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![GSAP](https://img.shields.io/badge/GSAP-3.15-green?logo=greensock)](https://greensock.com/gsap/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Tentang Proyek

**Saring Opini** adalah aplikasi web publik yang dirancang untuk membantu masyarakat menyaring kebenaran informasi sebelum menyebarkannya. 

Di era percepatan informasi digital, pesan berantai WhatsApp dan tautan berita sensasional kerap memicu disinformasi sebelum sempat diklarifikasi. Saring Opini hadir untuk memangkas hambatan pengecekan fakta manual dengan menyediakan alur verifikasi otomatis yang membandingkan klaim pengguna terhadap laporan berita terakreditasi secara objektif, terbuka, dan transparan.

### Masalah yang Diselesaikan
- **Penyebaran Pesan Berantai Tanpa Sumber**: Membedah pesan forward atau broadcast WhatsApp untuk menemukan fakta yang sebenarnya.
- **Klaim Keliru Antar-Wilayah**: Mencegah salah tafsir antara peristiwa serupa di lokasi atau waktu yang berbeda melalui ekstraksi entitas presisi.
- **Kekhawatiran Privasi Pengguna**: Menjamin data pesan pribadi tidak tersimpan di database publik.

### Target Pengguna
- Masyarakat umum yang ingin memeriksa kebenaran pesan WhatsApp atau berita media sosial.
- Jurnalis, pendidik, dan pegiat literasi digital yang memerlukan rujukan cek fakta awal.
- Pengembang dan komunitas open source yang tertarik pada arsitektur verifikasi data berbasis AI dan SSE streaming.

---

## Fitur Utama

- **Verifikasi Tautan Berita (URL)**: Mengekstrak isi artikel langsung dan membandingkannya dengan portal berita terakreditasi lainnya.
- **Verifikasi Pesan Broadcast**: Menyaring narasi panjang pesan chat menjadi kueri pencarian netral untuk menelusuri fakta lapangan.
- **Verifikasi Multi-Sumber (Multi-Source Cross-Check)**: Mencocokkan klaim terhadap portal berita terdaftar resmi di Dewan Pers (Kompas, Detik, Tempo, Antara, CNN Indonesia, TurnBackHoax, dsb.).
- **Analisis AI Objektif**: Mengevaluasi kesesuaian lokasi, instansi, tanggal peristiwa, dan membantah disinformasi manipulatif.
- **Tingkat Keyakinan (Confidence Score)**: Menghitung persentase keyakinan sistem (0–100%) secara proporsional terhadap kualitas dan kesepakatan sumber.
- **Transparansi Sumber Rujukan**: Menyertakan tautan langsung ke artikel berita asli sebagai bahan verifikasi mandiri.
- **Progres Real-Time (SSE Pipeline)**: Menampilkan 6 tahapan analisis riil tanpa timer simulasi palsu melalui protokol Server-Sent Events.
- **Arsitektur Stateless & Ramah Privasi**: Pesan diproses di memori server saat analisis berlangsung dan langsung dibuang setelah selesai.

---

## Cara Kerja

Saring Opini menggunakan pipeline multi-tahap independen:

```
[ User Input ]
 (URL / Pesan Teks)
        │
        ▼
[ 1. Query & Entity Extraction ] ── (OpenRouter AI)
 Mengekstrak subjek, lokasi spesifik, tanggal, dan kueri netral
        │
        ▼
[ 2. News Retrieval ] ───────────── (Tavily Search API)
 Menelusuri portal berita resmi Dewan Pers & media cek fakta
        │
        ▼
[ 3. Clean Content Scraping ] ───── (Jina Reader API)
 Mengambil teks artikel pembanding bersih berformat Markdown
        │
        ▼
[ 4. Relevance Scoring & Filter ] ── (Same-Event Algorithm)
 Menyaring kecocokan lokasi geografis & entitas spesifik (skor >= 60)
        │
        ▼
[ 5. Fact Decision Synthesis ] ──── (OpenRouter AI)
 Membedah bukti, menghasilkan kesimpulan, dan merangkum poin fakta
        │
        ▼
[ Verdict & Evidence Card ]
 (FAKTA / HOAX / PERLU VERIFIKASI + Skor Keyakinan + Tautan Sumber)
```

---

## Teknologi yang Digunakan

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Neo-Brutalism Dark Palette: `#0D0D0D`, `#141414`, `#FFD12F`)
- **Komponen & Ikon**: [Lucide React](https://lucide.dev/), Tailwind Variants
- **Animasi**: [GSAP 3](https://greensock.com/gsap/) (Transisi mikro, interpolasi skor numerik, dan smooth scrolling)

### Backend & API
- **Route Handlers**: Next.js Node.js Runtime
- **Streaming**: Server-Sent Events (SSE) via `ReadableStream`
- **Validasi Data**: [Zod](https://zod.dev/)

### AI & Retrieval
- **LLM Gateway**: [OpenRouter](https://openrouter.ai/) (Gemini 2.5 Flash / Llama 3.3 70B)
- **Search Engine**: [Tavily Search API](https://tavily.com/)
- **Web Reader**: [Jina Reader API](https://jina.ai/)

---

## Arsitektur & Filosofi Desain

1. **Stateless (Zero Database)**: Tidak ada database penyimpanan pesan pengguna. Privasi terjaga penuh.
2. **Mobile First & Touch Target**: Seluruh tombol dan kontrol interaktif memenuhi standar aksesibilitas minimum touch target $\ge 44\text{px}$.
3. **Aksesibilitas (WCAG 2.1 AA)**: Kontras warna tinggi ($\ge 4.5:1$), navigasi keyboard lengkap dengan `:focus-visible`, semantik ARIA region, dan dukungan `prefers-reduced-motion`.
4. **Single Source of Truth**: Alur verifikasi dipusatkan pada satu endpoint streaming di `/api/verify/stream`.
5. **Pencocokan Peristiwa Sama (Same-Event Corroboration)**: Menolak pencampuran berita beda daerah meskipun memiliki topik kata kunci yang mirip.

---

## Instalasi Lokal

Pastikan Anda telah memasang **Node.js 20+** di komputer Anda.

1. **Clone repositori:**
   ```bash
   git clone https://github.com/username/saring-opini.git
   cd saring-opini
   ```

2. **Pasang dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Isi kunci API yang diperlukan (lihat bagian [Environment Variables](#environment-variables)).

4. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```
   Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Konfigurasi lingkungan didefinisikan pada `.env`:

```env
# OpenRouter API Key (LLM Gateway)
# Dapatkan di: https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key-here

# OpenRouter Model (Rekomendasi: google/gemini-2.5-flash)
OPENROUTER_MODEL=...........

# Tavily Search API Key (Search Engine Berita)
# Dapatkan di: https://tavily.com
TAVILY_API_KEY=tvly-your-tavily-api-key-here

# Jina Reader API Key (Scraping Konten Bersih)
# Dapatkan di: https://jina.ai
JINA_API_KEY=jina_your-api-key-here
```

### Penjelasan Variabel:
- `OPENROUTER_API_KEY`: Kunci otentikasi untuk pemrosesan ekstraksi entitas dan sintesis analisis fakta.
- `OPENROUTER_MODEL`: Identifier model LLM yang digunakan untuk inferensi JSON terstruktur.
- `TAVILY_API_KEY`: Kunci penelusuran artikel berita pembanding ke domain pers terverifikasi.
- `JINA_API_KEY`: Kunci pengambil konten artikel bebas iklan dan format markdown bersih.

---

## Menjalankan Test

Proyek dilengkapi dengan suite pengujian skema validasi Zod:

```bash
npx tsx lib/__tests__/schemas.test.ts
```

---

## Build Production

Untuk menguji dan menjalankan build produksi lokal:

```bash
# Kompilasi aplikasi Next.js (Turbopack)
npm run build

# Menjalankan server produksi
npm run start
```

---

## Struktur Folder

```
saring-opini/
├── app/
│   ├── api/
│   │   └── verify/
│   │       └── stream/
│   │           └── route.ts         # Endpoint SSE Streaming verifikasi
│   ├── favicon.ico
│   ├── global-error.tsx             # Error boundary global
│   ├── globals.css                  # Token CSS, styling fokus, & neo-brutalisme
│   ├── layout.tsx                   # Root layout & konfigurasi metadata SEO
│   ├── not-found.tsx                # Halaman 404
│   ├── page.tsx                     # Halaman utama & orkestrasi state klien
│   ├── robots.ts                    # Generator robots.txt SEO
│   └── sitemap.ts                   # Generator sitemap.xml SEO
├── components/
│   ├── layout/
│   │   ├── Footer.tsx               # Footer & informasi kebijakan
│   │   └── Navbar.tsx               # Navigasi sticky & drawer mobile
│   ├── sections/
│   │   ├── FAQSection.tsx           # Accordion FAQ dengan semantik ARIA
│   │   ├── HeroSection.tsx          # Hero seksi & badge arsitektur
│   │   └── HowItWorksSection.tsx    # Diagram alur pipeline forensik
│   └── verification/
│       ├── LoadingState.tsx         # Indikator progres riil 6-tahap
│       ├── ResultCard.tsx           # Kartu kesimpulan fakta & sumber
│       └── VerificationForm.tsx     # Form input teks/URL & preset kasus
├── lib/
│   ├── __tests__/
│   │   └── schemas.test.ts          # Pengujian unit skema Zod
│   ├── env.ts                       # Validasi variabel lingkungan saat runtime
│   ├── gsap.ts                      # Utilitas animasi GSAP & smooth scroll
│   ├── jina.ts                      # Klien API ekstraksi artikel Jina Reader
│   ├── openrouter.ts                # Klien API penalaran fakta OpenRouter
│   ├── schemas.ts                   # Skema validasi kontrak Zod
│   ├── tavily.ts                    # Klien API penelusuran berita Tavily
│   └── utils.ts                     # Utilitas kelas tailwind & ekstraksi domain
├── types/
│   └── verification.ts              # Definisi tipe TypeScript
├── .env.example
├── AGENTS.md
├── DESIGN.md
├── PRD.md
├── README.md
└── TASKS.md
```

---

## Screenshot

<!-- Tambahkan screenshot di sini -->
![Saring Opini Preview](https://placehold.co/1200x630/0D0D0D/FFD12F?text=Saring+Opini+Interface+Preview)

---

## Roadmap Pengembangan

### MVP (Selesai)
- [x] Inisialisasi Next.js 16 App Router & tema Neo-Brutalisme.
- [x] Input ganda: Tautan berita (URL) dan pesan broadcast WhatsApp.
- [x] Ekstraksi entitas kejadian spesifik (lokasi, instansi, tanggal peristiwa).
- [x] Penilaian relevansi sumber (*relevance scoring*) untuk mencegah *cross-incident noise*.
- [x] Protokol Server-Sent Events (SSE) untuk pelacakan progres real-time.
- [x] Kartu hasil terstruktur (Lencana Status, Skor Keyakinan, Analisis AI, Poin Fakta, dan Tautan Sumber).
- [x] Optimasi latensi jaringan (timeout 13s/7.5s, *fast fallback* snippet).
- [x] Aksesibilitas WCAG 2.1 AA (manajemen fokus keyboard & relasi ARIA accordion).

### Rencana Fitur Berikutnya
- [ ] Tombol pintasan langsung *Bagikan Hasil ke WhatsApp*.
- [ ] Penyempurnaan algoritma pemeringkatan kredibilitas portal berita.
- [ ] Optimasi caching in-memory berbasis TTL untuk klaim viral yang sering dicek berulang.
- [ ] Visualisasi kartu kutipan sitasi yang lebih interaktif.

---

## Panduan Kontribusi

Kontribusi dari komunitas sangat diterima!

1. Fork repositori ini.
2. Buat branch fitur baru (`git checkout -b fitur/nama-fitur`).
3. Lakukan commit perubahan Anda (`git commit -m 'Menambahkan fitur XYZ'`).
4. Pastikan build dan test berhasil (`npm run build` dan `npx tsx lib/__tests__/schemas.test.ts`).
5. Push branch Anda (`git push origin fitur/nama-fitur`).
6. Buka **Pull Request**.

---

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

## Catatan Penting & Batasan Sistem

> [!NOTE]
> 1. **Bukan Kebenaran Mutlak**: Sistem Saring Opini memanfaatkan model AI untuk membandingkan narasi terhadap laporan berita resmi yang tersedia di internet. Hasil analisis ditujukan sebagai **referensi awal**, bukan vonis hukum mutlak.
> 2. **Peristiwa yang Baru Terjadi (*Breaking News*)**: Klaim mengenai peristiwa yang baru terjadi dalam hitungan menit mungkin belum memiliki laporan resmi di portal berita sehingga akan berstatus `PERLU VERIFIKASI LANJUT`.
> 3. **Verifikasi Mandiri**: Pengguna tetap disarankan untuk meninjau tautan sumber rujukan asli yang disediakan di kartu hasil verifikasi.
