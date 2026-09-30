import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isUrl(str: string): boolean {
  const trimmed = str.trim();
  return /^https?:\/\//i.test(trimmed);
}

export function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "media";
  }
}

export const TRUSTED_DOMAINS_TIER1 = [
  "cnnindonesia.com",
  "kompas.com",
  "detik.com",
  "tempo.co",
  "antaranews.com",
  "metrotvnews.com",
  "bloombergtechnoz.com",
  "liputan6.com",
  "tribunnews.com",
  "republika.co.id",
  "mediaindonesia.com",
  "bbc.com",
  "kumparan.com",
  "turnbackhoax.id",
  "kominfo.go.id",
  "reuters.com",
];

export const ECONOMIC_OFFICIAL_DOMAINS = [
  "idx.co.id",
  "ksei.co.id",
  "idclear.co.id",
  "ojk.go.id",
  "bi.go.id",
  "kemenkeu.go.id",
  "bloombergtechnoz.com",
  "bisnis.com",
  "kontan.co.id",
  "cnbcindonesia.com",
  "investor.id",
];

export const ECONOMIC_MEDIA_DOMAINS = ECONOMIC_OFFICIAL_DOMAINS;

export const PRIMARY_GOV_SRO_DOMAINS = [
  "idx.co.id",
  "ksei.co.id",
  "idclear.co.id",
  "ojk.go.id",
  "bi.go.id",
  "kemenkeu.go.id",
];

