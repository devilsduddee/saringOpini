export async function scrapeCleanArticle(
  url: string,
  apiKey?: string,
  maxRetries: number = 0
): Promise<{ title: string; content: string }> {
  console.log(`[START] Jina Scraping (url: ${url})`);
  const t0 = performance.now();
  const targetUrl = `https://r.jina.ai/${url}`;

  const headers: Record<string, string> = {
    "X-No-Cache": "true",
    "X-Return-Format": "markdown",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[TIMEOUT] Jina Scraping timed out after 7500ms for ${url}`);
      controller.abort();
    }, 7500);

    try {
      console.log(`[Jina] Fetching attempt ${attempt + 1}/${maxRetries + 1}...`);
      const response = await fetch(targetUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[Jina] HTTP Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`Jina Reader HTTP error ${response.status}`);
      }

      const rawMarkdown = await response.text();

      const lines = rawMarkdown.split("\n");
      let title = "Artikel Berita Pembanding";

      for (const line of lines) {
        if (line.startsWith("# ")) {
          title = line.replace(/^#\s+/, "").trim();
          break;
        }
      }

      const sanitizedContent = rawMarkdown
        .replace(/!\[.*?\]\(.*?\)/g, "")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1")
        .slice(0, 4000);

      const duration = (performance.now() - t0).toFixed(0);
      console.log(`[END] Jina Scraping - Success (${duration}ms, title: "${title.slice(0, 40)}...", chars: ${sanitizedContent.length})`);

      return {
        title,
        content: sanitizedContent || rawMarkdown.slice(0, 3000),
      };
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`[Jina] Attempt ${attempt + 1} failed: ${err instanceof Error ? err.message : String(err)}`);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  const duration = (performance.now() - t0).toFixed(0);
  console.warn(`[END] Jina Scraping - Fast fallback used (${duration}ms) for ${url}`);

  return {
    title: "Artikel Berita",
    content: "",
  };
}
