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
3. Ekstrak inti klaim menjadi 1 kalimat query pencarian Google/berita yang efektif dalam Bahasa Indonesia:
   - PENTING: Jangan menghapus predikat atau inti tuduhan/klausa utama yang sedang diklaim (seperti "kalah perang", "ditangkap", "meninggal", "palsu", "pemilik", "merdeka"). Mesin pencari membutuhkan kata kunci klausa tersebut untuk menemukan artikel klarifikasi atau bantahan fakta.
   - NORMALISASI FORMAT ANGKA: Jika klaim memuat angka ribuan/jutaan tanpa pemisah (contoh "40000"), sertakan format penulisan berita Indonesia (contoh "40.000" atau "40 ribu") agar mesin pencari tidak gagal mencocokkan artikel pers.
   - PENGEMBANGAN AKRONIM: Kembangkan akronim program pemerintah atau isu publik (contoh "MBG" -> "makan bergizi gratis", "IKN" -> "ibu kota nusantara").
   - PRIORITASKAN query yang akan memunculkan hasil dari media arus utama terpercaya (CNN Indonesia, Kompas, Detik, Tempo, Antara News, Metro TV, Bloomberg Technoz, Liputan6, Tribunnews, Republika, Media Indonesia, BBC Indonesia).
   - Untuk klaim bertopik EKONOMI, KEUANGAN, SAHAM, INVESTASI, atau PERBANKAN: prioritaskan kata kunci yang mengarahkan ke kanal pengumuman resmi OJK (ojk.go.id), Bursa Efek Indonesia/BEI (idx.co.id), KSEI (ksei.co.id), IDClear/KPEI (idclear.co.id), atau publikasi finansial kredibel.
   - Jika klaim mempertanyakan kepemilikan/pendiri/direksi perusahaan/emiten: sertakan kata kunci pencarian tentang struktur pemilik/pemegang saham resmi perusahaan tersebut.
   - Hindari kata kunci generik yang memunculkan blog pribadi atau forum.
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

