# TASKS.md — Log & Dokumentasi Proyek Saring Opini

Dokumen log teknis, pelacakan fase pengerjaan, histori audit, dan keputusan arsitektur proyek Saring Opini.

---

## Ringkasan Proyek

Status saat ini:
- **MVP**: ✅ Selesai Penuh (100%)
- **Build Status**: ✅ Passing (`npm run build` Turbopack 0 errors)
- **Deployment Status**: ✅ Production Ready
- **Versi**: 1.0.0

---

## Progress Fase

### Fase 1 — Fondasi Proyek & Sistem Desain
Status: ✅ Selesai

Ringkasan:
Menginisialisasi fondasi monorepo Next.js 16 App Router, TypeScript strict mode, skema validasi Zod untuk kontrak data verifikasi, dan variabel tema gelap Neo-Brutalisme (`#0D0D0D`, `#141414`, `#FFD12F`).

Tugas:
- [x] Inisialisasi Next.js 16 (Turbopack), React 19, TypeScript strict mode, ESLint, dan PostCSS (`package.json`, `tsconfig.json`)
- [x] Konfigurasi token tema Neo-Brutalisme, utilitas `.neo-border`, `.neo-shadow`, dan font Inter (`app/globals.css`, `app/layout.tsx`, `lib/utils.ts`)
- [x] Definisi tipe data TypeScript dan skema validasi Zod `verificationInputSchema` serta `verificationResultSchema` (`types/verification.ts`, `lib/schemas.ts`)

Verifikasi:
- `npx tsc --noEmit` ✅
- Skema Zod & variabel CSS ter-render dengan rapi ✅

---

### Fase 2 — UI & Layout
Status: ✅ Selesai

Ringkasan:
Membangun seluruh antarmuka pengguna berbasis komponen modular: Navbar sticky brutalis, Hero Section dengan metrik terpercaya, formulir verifikasi dinamis dengan chip preset kasus nyata, indikator progres, kartu hasil verifikasi kontras tinggi, seksi Cara Kerja, dan FAQ accordion.

Perubahan Utama:
- Formulir input responsif dengan chip preset interaktif kasus nyata.
- Kartu hasil verifikasi dengan lencana status (**FAKTA**, **HOAX**, **PERLU VERIFIKASI**), skor keyakinan proporsional, narasi analisis, dan tautan rujukan artikel pers.
- Seksi edukasi alur transparansi sistem dan FAQ accordion aksesibel.

Verifikasi:
- Responsif penuh pada resolusi 320px – 1440px+ tanpa pergeseran tata letak ✅
- Tervalidasi pada desktop, tablet, dan mobile viewport ✅

---

### Fase 3 — Integrasi AI & Retrieval
Status: ✅ Selesai

Ringkasan:
Membangun pipeline penelusuran fakta otomatis: validasi environment runtime via Zod, ekstraksi kueri netral dan entitas via OpenRouter AI, pencarian artikel terakreditasi Dewan Pers via Tavily, ekstraksi konten bersih artikel via Jina Reader, serta penalaran kesimpulan akhir via OpenRouter dengan output JSON terstruktur.

Arsitektur:
```
User Input ──▶ OpenRouter (Ekstraksi Entitas) ──▶ Tavily Search (Media Dewan Pers)
                                                         │
Result Card ◀── OpenRouter (Sintesis Bukti) ◀── Jina Reader (Scraping Markdown)
```

Tugas:
- [x] Validator environment runtime `lib/env.ts` dan template `.env.example`
- [x] Klien OpenRouter untuk ekstraksi kueri dan sintesis kesimpulan JSON `lib/openrouter.ts`
- [x] Klien penelusuran berita Tavily dengan pembatasan domain Dewan Pers `lib/tavily.ts`
- [x] Klien ekstraksi konten bersih Jina Reader `lib/jina.ts`
- [x] Rute streaming Server-Sent Events (SSE) `/api/verify/stream/route.ts`

Verifikasi:
- Uji alur 12/12 skenario kasus nyata lulus ✅
- Suite pengujian unit `npx tsx lib/__tests__/schemas.test.ts` (5/5 tes lulus) ✅

---

### Fase 4 — Motion, UX & Accessibility
Status: ✅ Selesai

