import { verificationResultSchema, VerificationResultPayload } from "@/lib/schemas";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterMessage {
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

async function callOpenRouterWithRetry(
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[],
  jsonFormat: boolean = false,
  maxRetries: number = 1
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

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[TIMEOUT] OpenRouter API call timed out after 13000ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      controller.abort();
    }, 13000);

    let currentStatus: number | undefined;

    try {
      console.log(`[OpenRouter] Sending request (model: ${model}, attempt: ${attempt + 1}/${maxRetries + 1}, jsonFormat: ${jsonFormat})...`);
      const t0 = performance.now();
      const response = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      currentStatus = response.status;
      const duration = (performance.now() - t0).toFixed(0);
      console.log(`[OpenRouter] Response HTTP Status: ${response.status} ${response.statusText} (${duration}ms)`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error(`[OpenRouter] Error Body:`, errorText);
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("OpenRouter mengembalikan respon kosong.");
      }

      return content;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[OpenRouter] Attempt ${attempt + 1} failed: ${lastError.message}`);

      const shouldRetry = isRetryableError(err, currentStatus);

      if (attempt < maxRetries && shouldRetry) {
        const delay = 800;
        console.log(`[OpenRouter] Retrying in ${delay}ms due to transient error/timeout...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else if (!shouldRetry) {
        console.warn(`[OpenRouter] Non-retryable error (status: ${currentStatus || 'N/A'}). Failing immediately.`);
        break;
      }
    }
  }

  throw lastError || new Error("Gagal menghubungi OpenRouter setelah beberapa kali percobaan.");
}

export interface ArticleEntities {
  title: string;
  location?: string;
  organization?: string;
  date?: string;
  keyEntities: string[];
  searchQuery: string;
}

export async function extractArticleEntities(
  articleText: string,
  articleTitle: string,
  apiKey: string,
  model: string
): Promise<ArticleEntities> {
  console.log(`[OpenRouter] Model: ${model}`);
  console.log(`[START] Entity Extraction for URL (title: "${articleTitle.slice(0, 50)}...")`);
  const t0 = performance.now();

  const systemPrompt = `Anda adalah asisten AI ekstraktor entitas kejadian berita untuk cross-checking fact-checking Indonesia.
Tugas Anda:
1. Baca judul dan ringkasan artikel berikut.
2. Identifikasi dan ekstrak entitas kunci kejadian:
   - title: judul inti
   - location: kota/kabupaten/daerah spesifik kejadian (misal: "Pati", "Sragen", "Agam", "Surabaya")
   - organization: instansi/sekolah/lembaga terlibat jika ada
   - date: estimasi waktu/tanggal kejadian jika ada
   - keyEntities: 3-5 kata kunci unik spesifik peristiwa (nama tempat, angka korban/siswa, instansi)
   - searchQuery: Buat 1 query pencarian spesifik yang menggabungkan peristiwa + LOKASI SPESIFIK + angka/entitas unik (misal: "keracunan MBG Pati 269 siswa" BUKAN hanya "keracunan MBG").

Output WAJIB berupa JSON:
{
  "title": string,
  "location": string,
  "organization": string,
  "date": string,
  "keyEntities": string[],
  "searchQuery": string
}`;

  const userPrompt = `JUDUL ARTIKEL: ${articleTitle}\nISI ARTIKEL:\n"""\n${articleText.slice(0, 2500)}\n"""`;

  try {
    const rawJson = await callOpenRouterWithRetry(
      apiKey,
      model,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      true,
      1
    );

    const cleaned = rawJson.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned) as ArticleEntities;

    const duration = (performance.now() - t0).toFixed(0);
    console.log(`[END] Entity Extraction - Location: "${parsed.location || 'N/A'}", Entities: [${(parsed.keyEntities || []).join(', ')}], Query: "${parsed.searchQuery}" (${duration}ms)`);

    return {
      title: parsed.title || articleTitle,
      location: parsed.location || "",
      organization: parsed.organization || "",
      date: parsed.date || "",
      keyEntities: Array.isArray(parsed.keyEntities) ? parsed.keyEntities : [],
      searchQuery: parsed.searchQuery || `${articleTitle} ${parsed.location || ''}`.trim(),
    };
  } catch (err) {
    const duration = (performance.now() - t0).toFixed(0);
    console.warn(`[END] Entity Extraction - Fallback used (${duration}ms):`, err instanceof Error ? err.message : err);
    return {
      title: articleTitle,
      location: "",
      organization: "",
      date: "",
      keyEntities: [],
      searchQuery: articleTitle,
    };
  }
}

