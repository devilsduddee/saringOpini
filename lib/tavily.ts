import { z } from "zod";
import { extractDomain, ECONOMIC_OFFICIAL_DOMAINS, ECONOMIC_MEDIA_DOMAINS, TopicCategory } from "@/lib/utils";

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

const tavilyResponseSchema = z.object({
  results: z.array(
    z.object({
      title: z.string(),
      url: z.string().url(),
      content: z.string().default(""),
      score: z.number().optional(),
    })
  ),
});

export interface SearchArticleItem {
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

export interface SearchNewsOptions {
  category?: TopicCategory;
  customDomains?: string[];
  strictCustomDomainsOnly?: boolean;
}

export const STANDARD_NEWS_DOMAINS = [
  "detik.com",
  "kompas.com",
  "tempo.co",
  "antaranews.com",
  "cnnindonesia.com",
  "liputan6.com",
  "turnbackhoax.id",
  "kominfo.go.id",
  "republika.co.id",
  "tribunnews.com",
  "kumparan.com",
  "metrotvnews.com",
  "bloombergtechnoz.com",
  "mediaindonesia.com",
  "bbc.com",
  "reuters.com",
];

async function fetchTavilyWithTimeout(
  payload: Record<string, unknown>,
  timeoutMs: number = 7000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[TIMEOUT] Tavily fetch timed out after ${timeoutMs}ms`);
    controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch(TAVILY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function searchNewsArticles(
  query: string,
  apiKey: string,
  maxResults: number = 3,
  options?: SearchNewsOptions
): Promise<SearchArticleItem[]> {
  const isEconomic = options?.category === "ekonomi";
  console.log(`[START] Tavily Search (query: "${query.slice(0, 60)}...", category: ${options?.category || 'umum'}, maxResults: ${maxResults})`);
  const t0 = performance.now();

  const targetDomains = options?.strictCustomDomainsOnly && options?.customDomains && options.customDomains.length > 0
    ? options.customDomains
    : isEconomic
    ? Array.from(new Set([
        ...ECONOMIC_OFFICIAL_DOMAINS,
        "detik.com",
        "kompas.com",
        "tempo.co",
        "antaranews.com",
        "cnnindonesia.com",
        "turnbackhoax.id",
        "republika.co.id",
        ...(options?.customDomains || []),
      ]))
    : Array.from(new Set([...STANDARD_NEWS_DOMAINS, ...(options?.customDomains || [])]));

  const strictPayload = {
    api_key: apiKey,
    query,
    search_depth: "basic",
    include_domains: targetDomains,
    max_results: maxResults,
  };

  const openPayload = {
    api_key: apiKey,
    query,
    search_depth: "basic",
    max_results: maxResults,
  };

  try {
    console.log(`[Tavily] Attempt 1: Strict Indonesian news domains search...`);
    const response = await fetchTavilyWithTimeout(strictPayload, 7000);
    console.log(`[Tavily] Attempt 1 HTTP Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const json = await response.json();
      const parsed = tavilyResponseSchema.safeParse(json);
      if (parsed.success && parsed.data.results.length > 0) {
        const duration = (performance.now() - t0).toFixed(0);
        console.log(`[END] Tavily Search - Found ${parsed.data.results.length} articles (${duration}ms)`);
        return parsed.data.results.map((r) => ({
          title: r.title,
          url: r.url,
          domain: extractDomain(r.url),
          snippet: r.content,
        }));
      } else {
        console.warn(`[Tavily] Attempt 1 returned 0 results. Proceeding to fallback open search.`);
      }
    } else {
      const errBody = await response.text().catch(() => "");
      console.warn(`[Tavily] Attempt 1 returned non-OK status ${response.status}: ${errBody}`);
    }
  } catch (err) {
    console.warn(`[Tavily] Attempt 1 error: ${err instanceof Error ? err.message : String(err)}. Falling back to open search...`);
  }

  try {
    console.log(`[Tavily] Attempt 2: Open search fallback...`);
    const fallbackResponse = await fetchTavilyWithTimeout(openPayload, 7000);
    console.log(`[Tavily] Attempt 2 HTTP Status: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
    
    if (!fallbackResponse.ok) {
      const errBody = await fallbackResponse.text().catch(() => "");
      throw new Error(`Tavily fallback HTTP error (${fallbackResponse.status}): ${errBody}`);
    }

    const fallbackJson = await fallbackResponse.json();
    const parsedFallback = tavilyResponseSchema.safeParse(fallbackJson);

    if (!parsedFallback.success) {
      throw new Error("Format respon Tavily tidak sesuai schema");
    }

    const duration = (performance.now() - t0).toFixed(0);
    console.log(`[END] Tavily Search - Fallback found ${parsedFallback.data.results.length} articles (${duration}ms)`);

    return parsedFallback.data.results.map((r) => ({
      title: r.title,
      url: r.url,
      domain: extractDomain(r.url),
      snippet: r.content,
    }));
  } catch (err) {
    const duration = (performance.now() - t0).toFixed(0);
    console.error(`[END] Tavily Search - FAILED (${duration}ms): ${err instanceof Error ? err.message : String(err)}`);
    throw new Error(
      `Gagal melakukan pencarian berita Tavily setelah retry: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

export async function recoverUrlMetadataViaTavily(
  url: string,
  apiKey: string
): Promise<{ title: string; snippet: string } | null> {
  console.log(`[START] Tavily URL Metadata Recovery (url: ${url})`);
  const t0 = performance.now();

  try {
    const payload = {
      api_key: apiKey,
      query: url,
      search_depth: "basic",
      max_results: 3,
    };

    const response = await fetchTavilyWithTimeout(payload, 5000);
    if (!response.ok) return null;

    const json = await response.json();
    const parsed = tavilyResponseSchema.safeParse(json);
    if (!parsed.success || parsed.data.results.length === 0) return null;

    const match = parsed.data.results.find((r) => r.url.includes(url) || url.includes(r.url)) || parsed.data.results[0];
    const duration = (performance.now() - t0).toFixed(0);
    console.log(`[END] Tavily URL Metadata Recovery - Success (${duration}ms, title: "${match.title.slice(0, 50)}...")`);

    return {
      title: match.title,
      snippet: match.content,
    };
  } catch (err) {
    console.warn(`[Tavily] URL metadata recovery failed for ${url}:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

