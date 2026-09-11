# Tech Stack & Program Flow Document
## Saring Opini — Platform Verifikasi Berita & Anti-Hoax

**Versi:** 1.0  
**Tanggal:** 10 September 2026  
**Status:** Architecture Draft  

---

## 1. Overview & Architectural Philosophy

Saring Opini dirancang sebagai **Stateless Single-Page Application (SPA)** berbasis **Fullstack JavaScript / TypeScript** tanpa dependensi basis data (Database-less). Seluruh pemrosesan verifikasi berita dan teks broadcast dilakukan secara real-time melalui arsitektur Server Actions (Next.js) yang mengarahkan payload data melalui pipeline terintegrasi: **LLM Parser → Search Engine API → Web Scalper API → LLM Fact Analyzer**.

Sistem mengutamakan kecepatan eksekusi, efisiensi konsumsi token/biaya, dan fleksibilitas *free-tier* API untuk keperluan prototipe maupun produksi tahap awal.

---

## 2. Tech Stack Specification

| Komponen | Teknologi / Layanan | Deskripsi & Alasan Pemilihan |
| :--- | :--- | :--- |
| **Framework Utama** | **Next.js 14+ (App Router)** | Framework Fullstack React menggunakan TypeScript. Memungkinkan penanganan logic backend secara aman via *Server Actions* tanpa butuh server Express terpisah. |
| **Bahasa Pemrograman** | **TypeScript** | Memastikan type-safety tinggi pada data flow antar-API (JSON schema validation pada LLM & Search API). |
| **Styling & UI Components** | **Tailwind CSS + Shadcn UI** | Mempercepat pembuatan antarmuka modern, responsif (*mobile-first*), dan accessible. |
| **Deployment & Hosting** | **Vercel / Cloudflare Pages** | Serverless hosting gratis dengan latensi rendah dan auto-CI/CD dari repositori Git. |
| **LLM Gateway** | **OpenRouter API** | Provider gateway untuk mengakses berbagai model AI (misal: `google/gemini-2.5-flash` atau `meta-llama/llama-3.3-70b-instruct`) dengan biaya efisien/free-tier. |
| **Search Engine API** | **Tavily Search API** | Search engine teroptimasi untuk LLM/RAG yang mengambil tautan berita pembanding paling relevan dan terpercaya. |
| **Web Scalper / Scraper API** | **Jina Reader API (`r.jina.ai`)** | Mengunjungi URL hasil pencarian dan mengembalikan isi konten berita bersih berformat Markdown (membuang iklan, menu, & footer). |
| **Database** | *None (Stateless)* | Aplikasi tidak memerlukan basis data. Seluruh state hasil pengecekan disimpan secara sementara di level Client State (React Reactivity/Hooks). |

---

## 3. Detailed Program Flow Diagram

```
                        +----------------------------+
                        |  User Input (Client UI)    |
                        | (Link Berita / Broadcast)  |
                        +----------------------------+
                                      |
                                      v
                        +----------------------------+
                        |   Next.js Server Action    |
                        |   (processVerification)    |
                        +----------------------------+
                                      |
                     +----------------+----------------+
                     |                                 |
         [Jika Input Teks Broadcast]             [Jika Input URL]
                     |                                 |
                     v                                 v
        +-------------------------+         +--------------------+
        |  STAGE 1: LLM PARSER    |         | Target URL         |
        |  (OpenRouter API)       |         | Langsung Ditetapkan|
        |  Extract Search Query   |         +--------------------+
        +-------------------------+                    |
                     |                                 |
                     v                                 |
        +-------------------------+                    |
        | STAGE 2: SEARCH ENGINE  |                    |
        | (Tavily Search API)     |                    |
        | Cari 2-3 URL Berita     |                    |
        +-------------------------+                    |
                     |                                 |
                     +----------------+----------------+
                                      |
                                      v
                        +----------------------------+
                        |  STAGE 3: WEB SCALPER API  |
                        |  (Jina Reader API)         |
                        |  Extract Clean Markdown    |
                        +----------------------------+
                                      |
                                      v
                        +----------------------------+
                        | STAGE 4: LLM FACT ANALYZER |
                        | (OpenRouter API)           |
                        | Compare Claim vs Scraping  |
                        | Generate Structured JSON   |
                        +----------------------------+
                                      |
                                      v
                        +----------------------------+
                        |   Render Result Component  |
                        |   - Label (Fakta/Hoax)     |
                        |   - Confidence Score (%)   |
                        |   - Penjelasan & Sumber    |
                        +----------------------------+
```

---

## 4. Program Execution Breakdown

### Step 1: Input Detection & Classification
1. User memasukkan data pada formulir landing page (`<textarea>` / `<input>`).
2. Server Action memeriksa apakah pola string diawali dengan protokol URL (`http://` atau `https://`).
   - Jika **URL**: Langsung melompati Stage 1 & 2, menjadikan URL tersebut sebagai target utama scraping.
   - Jika **Teks Broadcast**: Melanjutkan ke eksekusi pipeline lengkap (Stage 1 s/d 4).

### Step 2: Query Extraction (LLM Stage 1)
- Prompt khusus dikirim ke OpenRouter (`google/gemini-2.5-flash` / sejenis) untuk menyaring narasi broadcast yang berbelit-belit menjadi 1 kalimat *search query* yang netral dan efektif.

### Step 3: Information Retrieval (Tavily API)
- *Search query* dikirim ke Tavily API dengan spesifikasi parameter lokasi Indonesia (`gl: id`) untuk mengambil 2–3 artikel berita teratas dari portal berita kredibel.

### Step 4: Content Scraping & Cleansing (Jina Reader API)
- Tautannya di-pass ke endpoint Jina Reader (`https://r.jina.ai/<URL>`).
- Jina mengurai DOM HTML kompleks media berita menjadi struktur teks Markdown murni tanpa elemen gangguan (*ads*, *script*, *navigation bar*).

### Step 5: Verification & Decision Synthesis (LLM Stage 2)
- Input asli dari pengguna disandingkan dengan teks hasil scraping berita terpercaya di Stage 4.
- OpenRouter mengeksekusi *fact-checking prompt* dengan memaksa luaran berformat JSON terstruktur (`response_format: { type: "json_object" }`).
- Output memuat:
  - `status`: `"FAKTA"` | `"HOAX"` | `"TIDAK_DAPAT_DIPASTIKAN"`
  - `confidenceScore`: Integer (0–100)
  - `alasan`: Penjelasan analitis ringkas (2–3 kalimat)
  - `ringkasanFakta`: Poin utama fakta dari sumber resmi

### Step 6: UI Presentation
- Landing page menerima balasan dari Server Action dan menampilkan indikator visual dinamis (Merah = Hoax, Hijau = Fakta, Kuning = Perlu Verifikasi Lanjut) lengkap dengan tautan referensi berita.

---

## 5. Environment Variables Setup (`.env.local`)

```env
# OpenRouter API Key (LLM Gateway)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=........................

# Tavily Search API Key (Search Engine)
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxx

# Jina Reader API Key (Web Scalper)
JINA_API_KEY=jina_xxxxxxxxxxxxxxxxxxxxxxxx
```