export async function extractSearchQuery(
  rawText: string,
  apiKey: string,
  model: string
): Promise<string> {
  console.log(`[OpenRouter] Model: ${model}`);
  console.log(`[START] Query Extraction (rawText length: ${rawText.length})`);
  const t0 = performance.now();

  const systemPrompt = `Anda adalah asisten AI ekstraktor kata kunci pencarian berita untuk fact-checking.
Tugas Anda:
1. Baca teks/klaim berikut.
2. Identifikasi topik spesifik, LOKASI/KOTA spesifik jika ada, dan entitas utama.
3. Ekstrak inti klaim menjadi 1 kalimat query pencarian Google/berita yang netral, padat, dan efektif dalam Bahasa Indonesia. Sertakan nama kota/daerah jika teks menyebutkan tempat spesifik.
4. Hapus kata-kata ajakan klik ("klik link ini", "bagikan ke 5 grup", "ketik amin").
5. JANGAN tambahkan penjelasan apapun, HANYA kembalikan teks query pencarian saja.`;

  const userPrompt = `Teks klaim:\n"""\n${rawText.slice(0, 3000)}\n"""`;

  const query = await callOpenRouterWithRetry(
    apiKey,
    model,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    false,
    1
  );

  const cleanedQuery = query.replace(/^["']|["']$/g, "").trim();
  const duration = (performance.now() - t0).toFixed(0);
  console.log(`[END] Query Extraction - Result: "${cleanedQuery}" (${duration}ms)`);

  return cleanedQuery;
}

export async function analyzeFactClaim(
  originalClaim: string,
  scrapedArticles: Array<{ title: string; url: string; domain: string; content: string }>,
  apiKey: string,
  model: string
): Promise<VerificationResultPayload> {
  console.log(`[OpenRouter] Model: ${model}`);
  console.log(`[START] OpenRouter Analysis (articles count: ${scrapedArticles.length})`);
  const t0 = performance.now();

  const systemPrompt = `You are an elite, highly objective Indonesian fact verification system (Saring Opini).

PRIMARY OBJECTIVE:
Determine whether the provided "KLAIM PENGGUNA" is supported by credible evidence referring strictly to the SAME EVENT.

CRITICAL SAME-EVENT CORROBORATION RULES:
1. SAME TOPIC DOES NOT EQUAL SAME EVENT:
   - Do NOT use or corroborate sources merely because they share general keywords (e.g. "keracunan MBG", "kebakaran", "demonstrasi").
   - You MUST verify that the evidence matches the EXACT SAME EVENT:
     ✅ Same Location (City/Regency/Province)
     ✅ Same Incident & Victims/Entities
     ✅ Same Date Range & Organization involved
2. STRICT REJECTION OF UNRELATED INCIDENTS:
   - REJECT and DISREGARD sources from a different city, different province, different school/institution, different victim count, or different incident timeline.
   - Example: If the claim is about "Keracunan MBG di Pati", sources reporting "Keracunan MBG di Agam" or "Sragen" are UNRELATED INCIDENTS and must NOT be used to prove or disprove the Pati incident.
3. MINIMUM SOURCE THRESHOLD:
   - If fewer than 2 reliable, matching sources exist that confirm the same specific event:
     Return status: "TIDAK_DAPAT_DIPASTIKAN" with a clear analytical explanation stating that evidence for this specific event is insufficient, rather than making assumptions.
4. STATUS DEFINITIONS & RINGKASAN FAKTA RULES:
   - "FAKTA": If credible official news articles explicitly confirm the truth of this specific event. (ringkasanFakta must contain 1-3 confirmed key facts).
   - "HOAX": If official sources debunk the claim, expose it as a fabrication/scam, or prove it false. (ringkasanFakta must contain supporting debunking findings).
   - "TIDAK_DAPAT_DIPASTIKAN": If evidence is conflicting, insufficient, or from unrelated regions.
     IMPORTANT FOR TIDAK_DAPAT_DIPASTIKAN:
     - DO NOT invent facts.
     - DO NOT fabricate evidence.
     - DO NOT create fake supporting points.
     - Return "ringkasanFakta": [] (empty array) when no reliable verified facts can be extracted.
5. CONFIDENCE SCORE (0-100):
   - Must strictly reflect: source quality, source agreement, and same-event relevance.
   - Never assign a high confidence score if evidence originates from unrelated incidents.

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
    .map(
      (art, i) =>
        `--- SUMBER ${i + 1}: ${art.title} (${art.domain}) ---\nURL: ${art.url}\nIsi:\n${art.content.slice(0, 2500)}\n`
    )
    .join("\n\n");

  const userPrompt = `KLAIM PENGGUNA:\n"""\n${originalClaim}\n"""\n\nARTIKEL BERITA PEMBANDING:\n${articlesContext}\n\nEvaluasi kecocokan kejadian spesifik (lokasi, entitas, insiden). Kembalikan HANYA JSON.`;

  const rawJson = await callOpenRouterWithRetry(
    apiKey,
    model,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    true,
    1
  );

  const cleanedJson = rawJson.replace(/^```json\s*|\s*```$/g, "").trim();

  try {
    const parsed = JSON.parse(cleanedJson);

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
    console.log(`[END] OpenRouter Analysis - Decision: ${validatedResult.data.status} (Score: ${validatedResult.data.confidenceScore}%, ${duration}ms)`);

    return validatedResult.data;
  } catch (err) {
    const duration = (performance.now() - t0).toFixed(0);
    console.error(`[CRITICAL JSON PARSE / VALIDATION FAILURE] (${duration}ms) Model: ${model}`, err);

    if (err instanceof SyntaxError) {
      const matchPos = err.message.match(/position (\d+)/i) || err.message.match(/column (\d+)/i);
      if (matchPos && matchPos[1]) {
        const pos = parseInt(matchPos[1], 10);
        const snippetStart = Math.max(0, pos - 40);
        const snippetEnd = Math.min(cleanedJson.length, pos + 40);
        console.error(`Failure Character Position: ${pos}, Context: "...${cleanedJson.slice(snippetStart, pos)}👉[HERE]👈${cleanedJson.slice(pos, snippetEnd)}..."`);
      }
    }

    throw new Error(`Gagal memvalidasi output analisis AI: ${err instanceof Error ? err.message : String(err)}`);
  }
}