export async function extractClaimEntities(
  claimText: string,
  config: AIProviderConfig | string,
  modelFallback?: string
): Promise<ArticleEntities> {
  const providerConfig: AIProviderConfig = typeof config === "string" 
    ? { openrouterApiKey: config, openrouterModel: modelFallback } 
    : config;

  console.log(`[AI Pipeline] Claim Entities Extraction (OpenRouter: ${providerConfig.openrouterModel || 'default'}, Groq: ${providerConfig.groqModel || 'default'})`);
  console.log(`[START] Claim Entities Extraction (claim: "${claimText.slice(0, 60)}...")`);
  const t0 = performance.now();

  const systemPrompt = `Anda adalah asisten AI ekstraktor entitas klaim dan perancang kueri pencarian multi-sudut untuk fact-checking Indonesia (Saring Opini).
Tugas Anda:
1. Baca klaim pengguna (bisa berupa teks singkat, kritik kebijakan, isu viral, pesan broadcast, atau pertanyaan).
2. Identifikasi dan ekstrak entitas kunci kejadian:
   - event: nama peristiwa/isu/kebijakan inti dalam Bahasa Indonesia (contoh: "keracunan program makan bergizi gratis mbg", "kemerdekaan indonesia kekalahan perang dunia 2", "utang luar negeri indonesia"). Sertakan predikat dan subjek.
   - location: nama kota/kabupaten spesifik jika ada (contoh: "Pati", "Garut", "Surabaya"). Kosongkan "" jika lingkup nasional atau tidak disebut.
   - people: nama tokoh/pejabat/pelaku/korban (contoh: ["Prabowo", "Jokowi"]).
   - organizations: lembaga, kementerian, atau pengawas (contoh: ["Badan Gizi Nasional", "Kemenkes", "JPPI", "OJK", "BEI"]).
   - numbers: angka atau kuantitas yang diklaim (contoh: ["40000", "40.000", "40 ribu"]). Jika ada angka polos tanpa titik, sertakan juga variasi penulisan jurnalistiknya ("40.000", "40 ribu").
   - dates: tanggal, tahun, atau periode waktu.
3. ATURAN GENERASI 3 KUERI PENCARIAN JURNALISTIK:
   - queryA (Kueri Jurnalistik Spesifik + Normalisasi Angka & Akronim):
     Kombinasikan peristiwa inti + perluasan akronim (seperti "MBG" -> "makan bergizi gratis") + variasi penulisan angka berita (seperti "40 ribu" atau "40.000").
     Contoh: "korban keracunan program makan bergizi gratis mbg 40 ribu".
   - queryB (Kueri Peristiwa Inti Tanpa Keterikatan Angka Kaku - WAJIB):
     Kueri yang berfokus pada peristiwa/isu pokok dan subjek TANPA memaksakan angka spesifik. Hal ini sangat krusial agar jika angka pengguna adalah estimasi/pembulatan wajar (misal "40000"), laporan berita investigasi dengan angka persis (misal "40.759") tetap berhasil ditemukan.
     Contoh: "korban keracunan program makan bergizi gratis mbg".
   - queryC (Kueri Cek Fakta, Rilis Resmi & Laporan Pemantau):
     Kueri untuk menemukan artikel cek fakta, bantahan, atau laporan monitoring lembaga resmi/independen (contoh: JPPI, Kemenkes, BPK, Tempo Cek Fakta).
     Contoh: "cek fakta keracunan program makan bergizi gratis mbg".
   - Format: 4-8 kata kunci jurnalistik padat untuk media arus utama (Kompas, Detik, Tempo, CNN Indonesia, Antara, BBC Indonesia, dll.).

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

  const userPrompt = `TEKS KLAIM PENGGUNA:\n"""\n${claimText.slice(0, 3000)}\n"""`;

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
    console.log(`[END] Claim Entities Extraction - Event: "${parsed.event || 'N/A'}", Loc: "${parsed.location || 'N/A'}" (${duration}ms)`);
    console.log(`[Queries Generated] A: "${parsed.queryA}", B: "${parsed.queryB}", C: "${parsed.queryC}"`);

    const cleanClaim = claimText.replace(/[^\w\s]/gi, " ").trim();
    const defaultQuery = cleanClaim.slice(0, 100);

    return {
      event: parsed.event || cleanClaim,
      location: parsed.location || "",
      people: Array.isArray(parsed.people) ? parsed.people : [],
      organizations: Array.isArray(parsed.organizations) ? parsed.organizations : [],
      numbers: Array.isArray(parsed.numbers) ? parsed.numbers : [],
      dates: Array.isArray(parsed.dates) ? parsed.dates : [],
      queryA: parsed.queryA || defaultQuery,
      queryB: parsed.queryB || parsed.queryA || defaultQuery,
      queryC: parsed.queryC || `cek fakta ${defaultQuery}`,
    };
  } catch (err) {
    const duration = (performance.now() - t0).toFixed(0);
    console.warn(`[END] Claim Entities Extraction - Fallback used (${duration}ms):`, err instanceof Error ? err.message : err);

    const digits = claimText.match(/\b\d+\b/g) || [];
    const expandedNumbers: string[] = [];
    digits.forEach((d) => {
      expandedNumbers.push(d);
      if (d.length >= 4) {
        const withDot = d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        expandedNumbers.push(withDot);
        const numVal = parseInt(d, 10);
        if (numVal >= 1000 && numVal < 1000000) {
          expandedNumbers.push(`${Math.round(numVal / 1000)} ribu`);
        }
      }
    });

    const cleanClaim = claimText.replace(/[^\w\s]/gi, " ").trim();
    const eventWithoutNumbers = cleanClaim.replace(/\b\d+\b/g, "").replace(/\s+/g, " ").trim();

    return {
      event: eventWithoutNumbers || cleanClaim,
      location: "",
      people: [],
      organizations: [],
      numbers: expandedNumbers,
      dates: [],
      queryA: cleanClaim,
      queryB: eventWithoutNumbers || cleanClaim,
      queryC: `cek fakta ${eventWithoutNumbers || cleanClaim}`,
    };
  }
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
5. STATISTICAL & NUMERICAL APPROXIMATION TOLERANCE:
   - In Indonesian public discourse, citizen reports, and journalism, large figures are frequently rounded or colloquially estimated (e.g. "40.000" or "40 ribu" for an official report of "40.759" or "50.059", or "8.000 triliun" for "8.041 triliun").
   - If the underlying incident/program actually occurred, is verified by credible reporting or official monitoring data, and the claimed statistic is of the same order of magnitude / close approximation to the reported facts (e.g. claim: 40000 korban MBG, sources: JPPI reports 40.759 korban MBG or Kemenkes reports 50.059 korban):
     You MUST classify as "FAKTA". In "alasan" and "ringkasanFakta", clarify the exact reported statistics (e.g. "Klaim terverifikasi: data monitoring JPPI mencatat 40.759 korban dugaan keracunan MBG, sehingga angka 40.000 merupakan pembulatan wajar.").
   - NEVER classify a claim as "HOAX" merely due to standard rounding or format variations (e.g. writing 40000 instead of 40.759).
   - Only classify as "HOAX" for statistics if:
     (a) The figure is fabricated by extreme orders of magnitude (e.g. claiming 1.000.000 korban when there were only 5).
     (b) The claim asserts casualties, funds, or events when official investigations confirmed zero or fabricated.
     (c) The event itself never occurred.
6. STRICT TOPIC INTEGRITY & DISREGARD UNRELATED EVENTS:
   - NEVER compare a claim against an unrelated incident in the provided articles. For example, if the claim is about "Keracunan MBG / Makan Bergizi Gratis" and an article discusses "Keracunan sate jebred", that article is completely irrelevant. You must NOT cite the 52 victims of sate jebred to refute 40000 victims of MBG.
   - If NONE of the provided articles discuss the claimed subject/event/policy, you MUST return "TIDAK_DAPAT_DIPASTIKAN". Do NOT manufacture a "HOAX" verdict when relevant evidence is absent.
7. ABSOLUTE OBJECTIVITY ON PUBLIC POLICY & GOVERNMENT ISSUES:
   - Maintain strict political neutrality.
   - When evaluating claims regarding government programs, public controversies, or policies (e.g. Makan Bergizi Gratis/MBG, IKN, food estate, utang negara, bansos):
     Base your decision strictly on verified reporting from credible Tier 1 media and watchdog reports (e.g. JPPI, Ombudsman, BPK, KPK, Kemenkes).
     Do not dismiss public criticism as "HOAX" without verified contrary evidence.
8. STATUS DEFINITIONS:
   - "FAKTA": The claim in its entirety is completely accurate or a reasonable approximation of verified facts, supported by evidence, and contains no false premises or inversions. (ringkasanFakta must contain 1-3 confirmed key facts).
   - "HOAX": The claim contains factually false statements, inverted facts (e.g. claiming the victor lost, or asserting fake causes), fabricated events, or has been debunked. (ringkasanFakta must contain 1-3 counter-facts or debunking evidence points).
   - "TIDAK_DAPAT_DIPASTIKAN": Evidence is conflicting or insufficient to draw a definitive conclusion. Return "ringkasanFakta": [].
9. ALASAN & RINGKASAN FAKTA:
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


