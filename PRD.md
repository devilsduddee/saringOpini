# Product Requirements Document (PRD)
## Saring Opini — Platform Verifikasi Berita & Anti-Hoax

**Versi:** 1.0
**Tanggal:** 8 September 2026
**Status:** Draft

---

## 1. Problem Statement

Di era digital, informasi menyebar dengan sangat cepat melalui media sosial, grup chat (WhatsApp, Telegram), dan platform berita online. Namun, kecepatan penyebaran ini tidak diimbangi dengan kemampuan masyarakat untuk melakukan verifikasi (cross-check) terhadap kebenaran informasi tersebut.

Masalah utama yang teridentifikasi:
- Banyak masyarakat menerima dan menyebarkan ulang (forward) berita atau broadcast tanpa memverifikasi kebenarannya terlebih dahulu.
- Proses cek fakta manual (mencari beberapa sumber, membandingkan, membaca kredibilitas media) memakan waktu dan membutuhkan literasi digital yang tidak semua orang miliki.
- Konten hoax sering dikemas menyerupai berita resmi atau pesan broadcast yang terlihat meyakinkan, sehingga sulit dibedakan oleh orang awam.
- Belum ada alat yang mudah diakses dan cepat digunakan untuk mengecek kebenaran suatu klaim, baik dalam bentuk tautan berita maupun teks/broadcast yang beredar di media sosial.

Akibatnya, hoax dan misinformasi terus beredar luas dan berpotensi menimbulkan keresahan sosial, kesalahpahaman publik, hingga kerugian material.

---

## 2. Goals

### 2.1 Tujuan Bisnis/Produk
- Menyediakan platform yang memudahkan pengguna untuk memverifikasi kebenaran suatu berita atau informasi secara cepat dan mudah diakses.
- Meningkatkan literasi digital masyarakat dengan menyediakan alasan/penjelasan di balik setiap kesimpulan (fakta/hoax), bukan sekadar label.
- Mengurangi penyebaran hoax dengan memberikan alat verifikasi yang praktis sebelum informasi dibagikan ulang.

### 2.2 Success Metrics (indikator keberhasilan)
- Jumlah pengecekan (query) yang berhasil diproses per hari/minggu.
- Tingkat akurasi kesimpulan yang dihasilkan sistem (divalidasi berkala secara manual/sampling).
- Waktu rata-rata proses dari input hingga output kesimpulan.
- Tingkat retensi pengguna (pengguna kembali menggunakan layanan).
- Rasio pengguna yang membaca penjelasan alasan (bukan hanya melihat label fakta/hoax).

---

## 3. Target Users

| Segmen | Deskripsi |
|---|---|
| Pengguna Media Sosial Umum | Individu yang sering menerima broadcast/forward berita di WhatsApp, Telegram, Facebook, X, dll dan ingin memastikan kebenarannya sebelum percaya/menyebarkan. |
| Jurnalis/Content Creator | Membutuhkan verifikasi cepat sebagai referensi awal sebelum menulis atau membuat konten. |
| Pendidik & Pegiat Literasi Digital | Menggunakan sebagai alat bantu edukasi tentang cara mengenali hoax. |
| Masyarakat Umum (non-teknis) | Orang tua, komunitas, dan kelompok usia yang rentan menjadi korban/penyebar hoax, membutuhkan interface yang sederhana. |

---

## 4. User Stories

1. **Sebagai pengguna media sosial**, saya ingin menempelkan (paste) tautan berita, agar saya bisa mengetahui apakah berita tersebut fakta atau hoax.
2. **Sebagai pengguna media sosial**, saya ingin menempelkan teks broadcast yang saya terima di grup WhatsApp, agar saya bisa memverifikasi kebenarannya sebelum menyebarkannya ke orang lain.
3. **Sebagai pengguna**, saya ingin melihat kesimpulan yang jelas (Fakta/Hoax/Tidak Dapat Dipastikan), agar saya cepat memahami status informasi tersebut.
4. **Sebagai pengguna**, saya ingin membaca alasan di balik kesimpulan tersebut (baik fakta maupun hoax), agar saya memahami konteks dan bisa belajar mengenali pola hoax di kemudian hari.
5. **Sebagai pengguna**, saya ingin melihat sumber-sumber referensi yang digunakan sistem dalam menyusun kesimpulan, agar saya bisa melakukan verifikasi lanjutan secara mandiri.
6. **Sebagai pengguna**, saya ingin proses pengecekan berjalan cepat, agar saya tidak perlu menunggu lama sebelum memutuskan untuk membagikan/tidak membagikan informasi.
7. **Sebagai pengguna baru**, saya ingin antarmuka yang sederhana dan mudah dipahami, agar saya tidak kebingungan meskipun tidak familiar dengan teknologi.
8. **Sebagai pengguna**, saya ingin mengetahui tingkat keyakinan (confidence level) sistem terhadap kesimpulannya, agar saya bisa menilai seberapa besar saya harus mempercayainya.
9. **Sebagai pengguna berulang**, saya ingin melihat riwayat pengecekan saya sebelumnya, agar saya bisa merujuk kembali tanpa mengecek ulang.

---

## 5. Functional Requirements

### 5.1 Input
- **FR-1:** Sistem harus dapat menerima input berupa **tautan (URL)** berita.
- **FR-2:** Sistem harus dapat menerima input berupa **teks bebas** (kalimat singkat, potongan broadcast, atau narasi panjang dari media sosial).
- **FR-3:** Sistem harus melakukan validasi dasar pada input (misal: URL valid/tidak, teks tidak kosong, batas panjang karakter).

