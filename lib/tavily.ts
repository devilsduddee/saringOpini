import { z } from "zod";
import { extractDomain } from "@/lib/utils";

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
  maxResults: number = 3
): Promise<SearchArticleItem[]> {
  console.log(`[START] Tavily Search (query: "${query.slice(0, 60)}...", maxResults: ${maxResults})`);
  const t0 = performance.now();

  const strictPayload = {
    api_key: apiKey,
    query: `${query} berita cek fakta indonesia`,
    search_depth: "basic",
    include_domains: [
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
    ],
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