Ringkasan:
Menyelaraskan seluruh mikro-interaksi menggunakan GSAP 3 dengan kurva `power2.out` dan `power3.out`. Menerapkan standar aksesibilitas WCAG 2.1 AA, manajemen fokus keyboard (`:focus-visible`), penghitung skor keyakinan dinamis, dan fallback penuh untuk pengguna dengan `prefers-reduced-motion`.

Tugas:
- [x] Animasi kemunculan Hero dan Result Card dengan GSAP 3 (`lib/gsap.ts`)
- [x] Dukungan `prefers-reduced-motion` dan pembersihan inline style `clearProps: "all"`
- [x] Audit pencegahan horizontal scroll dan pemenuhan target sentuh $\ge 44\text{px}$
- [x] Penambahan semantik ARIA (`role="progressbar"`, `aria-live="polite"`, `role="alert"`)
- [x] Umpan balik fisik chip preset dan transisi halus penekanan tombol

Verifikasi:
- Animasi stabil 60fps tanpa layout shift ✅
- Navigasi penuh keyboard (Tab/Shift+Tab/Enter/Space) lulus uji aksesibilitas ✅

---

### Fase 5 — Production Readiness
Status: ✅ Selesai

Ringkasan:
Menuntaskan persiapan rilis produksi mencakup optimasi metadata SEO lengkap, OpenGraph, generator `robots.txt` & `sitemap.xml`, penanganan rute 404 neo-brutalis, batas penanganan error global (`global-error.tsx`), dan pesan kesalahan ramah pengguna berbahasa Indonesia.

Tugas:
- [x] Konfigurasi metadata SEO, OpenGraph, Twitter card, dan favicon SVG (`app/layout.tsx`, `public/icon.svg`)
- [x] Generator rute dinamis `app/robots.ts` dan `app/sitemap.ts`
- [x] Halaman kustom `app/not-found.tsx` dan batas error `app/global-error.tsx`
- [x] Pesan error informatif untuk kondisi timeout, rate-limit, dan kueri tidak ditemukan
- [x] Pembuatan dokumentasi profesional `README.md` siap publikasi GitHub

Verifikasi:
- `npm run build` kompilasi statis & rute dinamis berhasil tanpa peringatan ✅
- Pengujian unit `npx tsx lib/__tests__/schemas.test.ts` 5/5 lulus ✅

---

## Audit yang Sudah Dilakukan

### Anti-Slop & Code Quality Audit
Temuan:
- Ditemukan kode mati `actions/verify.ts` (382 baris duplikat) dan folder sisa `temp-app/`.
- Komentar naratif bernomor yang berlebihan (*comment slop*) di berbagai modul lib.
- Duplikasi helper ekstraksi hostname URL dan array domain geografis.
- Kartu tiruan di Hero dan badge kapsul berulang yang memberi kesan artifisial.

Perbaikan:
- Menghapus `actions/verify.ts`, folder `actions/`, dan `temp-app/`.
- Membersihkan seluruh komentar slop dan memusatkan helper ke `lib/utils.ts` (`extractDomain`).
- Mengganti kartu tiruan Hero dengan kartu arsitektur verifikasi nyata Saring Opini.

Status:
✅ Selesai (Pipeline terpusat 100% pada `/api/verify/stream`)

---

### Emil Design & Motion Audit
Temuan:
- Durasi transisi awal terasa lambat pada koneksi standar.
- Accordion FAQ sempat mengalami hentakan tata letak saat dibuka/ditutup.
- Belum ada transisi perpindahan antar-seksi halaman yang elegan.

Perbaikan:
- Mengatur durasi masuk Hero menjadi 0.45s dengan stagger 0.05s (`power2.out`).
- Mengimplementasikan `smoothScrollToSection` GSAP dengan kompensasi offset header sticky.
- Menambahkan animasi accordion FAQ yang mulus (`animateFaqAccordion`, 0.28s).
- Mengintegrasikan interpolasi angka skor keyakinan beranimasi sinkron dengan progress bar.

Status:
✅ Selesai (Seluruh gerakan fungsional, subtle, dan berkecepatan tinggi)

---

### Design Taste & Visual Hierarchy Audit
Temuan:
- Tautan navigasi "Verifikasi" dan tombol CTA "Periksa Cepat" redundan mengarah ke seksi yang sama.
- Jarak vertikal antara Hero dan kotak input verifikasi terlalu lebar pada layar laptop 1366x768.
- Seksi Cara Kerja terasa seperti kartu generik tanpa identitas investigasi fakta.

