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

  if (config.openrouterApiKey) {
    providers.push({
      name: `OpenRouter (${config.openrouterModel || "default"})`,
      run: () => callOpenRouter(config.openrouterApiKey!, config.openrouterModel || "google/gemini-2.5-flash", messages, jsonFormat),
    });
  }

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
3. ATURAN GENERASI KUERI PENCARIAN (PRIORITAS MEDIA UTAMA & OTORITAS RESMI):
   - queryA (Peristiwa Inti + Lokasi + Entitas Kunci): Buat query pencarian yang menggabungkan peristiwa + LOKASI SPESIFIK + angka/entitas unik. PRIORITASKAN kueri yang memunculkan hasil dari media arus utama terpercaya (contoh: CNN Indonesia, Kompas, Detik, Tempo, Antara News, Metro TV, Bloomberg Technoz, Liputan6, Tribunnews, Republika, Media Indonesia, BBC Indonesia).
   - Khusus topik EKONOMI, PASAR MODAL, SAHAM, & KEUANGAN: PRIORITASKAN rujukan dari bursa dan regulator resmi: Bursa Efek Indonesia (idx.co.id), Otoritas Jasa Keuangan (ojk.go.id), KSEI (ksei.co.id), Kliring Penjaminan Efek Indonesia / IDClear (idclear.co.id), serta media ekonomi kredibel (Bloomberg Technoz, Bisnis.com, Kontan, CNBC Indonesia).
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
3. Ekstrak inti klaim menjadi 1 kalimat query pencarian Google/berita yang efektif dalam Bahasa Indonesia.
   PENTING: Jangan menghapus predikat atau inti tuduhan/klausa utama yang sedang diklaim (seperti "kalah perang", "ditangkap", "meninggal", "palsu", "pemilik", "merdeka"). Mesin pencari membutuhkan kata kunci klausa tersebut untuk menemukan artikel klarifikasi atau bantahan fakta.
   Contoh: jika klaim "Indonesia merdeka karena Amerika kalah perang", query harus memuat konteks klaim seperti "apakah amerika kalah perang kemerdekaan indonesia" atau "sejarah kemerdekaan indonesia kekalahan jepang amerika".
   PRIORITASKAN query yang akan memunculkan hasil dari media arus utama terpercaya (contoh: CNN Indonesia, Kompas, Detik, Tempo, Antara News, Metro TV, Bloomberg Technoz, Liputan6, Tribunnews, Republika, Media Indonesia, BBC Indonesia).
   Untuk klaim bertopik EKONOMI, KEUANGAN, SAHAM, INVESTASI, atau PERBANKAN: prioritaskan kata kunci yang mengarahkan ke kanal pengumuman resmi OJK (ojk.go.id), Bursa Efek Indonesia/BEI (idx.co.id), KSEI (ksei.co.id), IDClear/KPEI (idclear.co.id), atau publikasi finansial kredibel.
   Jika klaim mengklaim atau mempertanyakan kepemilikan/pendiri/direksi suatu perusahaan/emiten (contoh: "[Tokoh] pemilik [Perusahaan]"): sertakan kata kunci pencarian tentang struktur pemilik/pemegang saham resmi perusahaan tersebut (contoh: "pemilik pendiri pemegang saham [Perusahaan]"), agar data fakta resmi pemegang saham terambil untuk membantah atau mengonfirmasi klaim.
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
Evaluate the factual truth or falsity of the provided "KLAIM PENGGUNA" against credible evidence, verified facts, and historical reality.

CRITICAL LOGICAL & SEMANTIC ENTAILMENT RULES:
1. DECONSTRUCT AND RIGOROUSLY VERIFY EVERY PREDICATE & CAUSAL CLAIM:
   - When a claim asserts "A terjadi karena B" (e.g. "Indonesia merdeka karena Amerika kalah perang"):
     You MUST verify BOTH parts:
     (1) Did event A actually happen?
     (2) Is premise B factually TRUE and the actual cause?
   - If premise B is FALSE or INVERTED (e.g. America did NOT lose World War II; America and the Allies WON the war, while Japan surrendered and lost), the claim is a FALSEHOOD / INVERSION. You MUST classify it as "HOAX".
