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

export function domainTier(url: string): 1 | 2 | 3 {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host.endsWith(".go.id") || TRUSTED_DOMAINS_TIER1.some((d) => host === d || host.endsWith(`.${d}`))) {
      return 1;
    }
    // Tier 2: established regional/national news domains or standard news portals
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


/**
 * Extracts a readable headline/title candidate from a URL path or slug.
 * Handles common news URL patterns (e.g. /berita/d-8064950/ini-susunan-acara-proklamasi-kemerdekaan-17-agustus-1945)
 */
export function extractSlugTitle(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    const pathname = decodeURIComponent(parsed.pathname);
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "";

    // Find the longest segment or the last meaningful segment
    let slugCandidate = "";
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      // Skip IDs, file extensions, numeric IDs, or short tags (e.g. 'd-8064950', 'index.html', 'read')
      const cleaned = seg.replace(/\.(html?|php|asp|htm)$/i, "");
      if (cleaned.length > 5 && /[a-zA-Z]/.test(cleaned) && !/^[0-9_-]+$/.test(cleaned)) {
        slugCandidate = cleaned;
        break;
      }
    }

    if (!slugCandidate && segments.length > 0) {
      slugCandidate = segments[segments.length - 1];
    }

    // Clean up slug: remove leading id prefixes like "d-123456-" or date prefixes "2024-05-12-"
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


/**
 * Robust JSON extraction and repair for LLM responses
 * Handles:
 * 1. Markdown code fences (```json ... ``` or ``` ...)
 * 2. Unescaped trailing text or preamble
 * 3. Trailing commas before } or ]
 * 4. Control characters within string literals
 * 5. Decimal confidence scores (e.g. 0.96 -> 96)
 * 6. Regex fallback for field recovery
 */
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
    // Attempt repairs on common LLM syntax issues (trailing commas, control chars)
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
    // Normalize confidenceScore from float (0.0-1.0) to integer (0-100) if needed
    if (typeof parsed.confidenceScore === "number") {
      if (parsed.confidenceScore > 0 && parsed.confidenceScore <= 1.0) {
        parsed.confidenceScore = Math.round(parsed.confidenceScore * 100);
      } else {
        parsed.confidenceScore = Math.max(0, Math.min(100, Math.round(parsed.confidenceScore)));
      }
    }

    // Ensure ringkasanFakta is an array
    if (!Array.isArray(parsed.ringkasanFakta)) {
      if (typeof parsed.ringkasanFakta === "string" && parsed.ringkasanFakta.trim()) {
        parsed.ringkasanFakta = [parsed.ringkasanFakta.trim()];
      } else {
        parsed.ringkasanFakta = [];
      }
    }

    // Normalize status enum string
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
    // ignore
  }
  return null;
}