Perbaikan:
- Menghapus link "Verifikasi" redundan di Navbar; mempertahankan navigasi bersih (*Cara Kerja*, *FAQ*, *Periksa Cepat*).
- Merapatkan jarak vertikal Hero sehingga alat utama langsung terlihat pada viewport awal.
- Mendesain ulang seksi Cara Kerja menjadi skematik pipeline investigasi forensik terhubung.
- Memisahkan narasi sintesis AI dan kartu bukti fakta ke dalam kompartemen tersendiri.

Status:
✅ Selesai (Layout berorientasi perkakas langsung / *tool-first*)

---

### Performance & Latency Audit
Temuan:
- Waktu eksekusi pipeline dalam skenario terburuk sempat mencapai ~86 detik akibat timeout OpenRouter (30s x 2 retry) dan Jina (15s x 2 retry).

Perbaikan:
- Mengurangi timeout OpenRouter menjadi **13s** dan retry maksimal **1x** (hanya untuk error 5xx/429/timeout).
- Mengurangi timeout Jina scraping menjadi **7.5s** dengan retry **0** untuk sumber sekunder (langsung beralih ke snippet Tavily jika gagal).
- Mengurangi timeout Tavily pencarian menjadi **7.0s**.
- Latensi skenario terburuk terpangkas dari ~86s menjadi **~20–26s** (75%+ lebih cepat); estimasi rata-rata normal **~6–14s**.

Status:
✅ Selesai (Kecepatan pipeline optimal tanpa penurunan akurasi)

---

### Frontend UI & Accessibility Audit
Temuan:
- Fokus keyboard dan pembaca layar belum berpindah otomatis ke Kartu Hasil saat verifikasi selesai.
- Tombol trigger accordion FAQ belum sepenuhnya terhubung ke panel konten via relasi ARIA (`aria-controls`).
- Klik mouse pada tombol sempat meninggalkan outline kuning tidak perlu.

Perbaikan:
- Mengarahkan fokus programatis (`containerRef.current?.focus({ preventScroll: true })`) ke Result Card saat selesai.
- Menghubungkan setiap tombol FAQ ke panel melalui `aria-controls`, `role="region"`, dan `aria-labelledby`.
- Menerapkan selektor `:focus-visible` di seluruh aplikasi dan mematikan outline untuk klik pointer standar.

Status:
✅ Selesai (Sesuai kepatuhan WCAG 2.1 AA)

---

### Deployment Readiness Audit
Temuan:
- **.env.example & Environment Variables**: Seluruh variabel wajib (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `TAVILY_API_KEY`, `JINA_API_KEY`) terdokumentasi rapi dan divalidasi ketat saat runtime menggunakan Zod di `lib/env.ts`.
- **.gitignore**: Menyaring aman seluruh file lingkungan (`.env*`), artefak build (`.next/`, `build/`, `out/`), dependensi (`node_modules/`), dan konfigurasi Vercel (`.vercel`).
- **Metadata, Robots & Sitemap**: `app/layout.tsx` mengonfigurasi `metadataBase` (`https://saringopini.id`), OpenGraph, Twitter card, dan ikon SVG. Rute `app/robots.ts` dan `app/sitemap.ts` terkompilasi statis dan terindeks valid.
- **Production Build**: Kompilasi Turbopack Next.js 16 (`npm run build`) sukses tanpa error maupun peringatan tipe TypeScript.
- **Deployment Configuration**: Bebas dependensi database eksternal (*stateless*), Node.js server actions / route handler kompatibel penuh dengan Vercel Serverless & Edge infrastructure.

Klasifikasi Temuan:
- **P0 (Deployment Blocker)**: Nihil (0 blocker)
- **P1 (Recommended Fix)**: Nihil (0 recommended fix)
- **P2 (Optional)**: Menambahkan `saringopini.id` sebagai custom domain utama di dashboard Vercel setelah deployment pertama.

Status:
✅ Selesai (Saring Opini siap untuk deployment ke Vercel.)

---

## Optimasi yang Sudah Dilakukan

