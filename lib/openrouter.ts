import { verificationResultSchema, VerificationResultPayload } from "@/lib/schemas";
import { safeParseJsonFromLLM, domainTier } from "@/lib/utils";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export interface AIProviderConfig {
  openrouterApiKey?: string;
  openrouterModel?: string;
  groqApiKey?: string;
  groqModel?: string;
}

interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function isRetryableError(error: unknown, status?: number): boolean {
  if (status && (status >= 500 || status === 429)) {
    return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("timeout") || msg.includes("abort") || msg.includes("fetch failed");
  }
  return false;
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  jsonFormat: boolean = false
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": "https://saringopini.id",
    "X-Title": "Saring Opini",
  };

  const bodyPayload: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.1,
  };

  if (jsonFormat) {
    bodyPayload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    console.log(`[OpenRouter] Calling (model: ${model}, json: ${jsonFormat})...`);
    const t0 = performance.now();
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const duration = (performance.now() - t0).toFixed(0);
    console.log(`[OpenRouter] HTTP Status: ${response.status} (${duration}ms)`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
          reasoning?: string;
        };
      }>;
    };

    const messageObj = data.choices?.[0]?.message;
    let content = messageObj?.content;

    if (!content || !content.trim()) {
      if (messageObj?.reasoning && messageObj.reasoning.includes("{") && messageObj.reasoning.includes("}")) {
        console.warn("[OpenRouter] Main content was empty, using reasoning payload...");
        content = messageObj.reasoning;
      } else {
        throw new Error("OpenRouter mengembalikan respon kosong.");
      }
    }

    return content;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function callGroq(
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  jsonFormat: boolean = false
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const bodyPayload: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.1,
  };

  if (jsonFormat) {
    bodyPayload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    console.log(`[Groq] Calling (model: ${model}, json: ${jsonFormat})...`);
    const t0 = performance.now();
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const duration = (performance.now() - t0).toFixed(0);
    console.log(`[Groq] HTTP Status: ${response.status} (${duration}ms)`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Groq error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      throw new Error("Groq mengembalikan respon kosong.");
    }

    return content;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function callAIWithFallback(
  config: AIProviderConfig,
  messages: LLMMessage[],
  jsonFormat: boolean = false
): Promise<string> {
  const providers: Array<{ name: string; run: () => Promise<string> }> = [];

  // Primary: OpenRouter if configured
  if (config.openrouterApiKey) {
    providers.push({
      name: `OpenRouter (${config.openrouterModel || "default"})`,
      run: () => callOpenRouter(config.openrouterApiKey!, config.openrouterModel || "google/gemini-2.5-flash", messages, jsonFormat),
    });
  }

  // Fallback / Alternative: Groq if configured
  if (config.groqApiKey) {
    providers.push({
      name: `Groq (${config.groqModel || "llama-3.3-70b-versatile"})`,
      run: () => callGroq(config.groqApiKey!, config.groqModel || "llama-3.3-70b-versatile", messages, jsonFormat),
    });
  }

  if (providers.length === 0) {
    throw new Error("Tidak ada API key AI (OPENROUTER_API_KEY atau GROQ_API_KEY) yang terkonfigurasi di environment.");
  }

  let lastError: Error | null = null;

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      console.log(`[AI Pipeline] Attempting provider ${i + 1}/${providers.length}: ${provider.name}...`);
      return await provider.run();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[AI Pipeline] Provider ${provider.name} failed: ${lastError.message}`);
      if (i < providers.length - 1) {
        console.log(`[AI Pipeline] Switching to fallback provider: ${providers[i + 1].name}...`);
      }
    }
  }

  throw lastError || new Error("Semua provider AI (OpenRouter & Groq) gagal merespons.");
}


export interface ArticleEntities {
  event: string;
  location: string;
  people: string[];
  organizations: string[];
  numbers: string[];
  dates: string[];
  queryA: string; // Most specific event query
  queryB: string; // Entity-focused query
  queryC: string; // Location-focused query
}

export async function extractArticleEntities(
  articleText: string,
  articleTitle: string,
  config: AIProviderConfig | string,
  modelFallback?: string
): Promise<ArticleEntities> {
  const providerConfig: AIProviderConfig = typeof config === "string" 
    ? { openrouterApiKey: config, openrouterModel: modelFallback } 
    : config;

  console.log(`[AI Pipeline] Model (OpenRouter: ${providerConfig.openrouterModel || 'default'}, Groq: ${providerConfig.groqModel || 'default'})`);
  console.log(`[START] Entity Extraction for URL (title: "${articleTitle.slice(0, 50)}...")`);
  const t0 = performance.now();

  const systemPrompt = `Anda adalah asisten AI ekstraktor entitas kejadian berita untuk cross-checking fact-checking Indonesia (Saring Opini).
Tugas Anda:
1. Baca judul dan isi artikel berikut.
2. Identifikasi dan ekstrak entitas kunci kejadian:
   - event: nama peristiwa faktual inti dalam Bahasa Indonesia
   - location: nama kota/kabupaten spesifik (Contoh: "Pati", "Jayawijaya", "Sragen", "Agam"). JANGAN masukkan kalimat panjang.
   - people: pelaku dan korban inti (tanpa kata sifat sensasional)
   - organizations: instansi resmi, sekolah, atau lembaga (contoh: "KKB", "Dinas Kesehatan", "Polres")
   - numbers: angka/statistik signifikan (misal: "269 siswa")
   - dates: waktu/tanggal kejadian jika ada
3. ATURAN GENERASI KUERI PENCARIAN (PRIORITAS MEDIA UTAMA):
   - queryA (Peristiwa Inti + Lokasi + Entitas Kunci): Buat query pencarian yang menggabungkan peristiwa + LOKASI SPESIFIK + angka/entitas unik. PRIORITASKAN kueri yang memunculkan hasil dari media arus utama terpercaya (contoh: CNN Indonesia, Kompas, Detik, Tempo, Antara News, Metro TV, Bloomberg Technoz, Liputan6, Tribunnews, Republika, Media Indonesia, BBC Indonesia). Hindari kata kunci generik.
   - queryB (Kombinasi Instansi/Pelaku + Peristiwa + Lokasi)
   - queryC (Laporan Resmi / Tindak Lanjut + Daerah)
   - Format: 4-8 kata kunci jurnalistik padat.

Output WAJIB berupa JSON valid:
{
  "event": string,
  "location": string,
  "people": string[],
  "organizations": string[],
  "numbers": string[],
  "dates": string[],
  "queryA": string,
  "queryB": string,
  "queryC": string
}`;

  const userPrompt = `JUDUL ARTIKEL: ${articleTitle}\nISI ARTIKEL:\n"""\n${articleText.slice(0, 2800)}\n"""`;

  try {
    const rawJson = await callAIWithFallback(
      providerConfig,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      true
    );

    const cleaned = rawJson.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned) as ArticleEntities;

    const duration = (performance.now() - t0).toFixed(0);
    console.log(`[END] Entity Extraction - Event: "${parsed.event || 'N/A'}", Loc: "${parsed.location || 'N/A'}" (${duration}ms)`);
    console.log(`[Queries Generated] A: "${parsed.queryA}", B: "${parsed.queryB}", C: "${parsed.queryC}"`);

    const safeTitle = (articleTitle && articleTitle !== "Artikel Berita" && articleTitle !== "Artikel Berita Pembanding") 
      ? articleTitle 
      : (articleText.slice(0, 100).trim() || "Peristiwa Berita");

    const defaultQueryA = `${parsed.event || safeTitle} ${parsed.location || ""}`.trim();

    return {
      event: parsed.event || safeTitle,
      location: parsed.location || "",
      people: Array.isArray(parsed.people) ? parsed.people : [],
      organizations: Array.isArray(parsed.organizations) ? parsed.organizations : [],
      numbers: Array.isArray(parsed.numbers) ? parsed.numbers : [],
      dates: Array.isArray(parsed.dates) ? parsed.dates : [],
      queryA: parsed.queryA && parsed.queryA !== "Artikel Berita" ? parsed.queryA : defaultQueryA,
      queryB: parsed.queryB && parsed.queryB !== "Artikel Berita" ? parsed.queryB : (parsed.queryA || defaultQueryA),
      queryC: parsed.queryC && parsed.queryC !== "Artikel Berita" ? parsed.queryC : (parsed.queryA || defaultQueryA),
    };
  } catch (err) {
    const duration = (performance.now() - t0).toFixed(0);
    console.warn(`[END] Entity Extraction - Fallback used (${duration}ms):`, err instanceof Error ? err.message : err);
    
    const safeTitle = (articleTitle && articleTitle !== "Artikel Berita" && articleTitle !== "Artikel Berita Pembanding") 
      ? articleTitle 
      : (articleText.slice(0, 100).trim() || "Peristiwa Berita");

    return {
      event: safeTitle,
      location: "",
      people: [],
      organizations: [],
      numbers: [],
      dates: [],
      queryA: safeTitle,
      queryB: safeTitle,
      queryC: safeTitle,
    };
  }
}

export async function extractSearchQuery(
  rawText: string,
  config: AIProviderConfig | string,
  modelFallback?: string
): Promise<string> {
  const providerConfig: AIProviderConfig = typeof config === "string" 
    ? { openrouterApiKey: config, openrouterModel: modelFallback } 
    : config;

  console.log(`[AI Pipeline] Query Extraction (OpenRouter: ${providerConfig.openrouterModel || 'default'}, Groq: ${providerConfig.groqModel || 'default'})`);
  console.log(`[START] Query Extraction (rawText length: ${rawText.length})`);
  const t0 = performance.now();

  const systemPrompt = `Anda adalah asisten AI ekstraktor kata kunci pencarian berita untuk fact-checking cross-checking Indonesia.
Tugas Anda:
1. Baca teks/klaim berikut.
2. Identifikasi topik spesifik, LOKASI/KOTA spesifik jika ada, dan entitas utama.
3. Ekstrak inti klaim menjadi 1 kalimat query pencarian Google/berita yang netral, padat, dan efektif dalam Bahasa Indonesia.
   PRIORITASKAN query yang akan memunculkan hasil dari media arus utama terpercaya (contoh: CNN Indonesia, Kompas, Detik, Tempo, Antara News, Metro TV, Bloomberg Technoz, Liputan6, Tribunnews, Republika, Media Indonesia, BBC Indonesia).
   Hindari kata kunci generik yang memunculkan blog pribadi atau forum.
4. Hapus kata-kata ajakan klik ("klik link ini", "bagikan ke 5 grup", "ketik amin").
5. JANGAN tambahkan penjelasan apapun, HANYA kembalikan teks query pencarian saja.`;

  const userPrompt = `Teks klaim:\n"""\n${rawText.slice(0, 3000)}\n"""`;

  const query = await callAIWithFallback(
    providerConfig,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    false
  );

  const cleanedQuery = query.replace(/^["']|["']$/g, "").trim();
  const duration = (performance.now() - t0).toFixed(0);
  console.log(`[END] Query Extraction - Result: "${cleanedQuery}" (${duration}ms)`);

  return cleanedQuery;
}

export async function analyzeFactClaim(
  originalClaim: string,
  scrapedArticles: Array<{ title: string; url: string; domain: string; content: string }>,
  config: AIProviderConfig | string,
  modelFallback?: string
): Promise<VerificationResultPayload> {
  const providerConfig: AIProviderConfig = typeof config === "string" 
    ? { openrouterApiKey: config, openrouterModel: modelFallback } 
    : config;

  console.log(`[AI Pipeline] Analysis (OpenRouter: ${providerConfig.openrouterModel || 'default'}, Groq: ${providerConfig.groqModel || 'default'})`);
  console.log(`[START] Fact Analysis (articles count: ${scrapedArticles.length})`);
  const t0 = performance.now();

  const systemPrompt = `You are an elite, highly objective Indonesian fact verification system (Saring Opini).

PRIMARY OBJECTIVE:
Determine whether the provided "KLAIM PENGGUNA" is supported by credible evidence referring strictly to the SAME EVENT.

SOURCE CREDIBILITY TIERS (apply BEFORE same-event rules):
- TIER 1 (Highest trust): CNN Indonesia, Kompas.com, Detik.com, Tempo.co, Antara News, Metro TV News, Bloomberg Technoz/Bloomberg Indonesia, Liputan6, Tribunnews, Republika, Media Indonesia, BBC Indonesia, Reuters Indonesia, official government (.go.id) domains.
- TIER 2 (Moderate trust): other established regional/national news outlets not listed above.
- TIER 3 (Low trust / DO NOT USE for FAKTA or HOAX verdicts): blogs, forums, unverified aggregator sites, social media reposts, sites with no clear editorial identity.
- If ALL available sources are Tier 3, return "TIDAK_DAPAT_DIPASTIKAN" regardless of how many sources agree.
- If Tier 1/2 sources conflict with Tier 3 sources, DISREGARD the Tier 3 sources entirely.
- confidenceScore should be capped lower (max ~50) when the best available source is only Tier 2, and further capped (max ~20) if any Tier 3 source is mixed in.

CRITICAL SAME-EVENT CORROBORATION RULES:
1. SAME TOPIC DOES NOT EQUAL SAME EVENT:
   - Do NOT use or corroborate sources merely because they share general keywords (e.g. "keracunan MBG", "kebakaran", "demonstrasi").
   - You MUST verify that the evidence matches the EXACT SAME EVENT:
     ✅ Same Location (City/Regency/Province)
     ✅ Same Incident & Victims/Entities
     ✅ Same Date Range & Organization involved
2. STRICT REJECTION OF UNRELATED INCIDENTS:
   - REJECT and DISREGARD sources from a different city, different province, different school/institution, different victim count, or different incident timeline.
3. MINIMUM SOURCE THRESHOLD:
   - If fewer than 2 reliable, matching Tier 1/Tier 2 sources exist that confirm the same specific event:
     Return status: "TIDAK_DAPAT_DIPASTIKAN" with a clear analytical explanation stating that evidence for this specific event is insufficient, rather than making assumptions.
4. STATUS DEFINITIONS & RINGKASAN FAKTA RULES:
   - "FAKTA": If credible Tier 1/2 official news articles explicitly confirm the truth of this specific event. (ringkasanFakta must contain 1-3 confirmed key facts).
   - "HOAX": If official sources debunk the claim, expose it as a fabrication/scam, or prove it false. (ringkasanFakta must contain supporting debunking findings).
   - "TIDAK_DAPAT_DIPASTIKAN": If evidence is conflicting, insufficient, or from unrelated regions.
     IMPORTANT FOR TIDAK_DAPAT_DIPASTIKAN:
     - DO NOT invent facts.
     - DO NOT fabricate evidence.
     - Return "ringkasanFakta": [] (empty array) when no reliable verified facts can be extracted.
5. CONFIDENCE SCORE (0-100):
   - Integer between 0 and 100 (e.g. 95, NOT 0.95).

OUTPUT FORMAT REQUIREMENTS:
- Return ONLY a valid, parseable JSON object matching this exact schema:
{
  "status": "FAKTA" | "HOAX" | "TIDAK_DAPAT_DIPASTIKAN",
  "confidenceScore": number,
  "alasan": string,
  "ringkasanFakta": string[]
}
- Do NOT include markdown formatting, code fences (\`\`\`json), or conversational text outside the JSON.`;

  const articlesContext = scrapedArticles
    .map((art, i) => {
      const tier = domainTier(art.url);
      return `--- SUMBER ${i + 1} [TIER ${tier}]: ${art.title} (${art.domain}) ---\nURL: ${art.url}\nIsi:\n${art.content.slice(0, 2500)}\n`;
    })
    .join("\n\n");

  const userPrompt = `KLAIM PENGGUNA:\n"""\n${originalClaim}\n"""\n\nARTIKEL BERITA PEMBANDING DENGAN LABEL TIER KREDIBILITAS:\n${articlesContext}\n\nEvaluasi kecocokan kejadian spesifik (lokasi, entitas, insiden) dan bobot kredibilitas TIER sumber. Kembalikan HANYA JSON.`;

  const rawJson = await callAIWithFallback(
    providerConfig,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    true
  );

  try {
    const parsed = safeParseJsonFromLLM(rawJson);

    const payloadWithSources = {
      ...parsed,
      sources: scrapedArticles.map((art) => ({
        title: art.title,
        url: art.url,
        domain: art.domain,
      })),
    };

    const validatedResult = verificationResultSchema.safeParse(payloadWithSources);

    if (!validatedResult.success) {
      console.error(`[MALFORMED SCHEMA ERROR] Schema validation failed:`, validatedResult.error.format());
      throw new Error(`Validasi schema LLM gagal: ${validatedResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`);
    }

    const duration = (performance.now() - t0).toFixed(0);
    console.log(`[END] Fact Analysis - Decision: ${validatedResult.data.status} (Score: ${validatedResult.data.confidenceScore}%, ${duration}ms)`);

    return validatedResult.data;
  } catch (err) {
    const duration = (performance.now() - t0).toFixed(0);
    console.error(`[CRITICAL JSON PARSE / VALIDATION FAILURE] (${duration}ms)`, err);
    throw new Error(`Gagal memvalidasi output analisis AI: ${err instanceof Error ? err.message : String(err)}`);
  }
}