### 5.2 Proses Scraping & Pencarian
- **FR-4:** Jika input berupa URL, sistem harus mengambil (scrape) konten dari halaman berita tersebut.
- **FR-5:** Sistem harus melakukan pencarian (via Search Engine API) terhadap sumber-sumber berita lain yang relevan dengan klaim/teks yang diinput, untuk keperluan pembanding.
- **FR-6:** Sistem harus mengumpulkan beberapa hasil pencarian (multi-source) sebagai bahan analisis, bukan hanya dari satu sumber.

### 5.3 Proses Analisis (LLM)
- **FR-7:** Sistem harus mengirimkan konten input beserta hasil scraping/pencarian ke LLM API untuk dianalisis.
- **FR-8:** Sistem harus menghasilkan kesimpulan berupa salah satu status: **Fakta**, **Hoax**, atau **Tidak Dapat Dipastikan/Perlu Verifikasi Lanjut**.
- **FR-9:** Sistem harus menyertakan **penjelasan/alasan** yang mendukung kesimpulan tersebut, baik untuk status fakta maupun hoax.
- **FR-10:** Sistem harus menampilkan **sumber referensi** (link) yang digunakan sebagai dasar analisis.
- **FR-11:** Sistem harus menampilkan **tingkat keyakinan (confidence score)** terhadap kesimpulan yang dihasilkan.

### 5.4 Output & Tampilan
- **FR-12:** Sistem harus menampilkan hasil analisis dalam format yang mudah dibaca (label status, alasan, sumber).
- **FR-13:** Sistem harus memberikan indikator visual yang jelas untuk membedakan status (misal warna merah untuk hoax, hijau untuk fakta, kuning untuk belum pasti).

---

## 6. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| **Performance** | Waktu respons dari input hingga output kesimpulan idealnya di bawah 15-20 detik (termasuk proses scraping + search API + LLM processing). |
| **Scalability** | Sistem harus mampu menangani lonjakan traffic saat suatu isu/berita sedang viral. |
| **Reliability** | Sistem harus memiliki fallback jika Search Engine API atau LLM API mengalami gangguan/rate limit, dengan pesan error yang informatif. |
| **Accuracy** | Kesimpulan yang dihasilkan harus didasarkan pada minimal beberapa sumber pembanding (bukan satu sumber saja) untuk mengurangi bias. |
| **Security** | Data input pengguna (terutama teks broadcast yang mungkin berisi info personal) harus diperlakukan secara aman dan tidak disimpan sembarangan. |
| **Privacy** | Riwayat pengecekan pengguna harus bersifat privat dan tidak ditampilkan ke publik tanpa izin. |
| **Usability** | Antarmuka harus sederhana, mobile-friendly, dan dapat digunakan oleh pengguna non-teknis. |
| **Transparency** | Sistem harus transparan mengenai sumber yang digunakan dan tidak menyembunyikan bagaimana kesimpulan diambil. |
| **Cost Efficiency** | Penggunaan Search API dan LLM API harus dioptimalkan (caching hasil pencarian untuk klaim yang sama/mirip) demi efisiensi biaya operasional. |
| **Availability** | Target uptime sistem minimal 99% (di luar maintenance terjadwal). |
| **Localization** | Sistem harus mendukung Bahasa Indonesia sebagai bahasa utama, mengingat target pengguna dan sumber berita mayoritas berbahasa Indonesia. |

---

## 7. Scope

### 7.1 In-Scope (Fase Awal/MVP)
- Input berupa link berita dan input berupa teks bebas.
- Proses scraping konten dari link yang diinput.
- Integrasi Search Engine API untuk mencari sumber pembanding.
- Integrasi LLM API untuk analisis dan penyusunan kesimpulan + alasan.
- Output kesimpulan (Fakta/Hoax/Tidak Dapat Dipastikan) beserta alasan dan sumber referensi.
- Tampilan web responsif (desktop & mobile browser).


### 7.2 Out-of-Scope (Fase Awal)
- Aplikasi mobile native (Android/iOS) — hanya web.
- Deteksi hoax pada gambar/video (deepfake, manipulasi visual) — fokus awal hanya teks dan link.
- Ekstensi browser untuk cek otomatis saat browsing.
- Integrasi langsung dengan API WhatsApp/Telegram untuk pengecekan otomatis di dalam chat.
- Fitur komunitas/forum diskusi antar pengguna.
- Sistem pelaporan hoax ke pihak berwajib/Kominfo secara otomatis.
- Multi-bahasa (selain Bahasa Indonesia) di fase awal.

### 7.3 Potential Future Scope
- Browser extension untuk cek cepat dari halaman apapun.
- Aplikasi mobile native.
- Deteksi hoax pada media gambar/video.
- Bot integrasi (WhatsApp/Telegram bot) untuk cek otomatis di chat.
- Dashboard analitik tren hoax yang sedang beredar.
- Sistem crowdsourcing/feedback pengguna untuk meningkatkan akurasi model.

---

## 8. Alur Sistem (High-Level)

1. Pengguna memasukkan input (link atau teks) ke Saring Opini.
2. Jika input berupa link → sistem melakukan scraping konten halaman.
3. Sistem melakukan pencarian melalui Search Engine API untuk menemukan sumber-sumber pembanding terkait klaim/topik tersebut.
4. Konten input + hasil pencarian dikirim ke LLM API untuk dianalisis.
5. LLM API mengembalikan kesimpulan (Fakta/Hoax/Belum Pasti) beserta alasan dan referensi sumber.
6. Sistem menampilkan hasil ke pengguna dalam format yang mudah dipahami.