- **Multi-Provider AI Fallback Engine (OpenRouter + Groq) (P0)**: Mengintegrasikan provider AI ganda (*OpenRouter* sebagai primary/default dan *Groq* sebagai fast fallback/alternative) dengan konfigurasi model dinamis via `.env` (`GROQ_API_KEY`, `GROQ_MODEL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`). Pipeline otomatis beralih ke provider cadangan jika provider utama mengalami rate limit (429), server error (5xx), atau timeout.
- **Source Credibility Tiers & Mainstream Media Bias (P0)**: Mengimplementasikan sistem tingkatan kredibilitas media (*Tier 1: Dewan Pers & Arus Utama*, *Tier 2: Portal Berita Nasional/Regional Terdaftar*, *Tier 3: Blog/Forum/Agregator Tidak Terverifikasi*). Memperbarui prompt ekstraksi kueri agar memprioritaskan media arus utama, memberi label `[TIER 1/2/3]` pada konteks fakta, menyaring/membuang sumber Tier 3 sebelum dikirim ke sintesis AI jika $\ge 2$ sumber Tier 1/2 tersedia, dan membatasi keyakinan (*confidence cap*) jika bukti tidak bersumber dari media primer.

- **Event-Level Incident Corroboration & Tag Page Penalty (P0)**: Mengembangkan engine penilaian relevansi sumber berbasis peristiwa inti (*core incident action*). Menerapkan penalti keras (-50 poin) untuk halaman indeks/tag/kategori/arsip (`/tag/`, `/topik/`), penalti (-30 poin) untuk artikel yang berada di lokasi sama tetapi membahas peristiwa/kasus berbeda, dan bonus signifikan (+35 poin) untuk artikel yang mencocokkan kata kerja aksi dan aktor peristiwa yang sama secara presisi.
- **URL Retrieval Resilience & Fallback Hierarchy (P0)**: Menerapkan pemulihan metadata URL bertingkat (*Jina Scraping ➔ Tavily Search URL Metadata Recovery ➔ URL Slug Title Extractor*). Menghilangkan string fallback generik `"Artikel Berita"` sehingga kegagalan scraping pada portal berita terproteksi (seperti Detik/Kompas) tetap menghasilkan entitas terstruktur dan kueri jurnalistik tajam.

- **Performance Optimization**: Latensi dipangkas $\ge 75\%$, fallback instan snippet Tavily, penghapusan bundle `useTransition` yang tidak perlu.
- **Accessibility (a11y)**: Fokus programatis Result Card, relasi ARIA accordion FAQ, semantik progressbar dan live region, kontras teks $\ge 4.5:1$, target sentuh $\ge 44\text{px}$.
- **Verification Flow UX (Auto-Scroll)**: Mengimplementasikan `smoothCenterInViewport` GSAP (`power2.out`, 0.5s) yang secara otomatis memusatkan kartu loading saat verifikasi dimulai dan mendarat mulus pada Result Card saat analisis selesai tanpa scrolling manual.
- **Motion System**: GSAP 3 smooth scroll antar seksi, transisi step loading dinamis, interpolasi angka confidence gauge, isolasi `prefers-reduced-motion`.
- **Pipeline Reliability**: Alur SSE murni tanpa timer tiruan, parsing markdown/JSON OpenRouter yang tahan sanitasi, penanganan kegagalan scraping bertingkat.
- **Multi-Query Structured Entity Retrieval**: Mengekstraksi 6 dimensi entitas (*event*, *location*, *people*, *organizations*, *numbers*, *dates*) dari input URL dan memicu penelusuran 3 varian kueri (*Query A: Specific Event*, *Query B: Entity-Focused*, *Query C: Location-Focused*) secara paralel ke Tavily untuk memastikan berita pembanding atas peristiwa yang sama ditemukan secara komprehensif.
- **Journalistic Query Compression (4–8 Keywords)**: Mengompresi kueri pencarian menjadi 4–8 kata kunci padat dan menghapus penambahan suffix kaku (`"berita cek fakta indonesia"`), sehingga Tavily melakukan pencarian berita langsung (*direct event matching*).
- **Publisher Dateline vs Event Location Filtering**: Membedakan lokasi redaksi/biro pers umum (*Jakarta, Semarang, Surabaya, Bandung*) dari lokasi peristiwa sebenarnya agar artikel berita kredibel yang menyebutkan lokasi biro tidak terkena penalti lokasi palsu.
- **Retrieval Observability & Diagnostics**: Mencatat kueri yang digenerasi, jumlah kandidat Tavily, artikel yang diterima (`>= 60`), serta rincian alasan penolakan artikel yang tidak cocok (`< 60`) di server log secara real-time.
- **Error Handling**: Pesan error ramah pengguna berbahasa Indonesia, penanganan timeout jaringan gracefully, batas error global Next.js.


---

## Struktur Arsitektur Akhir

