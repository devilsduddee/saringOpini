# AGENTS.md

# Saring Opini - Agent Operating Rules

## Project Overview

Saring Opini adalah platform verifikasi berita dan anti-hoax berbasis AI.

Agent harus selalu mengacu pada:

1. PRD.md
2. DESIGN.md
3. TECHSTACK.md

Jika terjadi konflik:

DESIGN.md → UI/UX

TECHSTACK.md → Technical Architecture

PRD.md → Business Requirements

PRD.md memiliki prioritas tertinggi untuk fitur.

---

# Required Workflow

Sebelum mengimplementasikan fitur:

1. Baca PRD.md
2. Baca DESIGN.md
3. Baca TECHSTACK.md
4. Buat plan
5. Implementasi
6. Review
7. Verifikasi

Jangan langsung coding tanpa memahami dokumen.

---

# Mandatory Skills

Selalu gunakan skill berikut saat relevan:

## Planning

- planning-and-task-breakdown

## Frontend

- frontend-ui-engineering
- shadcn

## API

- api-and-interface-design

## Quality

- test-driven-development
- code-review-and-quality
- debugging-and-error-recovery
- antislop-code

## UI/UX

- emil-design-eng
- design-taste-frontend
- antislop
- antislop-ui
- antislop-layoutmobile
- find-animation-opportunities
- improve-animations
- review-animations

## Performance

- performance-optimization

---

# Architecture Rules

## App Structure

app/
components/
actions/
lib/
hooks/
types/
tests/

Gunakan feature separation yang jelas.

Jangan membuat file secara acak.

---

## Server Architecture

Gunakan Next.js App Router.

Gunakan Server Actions.

Jangan membuat Express server.

Jangan membuat backend terpisah kecuali benar-benar diperlukan.

---

## Data Flow

User Input
↓
Server Action
↓
OpenRouter
↓
Tavily
↓
Jina Reader
↓
Fact Analysis
↓
UI Result

Jangan mengubah flow tanpa alasan yang jelas.

---

# Code Quality Rules

## File Size

Keep files under 500 lines.

Ideal:

- Components: 50-200 lines
- Hooks: < 150 lines
- Utilities: < 200 lines
- Pages: < 300 lines

Jika file mulai besar:

Extract component.

Extract hook.

Extract utility.

---

## Component Rules

One component = one responsibility.

Jangan membuat monster component.

Pisahkan:

- UI
- Logic
- Animation

---

## TypeScript Rules

Gunakan TypeScript strict.

Hindari:

- any
- unknown yang tidak perlu

Selalu definisikan type.

---

## API Rules

Selalu gunakan:

- Zod Validation
- Typed Responses
- Structured JSON

Jangan percaya data external secara langsung.

---

# Design Rules

Selalu ikuti DESIGN.md.

Tidak boleh membuat UI yang bertentangan dengan DESIGN.md.

Prioritas desain:

1. Clarity
2. Readability
3. Responsiveness
4. Performance
5. Aesthetics

---

# Animation Rules

Gunakan GSAP.

Animation harus:

- smooth
- subtle
- fast

Gunakan:

- power2.out
- power3.out

Hindari:

- bounce
- elastic
- flashy effects

Animation harus mendukung UX.

Bukan dekorasi.

---

# Responsive Rules

Mobile-first.

Wajib support:

- Mobile
- Tablet
- Desktop
- Large Desktop

Tidak boleh ada:

- horizontal scroll
- text overflow
- layout break

---

# Anti-Slop Rules

Dilarang:

- blue purple gradients
- glassmorphism berlebihan
- AI hero template
- fake dashboards
- fake statistics
- fake testimonials
- fake terminal sections

Semua konten harus memiliki tujuan nyata.

---

# Documentation Rules

Setiap fitur besar wajib memiliki:

- tujuan
- flow
- dependency
- reasoning

Dokumentasikan keputusan penting.

Jangan membuat magic code.

---

# Performance Rules

Minimalkan:

