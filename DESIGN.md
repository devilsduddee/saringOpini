# DESIGN.md

## Design Vision

Saring Opini harus terasa seperti kombinasi antara:

- Perplexity
- Linear
- Stripe
- Neo-Brutalism Modern

Karakter utama:

- Bold
- Cepat
- Tegas
- Kredibel
- Modern
- Tidak terlihat seperti website AI template

User harus langsung merasa:

"Ini alat verifikasi yang serius dan terpercaya."

Bukan:

"Ini demo AI buatan weekend."

---

# Design Principles

## 1. Clarity First

Semua keputusan visual harus membantu pengguna memahami hasil verifikasi.

Prioritas:

1. Kesimpulan
2. Confidence Score
3. Alasan
4. Sumber

Tidak boleh ada elemen visual yang lebih dominan dari hasil verifikasi.

---

## 2. One Primary Accent

Gunakan hanya satu warna aksen utama.

Primary Accent:

#FFD12F

Jangan menambahkan:

- biru neon
- ungu gradien
- cyan AI style
- pink futuristik

---

## 3. Strong Typography

Typography adalah elemen visual utama.

Gunakan headline besar dan tegas.

Headline harus menjadi fokus sebelum ilustrasi atau dekorasi.

---

## 4. Brutal Simplicity

Komponen sederhana.

Lebih baik:

- border kuat
- spacing besar
- tipografi kuat

daripada:

- glassmorphism berlebihan
- shadow berlapis
- efek 3D berlebihan

---

# Color System

## Background

Primary:
#0D0D0D

Secondary:
#141414

Surface:
#1C1C1C

---

## Accent

Primary:
#FFD12F

Hover:
#FFE164

Active:
#F7C400

---

## Status

FACT:
#22C55E

HOAX:
#EF4444

UNCERTAIN:
#F59E0B

---

## Text

Primary:
#FFFFFF

Secondary:
#A1A1AA

Muted:
#71717A

---

# Typography

## Font Family

Primary:

Inter

Fallback:

sans-serif

---

## Headlines

Hero H1:

Desktop:
96px

Tablet:
72px

Mobile:
52px

Weight:
900

Line Height:
0.9

Letter spacing:
-0.04em

---

## H2

Desktop:
48px

Tablet:
40px

Mobile:
32px

Weight:
800

---

## Body

18px

Line Height:
1.7

Weight:
400

---

# Layout

## Container

Max Width:
1280px

Padding X:

Desktop:
32px

Tablet:
24px

Mobile:
16px

---

## Section Spacing

Desktop:
120px

Tablet:
96px

Mobile:
72px

---

# Hero Section

Layout:

Desktop:

Left:
Content

Right:
Interactive Visual

Grid:

6 / 6

---

Mobile:

Stack Vertical

Content
↓

Input
↓

Visual

---

Hero Content:

Badge:
"Verifikasi Fakta Berbasis AI"

Title:

"Cek Dulu.
Baru Sebarkan."

Highlight kata tertentu menggunakan warna accent.

---

Subtitle:

Penjelasan singkat maksimal 2 baris.

---

CTA:

Primary:
Periksa Sekarang

Secondary:
Lihat Cara Kerja

---

# Verification Tool

Ini adalah fokus utama website.

Bukan hero image.

Bukan ilustrasi.

Tool harus muncul above the fold.

---

Komponen:

Input Field

atau

Textarea

Tombol:

"Verifikasi"

Ukuran besar dan mudah ditekan.

---

# Result Card

Neo-brutal style.

Properties:

Background:
#1C1C1C

Border:
3px solid #FFD12F

Radius:
24px

Padding:
32px

---

Status Badge

FAKTA

HOAX

PERLU VERIFIKASI

Harus langsung terlihat tanpa scroll.

---

# Animations

Library:

GSAP

---

## General Rule

Animation harus terasa:

smooth
fast
premium

Bukan:

dramatic
show-off
berisik

---

## Durations

Micro:
0.2s

UI:
0.4s

Section:
0.6s

Hero:
0.8s

---

## Easing

Gunakan:

power2.out

atau

power3.out

Hindari:

bounce
elastic
back yang berlebihan

---

## Hero Reveal

Sequence:

Badge
↓

Title
↓

Subtitle
↓

CTA
↓

Input Tool

Stagger:
0.08s

---

## Scroll Animation

Gunakan:

gsap + scrollTrigger

Effect:

fade-up

distance:
30px

opacity:
0 → 1

Jangan gunakan:

rotate
flip
zoom ekstrem

---

## Result Reveal

Saat hasil selesai:

Card scale:
0.97 → 1

Opacity:
0 → 1

Duration:
0.5s

---

## Loading State

Gunakan:

- progress line
- pulse indicator
- skeleton

Jangan gunakan spinner besar.

---

# Responsiveness

## Mobile First

Desain harus dibuat dari mobile terlebih dahulu.

Target breakpoint:

Mobile:
320px+

Tablet:
768px+

Desktop:
1024px+

Large:
1440px+

---

## Mobile Rules

Tidak ada horizontal scroll.

Button minimal tinggi:

48px

Input minimal tinggi:

52px

Tap area:

44x44 px

---

# Anti Slop Rules

Dilarang:

- blue purple gradient
- glassmorphism berlebihan
- floating orb
- AI neon aesthetic
- bento cards tanpa alasan
- dashboard palsu
- fake statistic
- fake terminal

Semua elemen harus punya fungsi nyata.

---

# Overall Feeling

Jika Perplexity dan Linear membuat website verifikasi hoax dengan sentuhan neo-brutalism modern, hasilnya harus terasa seperti ini.