```
[ User Input (URL / Teks Broadcast) ]
                │
                ▼
[ Multi-Layer URL Recovery (Jina / Tavily / Slug) ]
                │
                ▼
   [ 1. Query & Entity Extraction ] ── (OpenRouter AI - JSON Mode)
                │
                ▼
   [ 2. News Retrieval ] ───────────── (Tavily Search API - Dewan Pers Scope)
                │
                ▼
   [ 3. Clean Content Scraping ] ───── (Jina Reader API - Fast Fallback)
                │
                ▼
   [ 4. Geographic & Event Scoring ] ─ (Same-Event Corroboration Engine)
                │
                ▼
   [ 5. Fact Decision Synthesis ] ──── (OpenRouter AI - Strict Grounding)
                │
                ▼
   [ Real-Time SSE Stream ] ────────── (app/api/verify/stream/route.ts)
                │
                ▼
   [ Result Card & Source Links ] ──── (FAKTA / HOAX / PERLU VERIFIKASI)
```

---

## Isu yang Diselesaikan

### P0 (Kritikal / Blocker)
- **Generic Fallback Regression ("Artikel Berita")**: Memperbaiki kerentanan pada input URL berita ketika Jina Reader timeout/diblokir anti-bot, yang sebelumnya memicu fallback string `"Artikel Berita"`. Digantikan dengan ekstraksi cerdas slug URL (`extractSlugTitle`) dan pemulihan metadata via Tavily (`recoverUrlMetadataViaTavily`).
- **Dead Code Duplication**: Menghapus `actions/verify.ts` (382 baris) dan folder `temp-app/` agar pipeline verifikasi memiliki kebenaran tunggal (*single source of truth*) pada `/api/verify/stream`.
- **Latency Bottleneck**: Memangkas timeout dan retry OpenRouter, Jina, dan Tavily untuk memangkas latensi eksekusi terburuk dari ~86s menjadi ~20–26s.
- **Strict Schema Failure on Uncertain Claims**: Menyesuaikan skema validasi Zod dengan `.superRefine()` agar klaim spekulatif (`TIDAK_DAPAT_DIPASTIKAN`) dengan `ringkasanFakta: []` tidak mengalami error validasi palsu.


### P1 (Kualitas / UX / Aksesibilitas)
- **Result Card Focus Management**: Mengarahkan fokus pembaca layar dan keyboard otomatis ke hasil analisis.
- **FAQ ARIA Accessibility**: Menghubungkan ID panel dengan `aria-controls` pada setiap tombol accordion FAQ.
- **Navbar Redundancy**: Menghilangkan tautan ganda "Verifikasi" dan memprioritaskan tombol aksi utama "Periksa Cepat".
- **Verification Flow Viewport Friction**: Mengimplementasikan auto-scroll cerdas berbasis GSAP (`smoothCenterInViewport`) saat verifikasi dimulai dan saat data hasil tiba, sehingga pengguna mobile (320px–430px) maupun desktop tidak perlu menggulir halaman secara manual.
- **Hero Vertical Rhythm**: Merapatkan jarak vertikal Hero dengan formulir utama untuk pengalaman *tool-first*.
- **Mobile Menu Drawer Stacking**: Memperbaiki arsitektur laci navigasi mobile menjadi *fixed overlay* di luar header.
- **Anti-Slop Cleanups**: Menghapus komentar slop bernomor dan mengganti kartu tiruan dengan diagram arsitektur asli.

### P2 (Penyempurnaan Minor)
- **Domain Utility Deduplication**: Menyatukan fungsi parsing domain URL ke dalam `extractDomain` di `lib/utils.ts`.
- **Keyboard Outline Polish**: Menerapkan selektor `:focus-visible` global agar klik mouse tidak meninggalkan garis kuning.
- **Physical Feedback Preset Chips**: Menambahkan animasi getar mikro GSAP saat pengguna memilih contoh kueri preset.

---

## Backlog Pasca Launch

### V1.1
- [ ] Tombol bagikan hasil analisis langsung ke WhatsApp dengan format ringkas.
- [ ] Kartu sumber rujukan dengan cuplikan paragraf kutipan langsung.
- [ ] Peningkatan bobot ranking media lokal berdasarkan provinsi peristiwa.
- [ ] Penyempurnaan penyajian kutipan sumber dalam narasi analisis.