export function isEconomicOfficialDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return PRIMARY_GOV_SRO_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export function domainTier(url: string): 1 | 2 | 3 {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    
    if (
      host.endsWith(".go.id") ||
      ECONOMIC_OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`)) ||
      TRUSTED_DOMAINS_TIER1.some((d) => host === d || host.endsWith(`.${d}`))
    ) {
      return 1;
    }
    if (
      host.endsWith(".co.id") ||
      host.endsWith(".id") ||
      host.includes("news") ||
      host.includes("tribun") ||
      host.includes("radar") ||
      host.includes("suara") ||
      host.includes("jawapos") ||
      host.includes("pikiran-rakyat") ||
      host.includes("sindonews") ||
      host.includes("bisnis.com") ||
      host.includes("inews.id") ||
      host.includes("merdeka.com") ||
      host.includes("viva.co.id")
    ) {
      return 2;
    }
    return 3;
  } catch {
    return 3;
  }
}

export type TopicCategory = "ekonomi" | "umum";

const ECONOMIC_KEYWORDS = [
  "idx", "bei", "bursa efek", "ksei", "kpei", "idclear", "ojk", "otoritas jasa keuangan",
  "bank indonesia", "kemenkeu", "bappebti", "lps",
  "saham", "ihsg", "emiten", "dividen", "ipo", "right issue", "stock split",
  "reksadana", "obligasi", "sukuk", "surat utang", "surat berharga", "sekuritas",
  "broker", "kustodian", "portofolio", "investor", "pasar modal", "waran",
  "derivatif", "short selling", "auto rejection", "suspensi saham", "delisting", "relisting",
  "capital gain", "lot saham",
  "pemilik", "pemegang saham", "pendiri", "founder", "owner", "kepemilikan", "kepemilikan saham",
  "direktur utama", "komisaris", "ceo", "cfo", "akuisisi", "merger", "divestasi",
  "goto", "gojek", "tokopedia", "bukalapak", "telkom", "danantara", "astra", "indofood",
  "unilever", "adaro", "antam", "medco", "barito",
  "perbankan", "bank", "kredit", "pinjol", "pinjaman online", "fintech", "peer-to-peer",
  "p2p lending", "suku bunga", "bi-rate", "inflasi", "deflasi", "rupiah", "kurs",
  "valas", "devisa", "kripto", "cryptocurrency", "bitcoin", "aset digital",
  "likuiditas", "pailit", "pkpu", "gagal bayar", "restrukturisasi utang", "non-performing loan", "npl",
  "apbn", "pajak", "ppn", "pph", "pnbp", "tax amnesty", "resesi", "pertumbuhan ekonomi",
  "produk domestik bruto", "pdb", "gdp", "neraca perdagangan", "ekspor", "impor", "cukai"
];

const STOCK_TICKER_REGEX = /\b(ihsg|idx|bei|ojk|ksei|kpei|idclear|goto|bbca|bbri|bmri|bbni|tlkm|asii|buka|unvr|icbp|indf|ptba|adro|antm|inco|pgas|brpt|bren|ammn|medc|bumi|dewa|danantara)\b/i;

export const KNOWN_EMITEN_MAP: Record<string, { ticker: string; fullName: string }> = {
  aadi: { ticker: "AADI", fullName: "PT Adaro Andalan Indonesia Tbk" },
  adaro: { ticker: "ADRO", fullName: "PT Adaro Energy Indonesia Tbk" },
  adro: { ticker: "ADRO", fullName: "PT Adaro Energy Indonesia Tbk" },
  admr: { ticker: "ADMR", fullName: "PT Adaro Minerals Indonesia Tbk" },
  goto: { ticker: "GOTO", fullName: "PT GoTo Gojek Tokopedia Tbk" },
  gojek: { ticker: "GOTO", fullName: "PT GoTo Gojek Tokopedia Tbk" },
  tokopedia: { ticker: "GOTO", fullName: "PT GoTo Gojek Tokopedia Tbk" },
  bca: { ticker: "BBCA", fullName: "PT Bank Central Asia Tbk" },
  bbca: { ticker: "BBCA", fullName: "PT Bank Central Asia Tbk" },
  bri: { ticker: "BBRI", fullName: "PT Bank Rakyat Indonesia (Persero) Tbk" },
  bbri: { ticker: "BBRI", fullName: "PT Bank Rakyat Indonesia (Persero) Tbk" },
  mandiri: { ticker: "BMRI", fullName: "PT Bank Mandiri (Persero) Tbk" },
  bmri: { ticker: "BMRI", fullName: "PT Bank Mandiri (Persero) Tbk" },
  bni: { ticker: "BBNI", fullName: "PT Bank Negara Indonesia (Persero) Tbk" },
  bbni: { ticker: "BBNI", fullName: "PT Bank Negara Indonesia (Persero) Tbk" },
  telkom: { ticker: "TLKM", fullName: "PT Telkom Indonesia (Persero) Tbk" },
  tlkm: { ticker: "TLKM", fullName: "PT Telkom Indonesia (Persero) Tbk" },
  astra: { ticker: "ASII", fullName: "PT Astra International Tbk" },
  asii: { ticker: "ASII", fullName: "PT Astra International Tbk" },
  bukalapak: { ticker: "BUKA", fullName: "PT Bukalapak.com Tbk" },
  buka: { ticker: "BUKA", fullName: "PT Bukalapak.com Tbk" },
  unilever: { ticker: "UNVR", fullName: "PT Unilever Indonesia Tbk" },
  unvr: { ticker: "UNVR", fullName: "PT Unilever Indonesia Tbk" },
  indofood: { ticker: "INDF", fullName: "PT Indofood Sukses Makmur Tbk" },
  indf: { ticker: "INDF", fullName: "PT Indofood Sukses Makmur Tbk" },
  icbp: { ticker: "ICBP", fullName: "PT Indofood CBP Sukses Makmur Tbk" },
  antam: { ticker: "ANTM", fullName: "PT Aneka Tambang Tbk" },
  antm: { ticker: "ANTM", fullName: "PT Aneka Tambang Tbk" },
  bumi: { ticker: "BUMI", fullName: "PT Bumi Resources Tbk" },
  barito: { ticker: "BRPT", fullName: "PT Barito Pacific Tbk" },
  brpt: { ticker: "BRPT", fullName: "PT Barito Pacific Tbk" },
  bren: { ticker: "BREN", fullName: "PT Barito Renewables Energy Tbk" },
  cuan: { ticker: "CUAN", fullName: "PT Petrindo Jaya Kreasi Tbk" },
  ptro: { ticker: "PTRO", fullName: "PT Petrosea Tbk" },
  ammn: { ticker: "AMMN", fullName: "PT Amman Mineral Internasional Tbk" },
  medco: { ticker: "MEDC", fullName: "PT Medco Energi Internasional Tbk" },
  medc: { ticker: "MEDC", fullName: "PT Medco Energi Internasional Tbk" },
  dewa: { ticker: "DEWA", fullName: "PT Darma Henwa Tbk" },
  pgas: { ticker: "PGAS", fullName: "PT Perusahaan Gas Negara Tbk" },
  inco: { ticker: "INCO", fullName: "PT Vale Indonesia Tbk" },
  ptba: { ticker: "PTBA", fullName: "PT Bukit Asam Tbk" },
  kija: { ticker: "KIJA", fullName: "PT Kawasan Industri Jababeka Tbk" },
  bsde: { ticker: "BSDE", fullName: "PT Bumi Serpong Damai Tbk" },
  lpkr: { ticker: "LPKR", fullName: "PT Lippo Karawaci Tbk" },
  smgr: { ticker: "SMGR", fullName: "PT Semen Indonesia (Persero) Tbk" },
  inkp: { ticker: "INKP", fullName: "PT Indah Kiat Pulp & Paper Tbk" },
};

const INDO_COMMON_4_LETTER_WORDS = new Set([
  "YANG", "DARI", "PADA", "KAMI", "KITA", "BISA", "AKAN", "SAAT", "AGAR", "OLEH",
  "JUGA", "BAGI", "HARI", "TIDAK", "ATAU", "LALU", "BILA", "JIKA", "JADI", "KATA",
  "MAKA", "SAJA", "TENTANG", "KOTA", "DESA", "POST", "INFO", "NEWS", "LINK", "HTTP",
  "HTML", "LIVE", "USER", "DATA", "TEST", "TRUE", "FAKT", "HOAX", "CEK", "FOTO",
  "SUDAH", "BELUM", "KAMU", "SAYA", "MEREKA", "BAIK", "BARU", "LAMA", "DEPAN",
  "ATAS", "BAWAH", "DUA", "TIGA", "LIMA", "ENAM", "SATU", "LAGI", "DULU",
  "POKOK", "ANAK", "IBU", "AYAH", "UANG", "JAM", "MENIT", "DETIK", "TAHUN", "BULAN",
  "BMKG", "BNPB", "BPOM", "BPJS", "BRIN", "PPATK", "KPPU", "PSSI", "PBSI", "LPSK",
  "KPAI", "BAZNAS", "BKN", "DPRD", "KPU", "POLRI", "BSSN", "KPK", "TNI", "WIB",
  "WITA", "WIT", "DKI", "IKN", "JABAR", "JATIM", "JATENG", "SUMUT", "SUMBAR", "SULSEL",
  "PAPUA", "ACEH", "BALI", "NTT", "NTB"
]);

const STOCK_CONTEXT_REGEX = /\b(saham|emiten|dividen|pemilik|pemegang|pendiri|investor|bursa|bei|idx|ihsg|ipo|laba|rugi|akuisisi|merger|suspensi|buyback|lot|portofolio|sekuritas|broker|persen|rupiah|modal|investasi|holding)\b/i;

export function extractEmitenMention(text: string): { ticker: string; fullName: string } | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [key, data] of Object.entries(KNOWN_EMITEN_MAP)) {
    const regex = new RegExp(`\\b${key}\\b`, "i");
    if (regex.test(lower)) {
      return data;
    }
  }

  const prefixedMatch = text.match(/\b(?:saham|emiten|kode|pt)\s+([a-zA-Z]{4})\b/i);
  if (prefixedMatch && prefixedMatch[1]) {
    const ticker = prefixedMatch[1].toUpperCase();
    if (!INDO_COMMON_4_LETTER_WORDS.has(ticker)) {
      return { ticker, fullName: `Emiten ${ticker} (Bursa Efek Indonesia)` };
    }
  }

  if (STOCK_CONTEXT_REGEX.test(lower)) {
    const uppercaseTokens = text.match(/\b[A-Z]{4}\b/g);
    if (uppercaseTokens) {
      for (const token of uppercaseTokens) {
        if (!INDO_COMMON_4_LETTER_WORDS.has(token)) {
          return { ticker: token, fullName: `Emiten ${token} (Bursa Efek Indonesia)` };
        }
      }
    }
  }

  return null;
}

export function isEconomicTopic(text: string): boolean {
  if (!text) return false;
  if (extractEmitenMention(text) !== null) {
    return true;
  }
  const lower = text.toLowerCase();

  if (STOCK_TICKER_REGEX.test(lower)) {
    return true;
  }

  if (
    lower.includes("idx.co.id") ||
    lower.includes("ksei.co.id") ||
    lower.includes("idclear.co.id") ||
    lower.includes("ojk.go.id") ||
    lower.includes("cnbcindonesia.com") ||
    lower.includes("bisnis.com") ||
    lower.includes("kontan.co.id") ||
    lower.includes("bloombergtechnoz.com")
  ) {
    return true;
  }

  let count = 0;
  for (const kw of ECONOMIC_KEYWORDS) {
    if (kw.length <= 4) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(lower)) {
        if (["idx", "bei", "ksei", "kpei", "idclear", "ojk", "ihsg", "ipo", "sukuk", "goto", "buka"].includes(kw)) {
          return true;
        }
        count++;
      }
    } else {
      if (lower.includes(kw)) {
        if ([
          "saham", "emiten", "dividen", "reksadana", "obligasi", "bursa efek",
          "pasar modal", "otoritas jasa keuangan", "stock split", "pinjol",
          "pinjaman online", "suku bunga", "bi-rate", "sekuritas", "pemegang saham"
        ].includes(kw)) {
          return true;
        }
        count++;
      }
    }
    if (count >= 2) return true;
  }

  return false;
}

export function classifyTopic(text: string): TopicCategory {
  return isEconomicTopic(text) ? "ekonomi" : "umum";
}


export function extractSlugTitle(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    const pathname = decodeURIComponent(parsed.pathname);
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "";

    let slugCandidate = "";
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      const cleaned = seg.replace(/\.(html?|php|asp|htm)$/i, "");
      if (cleaned.length > 5 && /[a-zA-Z]/.test(cleaned) && !/^[0-9_-]+$/.test(cleaned)) {
        slugCandidate = cleaned;
        break;
      }
    }

    if (!slugCandidate && segments.length > 0) {
      slugCandidate = segments[segments.length - 1];
    }

    const cleanedSlug = slugCandidate
      .replace(/^[a-z]-[0-9]+-?/i, "")
      .replace(/^[0-9]{4}[/-][0-9]{2}[/-][0-9]{2}-?/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return cleanedSlug;
  } catch {
    return "";
  }
}


export function safeParseJsonFromLLM<T = any>(rawText: string): T {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Teks JSON kosong atau tidak valid.");
  }

  let text = rawText.trim();
  text = text.replace(/^```(?:json)?\s*/i, "");
  text = text.replace(/\s*```$/i, "");
  text = text.trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(text);
    return normalizeParsedPayload(parsed);
  } catch (initialErr) {
    const sanitized = text
      .replace(/,\s*([\]}])/g, "$1")
      .replace(/[\u0000-\u001F]+/g, (match) => {
        if (match === "\n" || match === "\r" || match === "\t") return match;
        return "";
      });

    try {
      const parsed = JSON.parse(sanitized);
      return normalizeParsedPayload(parsed);
    } catch {
      const extracted = fallbackRegexFieldExtraction(text);
      if (extracted) {
        return normalizeParsedPayload(extracted);
      }
      throw initialErr;
    }
  }
}

function normalizeParsedPayload(parsed: any): any {
  if (parsed && typeof parsed === "object") {
    if (typeof parsed.confidenceScore === "number") {
      if (parsed.confidenceScore > 0 && parsed.confidenceScore <= 1.0) {
        parsed.confidenceScore = Math.round(parsed.confidenceScore * 100);
      } else {
        parsed.confidenceScore = Math.max(0, Math.min(100, Math.round(parsed.confidenceScore)));
      }
    }

    if (!Array.isArray(parsed.ringkasanFakta)) {
      if (typeof parsed.ringkasanFakta === "string" && parsed.ringkasanFakta.trim()) {
        parsed.ringkasanFakta = [parsed.ringkasanFakta.trim()];
      } else {
        parsed.ringkasanFakta = [];
      }
    }

    if (typeof parsed.status === "string") {
      const upper = parsed.status.toUpperCase().trim();
      if (upper.includes("HOAX") || upper.includes("SALAH") || upper.includes("PALSU")) {
        parsed.status = "HOAX";
      } else if (upper.includes("FAKTA") || upper.includes("BENAR")) {
        parsed.status = "FAKTA";
      } else {
        parsed.status = "TIDAK_DAPAT_DIPASTIKAN";
      }
    }
  }
  return parsed;
}

function fallbackRegexFieldExtraction(text: string): any | null {
  try {
    const statusMatch = text.match(/"status"\s*:\s*"([^"]+)"/i);
    const statusVal = statusMatch ? statusMatch[1].toUpperCase() : "TIDAK_DAPAT_DIPASTIKAN";

    const scoreMatch = text.match(/"confidenceScore"\s*:\s*([0-9.]+)/i);
    let scoreVal = scoreMatch ? parseFloat(scoreMatch[1]) : 50;
    if (scoreVal <= 1.0) scoreVal = Math.round(scoreVal * 100);

    const alasanMatch = text.match(/"alasan"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const alasanVal = alasanMatch ? alasanMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : "";

    const factsMatch = text.match(/"ringkasanFakta"\s*:\s*\[([\s\S]*?)\]/);
    const ringkasanFakta: string[] = [];
    if (factsMatch && factsMatch[1]) {
      const itemRegex = /"((?:[^"\\]|\\.)*)"/g;
      let m: RegExpExecArray | null;
      while ((m = itemRegex.exec(factsMatch[1])) !== null) {
        if (m[1].trim()) {
          ringkasanFakta.push(m[1].replace(/\\"/g, '"').replace(/\\n/g, ' '));
        }
      }
    }

    if (alasanVal && alasanVal.length >= 10) {
      return {
        status: ["FAKTA", "HOAX"].includes(statusVal) ? statusVal : "TIDAK_DAPAT_DIPASTIKAN",
        confidenceScore: scoreVal,
        alasan: alasanVal,
        ringkasanFakta,
      };
    }
  } catch {
  }
  return null;
}