2. INVERSION DETECTION (WINNER VS LOSER, SUBJECT VS OBJECT, CAUSE VS EFFECT):
   - Pay meticulous attention to roles: Who won? Who lost? Who attacked? Who defended? Who is alive? Who died?
   - If a claim asserts "X kalah perang", but the facts prove "X menang perang dan Y yang kalah", the claim contradicts reality. Mark as "HOAX".
   - If a claim asserts "X ditangkap", but the evidence shows "X yang menangkap" or "tidak pernah ditangkap", mark as "HOAX".
   - AVOID THE PARTIAL TRUTH FALLACY: A claim is NEVER "FAKTA" merely because one part of the sentence is true (e.g. "Indonesia merdeka") if the core premise or causal predicate is false or inverted ("karena Amerika kalah perang").
3. SAME-EVENT CORROBORATION RULES:
   - SAME TOPIC DOES NOT EQUAL SAME EVENT:
     Do NOT use or corroborate sources merely because they share general keywords (e.g. "keracunan MBG", "kebakaran", "demonstrasi").
     You MUST verify that the evidence matches the EXACT SAME EVENT:
     Same Location (City/Regency/Province), Same Incident & Entities, Same Timeline.
   - Disregard sources from unrelated cities or unrelated institutions.
4. SOURCE CREDIBILITY TIERS:
   - TIER 1 (Highest trust): CNN Indonesia, Kompas.com, Detik.com, Tempo.co, Antara News, Metro TV News, Bloomberg Technoz/Bloomberg Indonesia, Liputan6, Tribunnews, Republika, Media Indonesia, BBC Indonesia, Reuters Indonesia, official government (.go.id) domains.
   - OFFICIAL ECONOMIC & CAPITAL MARKET AUTHORITIES (TIER 1): For claims regarding economy, investments, stocks, capital markets, clearing, or banking, official regulatory and SRO releases from Bursa Efek Indonesia / IDX (idx.co.id), KSEI (ksei.co.id), IDClear / KPEI (idclear.co.id), and OJK (ojk.go.id) represent the definitive primary Tier 1 authorities.
   - TIER 2 (Moderate trust): other established regional/national news outlets not listed above.
   - TIER 3 (Low trust / DO NOT USE for FAKTA or HOAX verdicts): blogs, forums, unverified aggregator sites, social media reposts, sites with no clear editorial identity.
   - If ALL available sources are Tier 3, return "TIDAK_DAPAT_DIPASTIKAN".
   - If Tier 1/2 sources conflict with Tier 3 sources, DISREGARD the Tier 3 sources entirely.
   - confidenceScore should be capped lower (max ~50) when the best available source is only Tier 2, and further capped (max ~20) if any Tier 3 source is mixed in.
5. STATUS DEFINITIONS:
   - "FAKTA": The claim in its entirety is completely accurate, supported by verified facts, and contains no false premises or inversions. (ringkasanFakta must contain 1-3 confirmed key facts).
   - "HOAX": The claim contains factually false statements, inverted facts (e.g. claiming the victor lost, or asserting fake causes), fabricated events, or has been debunked. (ringkasanFakta must contain 1-3 counter-facts or debunking evidence points).
   - "TIDAK_DAPAT_DIPASTIKAN": Evidence is conflicting or insufficient to draw a definitive conclusion. Return "ringkasanFakta": [].
6. ALASAN & RINGKASAN FAKTA:
   - In "alasan", clearly explain the logical and factual reasoning. Explicitly state why a premise is false or inverted if applicable (e.g. "Amerika Serikat memenangkan Perang Dunia II, sedangkan Jepang yang kalah").
   - In "ringkasanFakta", list 1-3 concise factual bullet points.

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
      const contentText = art.content || "";
      return `--- SUMBER ${i + 1} [TIER ${tier}]: ${art.title} (${art.domain}) ---\nURL: ${art.url}\nIsi:\n${contentText.slice(0, 2500)}\n`;
    })
    .join("\n\n");

  const userPrompt = `KLAIM PENGGUNA:\n"""\n${originalClaim}\n"""\n\nARTIKEL BERITA PEMBANDING DENGAN LABEL TIER KREDIBILITAS:\n${articlesContext}\n\nEvaluasi kebenaran klaim secara logis, teliti subjek/predikat/sebab-akibat dan bobot kredibilitas TIER sumber. Kembalikan HANYA JSON.`;

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