### V1.2
- [ ] Lapisan *Caching Layer* (Redis / Upstash) untuk kueri identik berulang dalam 24 jam.
- [ ] Dasbor analitik anonim untuk tren hoaks yang sering dicek masyarakat.

---

## Checklist Launch

- [x] **UI & Visual**: Sesuai prinsip Neo-Brutalisme, kontras tinggi, hierarki jelas.
- [x] **Responsive**: Teruji bebas overflow pada 320px, 375px, 768px, 1024px, 1440px.
- [x] **Accessibility**: Memenuhi standar WCAG 2.1 AA, navigasi keyboard lengkap, pembaca layar ramah.
- [x] **SEO & Meta**: Metadata dinamis, OpenGraph, Twitter Card, dan SVG favicon aktif.
- [x] **Perayap Mesin Pencari**: Rute statis `robots.txt` dan `sitemap.xml` terkonfigurasi.
- [x] **Error Boundary**: Penanganan 404 neo-brutalis dan penangkap error global terpasang.
- [x] **Build Verification**: `npm run build` kompilasi Turbopack sukses dengan 0 error.
- [x] **Schema Tests**: Seluruh 5 skenario pengujian unit Zod lulus 100%.
- [x] **Performance Review**: Latensi pipeline optimal dengan mekanisme *fast fallback*.
- [x] **Documentation**: `README.md` dan `TASKS.md` terdokumentasi profesional dalam Bahasa Indonesia.

---

## Catatan Teknis & Keputusan Arsitektur

1. **Prinsip Stateless & Nol Database**:
   Saring Opini tidak menyimpan data input pengguna, pesan broadcast pribadi, maupun riwayat pencarian di basis data apa pun. Seluruh analisis berlangsung *in-memory* selama siklus hidup request dan langsung dibuang untuk menjamin privasi total.

2. **Protokol Server-Sent Events (SSE) vs Polling / Websocket**:
   Menggunakan SSE melalui Web API `ReadableStream` di Route Handler Next.js. Keputusan ini dipilih karena komunikasi pipeline bersifat satu arah (server ke klien) dan memiliki overhead jaringan yang jauh lebih rendah dibanding WebSocket, tanpa memerlukan server stateful terpisah.

3. **Verifikasi Peristiwa Sama (Same-Event Corroboration)**:
   Untuk mencegah AI mencocokkan dua peristiwa yang mirip namun berbeda kota atau tahun, sistem mengekstrak entitas geografis spesifik dan menerapkan penalti skor relevansi (-40 poin) jika artikel berita pembanding berasal dari wilayah berbeda.

4. **Multi-Source Fallback Strategy**:
   Jika artikel primer gagal diekstrak via Jina Reader dalam 7.5 detik, sistem tidak membatalkan proses melainkan langsung menggunakan teks *snippet* pencarian Tavily untuk menjaga kelancaran pengalaman pengguna.

5. **Klasifikasi Topik Ekonomi & Prioritas Otoritas Pasar Modal**:
   Untuk klaim bertema ekonomi, pasar modal, saham, dan keuangan, sistem mendeteksi topik secara otomatis tanpa mengubah UI/UX, lalu mengalihkan prioritas pencarian dan verifikasi ke sumber otoritas resmi SRO (Bursa Efek Indonesia / IDX `idx.co.id`, KSEI `ksei.co.id`, IDClear / KPEI `idclear.co.id`, dan Otoritas Jasa Keuangan `ojk.go.id`) sebagai sumber Tier 1 primer berbobot tertinggi.

---

## Log Riwayat Implementasi

### Completed