- unnecessary rerenders
- large client bundles
- duplicated requests

Prefer:

- Server Components
- Server Actions
- Lazy Loading
- Dynamic Imports

---

# Testing Rules

Semua logic penting harus dapat diuji.

Minimal:

- validation
- parser
- API clients
- fact analysis flow

---

# Do Not Use

Jangan gunakan:

- Redux
- Context berlebihan
- jQuery
- Inline styles
- CSS files per component
- Massive utility files
- Giant components
- Hardcoded data production
- Mock content di fitur final

---

# Decision Framework

Jika ragu:

1. Pilih solusi paling sederhana.
2. Pilih solusi yang mudah di-maintain.
3. Pilih solusi yang konsisten dengan TECHSTACK.md.
4. Pilih solusi yang konsisten dengan DESIGN.md.
5. Pilih solusi dengan bundle size paling kecil.

---

# Success Criteria

Hasil akhir harus:

- Cepat
- Responsif
- Mudah digunakan
- Mudah di-maintain
- Kredibel
- Konsisten dengan PRD
- Konsisten dengan DESIGN
- Konsisten dengan TECHSTACK

# Task Tracking Rules

Semua pekerjaan yang selesai harus didokumentasikan ke TASKS.md.

Jangan hanya menyelesaikan pekerjaan, tetapi juga memperbarui status dokumentasi.

---

## Required Updates

Setelah menyelesaikan task:

1. Update checklist status.
2. Tambahkan tanggal pengerjaan.
3. Tambahkan ringkasan implementasi.
4. Tambahkan file yang dibuat atau diubah.
5. Tambahkan hasil verifikasi/build jika ada.

---

## Format

### Completed

- [x] Setup GSAP
  - Date: YYYY-MM-DD
  - Files:
    - package.json
    - lib/gsap.ts
  - Notes:
    - Installed GSAP.
    - Created animation helpers.
  - Verification:
    - npm run build ✅

### In Progress

- [ ] OpenRouter Integration

### Planned

- [ ] Tavily Integration
- [ ] Jina Integration

---

## Documentation First

Saat task selesai:

Code
↓
Review
↓
Build Verification
↓
Update TASKS.md
↓
Baru dianggap selesai

Task tidak dianggap selesai jika TASKS.md belum diperbarui.

---

## Session End Rule

Sebelum mengakhiri pekerjaan:

- Review perubahan
- Jalankan verifikasi yang relevan
- Update TASKS.md
- Catat next step

Selalu tinggalkan project dalam kondisi terdokumentasi menggunakan bahasa indonesia.

# Aturan Penggunaan Browser

Jangan otomatis membuka browser setiap selesai mengubah kode.

Prioritaskan:

1. Analisis kode
2. Build verification
3. Type checking
4. Review komponen yang diubah
5. Penalaran terhadap perubahan

Browser hanya boleh digunakan ketika:

- Memperbaiki bug visual yang dilaporkan pengguna
- Memperbaiki bug runtime yang tidak bisa diverifikasi dari kode
- Melakukan QA akhir sebelum deploy
- Menguji animasi yang benar-benar membutuhkan observasi visual
- Memvalidasi alur pengguna (user flow) yang diminta secara eksplisit

Jangan membuka browser untuk:

- Perubahan styling kecil
- Refactor kode
- Perubahan dokumentasi
- Perubahan helper atau utility
- Perubahan prompt AI
- Perubahan konfigurasi
- Penyesuaian animasi mikro yang dapat diverifikasi dari kode

Workflow yang harus diikuti:

1. Implementasi
2. Build (`npm run build`)
3. Type Check
4. Review kode yang diubah
5. Update TASKS.md
6. Selesai

Gunakan browser hanya jika memang diperlukan.

Tujuan:
- Menghemat waktu
- Mengurangi proses yang tidak perlu
- Mempercepat iterasi
- Mengurangi penggunaan resource

Browser adalah alat verifikasi terakhir, bukan langkah wajib setiap perubahan.