- [x] Klasifikasi Topik Ekonomi & Integrasi Sumber Otoritas Resmi Pasar Modal (BEI, KSEI, IDClear, OJK)
  - Date: 2026-09-29
  - Files:
    - [lib/utils.ts](file:///d:/Codinge_Here/saringopini/lib/utils.ts)
    - [lib/tavily.ts](file:///d:/Codinge_Here/saringopini/lib/tavily.ts)
    - [lib/openrouter.ts](file:///d:/Codinge_Here/saringopini/lib/openrouter.ts)
    - [app/api/verify/stream/route.ts](file:///d:/Codinge_Here/saringopini/app/api/verify/stream/route.ts)
    - [lib/__tests__/economic_classification.test.ts](file:///d:/Codinge_Here/saringopini/lib/__tests__/economic_classification.test.ts)
  - Notes:
    - Membuat klasifikasi otomatis topik ekonomi (`isEconomicTopic`, `classifyTopic`) berbasis kata kunci pasar modal, instrumen keuangan, regulator, dan pola URL.
    - Menambahkan kamus emiten bursa saham (`KNOWN_EMITEN_MAP`) dan fungsi ekstraksi emiten (`extractEmitenMention`) untuk mendeteksi ticker publik (seperti GOTO, BBCA, BBRI, BMRI, TLKM, BUKA, dll.) serta istilah kepemilikan/tata kelola perusahaan (pemilik, pendiri, pemegang saham, direktur).
    - Menetapkan 4 otoritas ekonomi utama (`idx.co.id`, `ksei.co.id`, `idclear.co.id`, `ojk.go.id`) sebagai sumber Tier 1 dengan kredibilitas tertinggi di `domainTier` dan `isEconomicOfficialDomain`.
    - Mengimplementasikan pencarian multi-sudut (*multi-angle retrieval*) saat klaim menyangkut emiten/perusahaan: mengambil profil keterbukaan informasi langsung dari `site:idx.co.id`, data kepemilikan saham resmi, serta kueri klaim spesifik.
    - Menambahkan bonus relevansi (+25 poin) untuk sumber otoritas ekonomi di `calculateSourceRelevance`.
    - Mengurutkan sumber resmi ekonomi ke posisi teratas (`targetSearchArticles`) sebelum dianalisis oleh AI.
    - Memperbarui instruksi prompt ekstraksi kueri agar mencari bukti pemegang saham resmi ketika klaim mempertanyakan kepemilikan perusahaan.
    - Tidak ada perubahan pada UI/UX komponen frontend sesuai spesifikasi pengguna.
  - Verification:
    - `npx tsx lib/__tests__/economic_classification.test.ts` ✅ (Semua skenario pengujian lulus, termasuk kasus 'ridho pemilik goto?')
    - `npx tsx lib/__tests__/schemas.test.ts` ✅ (Skema validasi lulus)
- [x] Resolusi Dominasi Domain Tunggal (Bloomberg Technoz), Deteksi Ticker Bursa 4 Huruf (AADI/Adaro), Penegakan Keberagaman Domain (Domain Diversity), dan Penyaringan Relevansi Pencarian Teks
  - Date: 2026-09-29
  - Files:
    - [lib/utils.ts](file:///d:/Codinge_Here/saringopini/lib/utils.ts)
    - [lib/tavily.ts](file:///d:/Codinge_Here/saringopini/lib/tavily.ts)
    - [app/api/verify/stream/route.ts](file:///d:/Codinge_Here/saringopini/app/api/verify/stream/route.ts)
    - [lib/__tests__/economic_classification.test.ts](file:///d:/Codinge_Here/saringopini/lib/__tests__/economic_classification.test.ts)
  - Notes:
    - Mendiagnosis penyebab kueri "apakah ridho pemilik AADI" menampilkan rujukan dominan dari `bloombergtechnoz.com` (Prajogo Pangestu CUAN, BUMI, BCA, LPKR): kueri sebelumnya terklasifikasi sebagai "umum" karena AADI belum terdaftar, LLM mengubah kueri menjadi istilah umum tanpa relevansi subjek, Tavily mengelompokkan artikel finansial tanpa diversifikasi domain, dan pipeline mode teks belum menerapkan filter relevansi isi artikel.
    - Menambahkan kode saham `AADI` (PT Adaro Andalan Indonesia Tbk), `ADMR`, `CUAN`, `PTRO`, `DEWA`, `PGAS`, `INCO`, `PTBA`, `KIJA`, `BSDE`, `LPKR` ke `KNOWN_EMITEN_MAP`.
    - Mengimplementasikan deteksi dinamis ticker bursa 4 huruf kapital (`extractEmitenMention`) dengan filter akronim non-saham (seperti BMKG, BNPB, BPOM, PSSI, dll.) dan validasi konteks pasar modal/kepemilikan.
    - Menerapkan penegakan keberagaman domain (*Domain Diversity*): membatasi maksimal 1 artikel per portal media komersial (tidak akan pernah terjadi lagi 3 atau 4 artikel berasal dari Bloomberg Technoz saja), dan maksimal 2 artikel khusus untuk otoritas resmi bursa (`idx.co.id`, `ojk.go.id`, `ksei.co.id`).
    - Menambahkan opsi `strictCustomDomainsOnly` di `lib/tavily.ts` agar pencarian profil keterbukaan informasi di `idx.co.id` benar-benar terisolasi ke situs resmi BEI tanpa tercampur portal berita umum.
    - Menerapkan penyaringan relevansi (*relevance filtering*) pada mode teks: artikel pembanding yang tidak menyebutkan kode ticker, nama emiten, atau subjek klaim akan otomatis ditolak dan tidak dikirimkan ke AI.
    - Menghapus seluruh baris komentar (`//` dan `/* */`) pada file yang diubah sesuai instruksi ketat pengguna.
  - Verification:
    - `npx tsx lib/__tests__/economic_classification.test.ts` ✅ (Seluruh 16 skenario pengujian lulus, termasuk AADI dan BREN)
- [x] Pembaruan Label Status Hoax Menjadi "TERINDIKASI HOAKS"
  - Date: 2026-09-30
  - Files:
    - [components/verification/ResultCard.tsx](file:///d:/Codinge_Here/saringopini/components/verification/ResultCard.tsx)
  - Notes:
    - Memperbarui label lencana kesimpulan analisis sistem untuk status `HOAX` dari `"HOAX / MISINFORMASI"` menjadi `"TERINDIKASI HOAKS"`.
    - Menyelaraskan teks deskripsi status menjadi `"Klaim terindikasi tidak benar, dimanipulasi, atau merupakan penipuan berantai."`.
    - Menyelaraskan teks clipboard pada tombol "Salin Hasil" agar menggunakan label `"TERINDIKASI HOAKS"`.
    - Menghapus seluruh baris komentar (`//`, `/* */`, dan `{/* */}`) dari komponen `ResultCard.tsx`.
- [x] Perbaikan Evaluasi Logika Kausalitas AI & Ekstraksi Predikat Klaim (Resolusi False Positive FAKTA)
  - Date: 2026-09-30
  - Files:
    - [lib/openrouter.ts](file:///d:/Codinge_Here/saringopini/lib/openrouter.ts)
  - Notes:
    - Mendiagnosis bug logika verifikasi pada klaim "INDONESIA MERDEKA KARENA AMERIKA KALAH PERANG" yang sebelumnya keliru menghasilkan putusan "FAKTA / TERVERIFIKASI" (95%): AI mengalami bias konfirmasi dan kesesatan kebenaran parsial (*partial truth fallacy*) karena artikel memuat kata kemerdekaan Indonesia dan Amerika Serikat, tanpa memverifikasi kebenaran klausa sebab-akibat ("karena Amerika kalah perang" padahal Amerika/Sekutu menang dan Jepang yang kalah perang).
    - Memperbarui `extractSearchQuery` agar wajib mempertahankan inti predikat/tuduhan utama klaim (misalnya "kalah perang", "ditangkap", "palsu", "pemilik") sehingga kueri pencarian Tavily menghasilkan artikel klarifikasi atau bantahan spesifik, bukan artikel sejarah umum yang netral.
    - Memperbarui `systemPrompt` pada `analyzeFactClaim` dengan aturan verifikasi logika dan semantik ketat:
      1. Dekonstruksi klausa kausal "A terjadi karena B" (keduanya harus benar dan saling berhubungan sebab-akibat nyata).
      2. Deteksi pembalikan fakta (*inversion detection*: pemenang vs yang kalah, subjek vs objek, pelaku vs korban).
      3. Penegasan bahwa klaim dengan premis salah atau terbalik WAJIB divonis "HOAX", tidak boleh diberi vonis "FAKTA" hanya karena bagian lain kalimatnya benar.
    - Menambahkan penjaga *null-safety* pada pembacaan cuplikan konten artikel (`(art.content || "").slice(...)`).
    - Menghapus seluruh baris komentar (`//` dan `/* */`) dari berkas `lib/openrouter.ts`.
  - Verification:
    - Pengujian *end-to-end* klaim "INDONESIA MERDEKA KARENA AMERIKA KALAH PERANG": Berhasil divonis **HOAX** (90% - 99%) dengan analisis historis akurat bahwa Sekutu/Amerika memenangkan perang dan Jepang yang menyerah kalah ✅.
    - `npx tsx lib/__tests__/economic_classification.test.ts` ✅ (16/16 tes lulus)
    - `npx tsx lib/__tests__/schemas.test.ts` ✅ (5/5 tes lulus)
    - `npx tsc --noEmit` ✅ (TypeScript 0 errors)
    - `npm run build` ✅ (Turbopack production build berhasil 0 error)


