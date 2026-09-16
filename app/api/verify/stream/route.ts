import { NextRequest } from "next/server";
import { verificationInputSchema } from "@/lib/schemas";
import { getEnvConfig } from "@/lib/env";
import { extractSearchQuery, extractArticleEntities, analyzeFactClaim } from "@/lib/openrouter";
import { searchNewsArticles, recoverUrlMetadataViaTavily } from "@/lib/tavily";
import { scrapeCleanArticle } from "@/lib/jina";
import { isUrl, extractDomain, extractSlugTitle, domainTier } from "@/lib/utils";
import { VerificationResult, VerificationStage } from "@/types/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SSEEvent {
  type: "stage" | "complete" | "error";
  stage?: VerificationStage;
  stageMessage?: string;
  progressPercent?: number;
  data?: VerificationResult;
  error?: string;
}

interface ScoredArticle {
  title: string;
  url: string;
  domain: string;
  content: string;
  relevanceScore: number;
  scoreBreakdown: string[];
}

// Major media headquarters / editorial bureau locations that frequently appear as datelines or publisher credits
const PUBLISHER_DATELINE_LOCATIONS = new Set([
  "jakarta", "semarang", "surabaya", "bandung", "medan", "makassar", "yogyakarta", "jogja"
]);

const KNOWN_INDONESIAN_LOCATIONS = [
  "pati", "sragen", "agam", "surabaya", "semarang", "bandung", "jakarta", "medan", "makassar",
  "bogor", "depok", "tangerang", "bekasi", "solo", "surakarta", "yogyakarta", "jogja", "malang",
  "bali", "denpasar", "lombok", "mataram", "aceh", "padang", "pekanbaru", "palembang", "lampung",
  "pontianak", "banjarmasin", "samarinda", "balikpapan", "manado", "ambon", "jayapura", "kupang",
  "sukabumi", "tasikmalaya", "cirebon", "garut", "cianjur", "kudus", "jepara", "rembang", "blora",
  "groboran", "boyolali", "klaten", "wonogiri", "karanganyar", "magelang", "purworejo", "kebumen",
  "banyumas", "purwokerto", "cilacap", "brebes", "tegal", "pemalang", "pekalongan", "batang", "kendal",
  "banyuwangi", "jember", "lumajang", "probolinggo", "pasuruan", "sidoarjo", "mojokerto", "jombang",
  "kediri", "blitar", "tulungagung", "trenggalek", "ponorogo", "pacitan", "ngawi", "magetan", "madiun",
  "bojonegoro", "tuban", "lamongan", "gresik", "bangkalan", "sampang", "pamekasan", "sumenep",
  "jayawijaya", "pepera", "papua", "mimika", "timika", "puncak", "intan jaya", "yahukimo", "wamena"
];

// Common stop words to filter out when extracting core action/incident keywords
const EVENT_STOP_WORDS = new Set([
  "di", "ke", "dari", "yang", "dan", "atau", "pada", "oleh", "untuk", "dengan", "ini", "itu",
  "ada", "adalah", "saat", "setelah", "karena", "agar", "bisa", "akan", "telah", "sudah",
  "sebuah", "suatu", "para", "juga", "tentang", "kasus", "berita", "terkait", "diduga", "artikel"
]);

export function calculateSourceRelevance(
  article: { title: string; content: string; url: string; domain: string },
  entities: {
    event?: string;
    location?: string;
    people?: string[];
    organizations?: string[];
    numbers?: string[];
    dates?: string[];
  }
): { score: number; breakdown: string[] } {
  let score = 40;
  const breakdown: string[] = ["Baseline: 40"];

  const urlLower = article.url.toLowerCase();
  const titleLower = article.title.toLowerCase();
  const textToScan = `${titleLower} ${article.content.slice(0, 2500)}`.toLowerCase();
  const targetLocation = entities.location ? entities.location.toLowerCase().trim() : "";
  const coreEvent = entities.event ? entities.event.toLowerCase().trim() : "";

  // 1. Tag / Category / Archive / Topic Page Detection Penalty (-50 penalty)
  const isTagOrCategoryPage = 
    urlLower.includes("/tag/") ||
    urlLower.includes("/tags/") ||
    urlLower.includes("/topic/") ||
    urlLower.includes("/topik/") ||
    urlLower.includes("/kategori/") ||
    urlLower.includes("/category/") ||
    urlLower.includes("/indeks/") ||
    urlLower.includes("/archive/") ||
    titleLower.startsWith("tag ") ||
    titleLower.startsWith("berita tag ") ||
    titleLower.startsWith("topik ") ||
    titleLower.startsWith("kumpulan berita ") ||
    titleLower.includes("indeks berita");

  if (isTagOrCategoryPage) {
    score -= 50;
    breakdown.push("-50 Penalty: Tag/Category/Topic/Index page detected (not a specific incident report)");
  }

  // 2. Core Event Action & Incident Corroboration Matching
  // Extract core action keywords (e.g. "membunuh", "bunuh", "keracunan", "kebakaran", "ditembak", "cpns", "mbg")
  if (coreEvent && coreEvent.length >= 4) {
    const eventKeywords = coreEvent
      .split(/[\s,.-]+/)
      .map((k) => k.trim())
      .filter((k) => k.length >= 3 && !EVENT_STOP_WORDS.has(k));

    if (eventKeywords.length > 0) {
      let matchedEventKeywords = 0;
      let titleMatchedKeywords = 0;

      for (const kw of eventKeywords) {
        if (textToScan.includes(kw)) matchedEventKeywords++;
        if (titleLower.includes(kw)) titleMatchedKeywords++;
      }

      const matchRatio = matchedEventKeywords / eventKeywords.length;

      if (matchRatio >= 0.6 || titleMatchedKeywords >= 2) {
        score += 35;
        breakdown.push(`+35 Match Core Incident Action/Event (${matchedEventKeywords}/${eventKeywords.length} keywords: [${eventKeywords.filter(k => textToScan.includes(k)).join(", ")}])`);
      } else if (matchRatio >= 0.3 || titleMatchedKeywords >= 1) {
        score += 15;
        breakdown.push(`+15 Partial Incident Match (${matchedEventKeywords}/${eventKeywords.length} keywords)`);
      } else {
        // Severe penalty: The article is talking about something else entirely
        score -= 30;
        breakdown.push(`-30 Penalty: Core Event Mismatch (Missing core incident keywords from "${coreEvent}")`);
      }
    }
  }

  // 3. Geographic Location Validation: Event Location vs Publisher Dateline
  let hasTargetLocation = false;
  if (targetLocation && targetLocation.length >= 3) {
    const targetLocTokens = targetLocation
      .toLowerCase()
      .split(/[\s,]+/)
      .filter((t) => t.length >= 3 && !["kabupaten", "kecamatan", "provinsi", "jawa", "tengah", "timur", "barat", "pegunungan"].includes(t));

    hasTargetLocation = targetLocTokens.some((tok) => textToScan.includes(tok));

    if (hasTargetLocation) {
      score += 25;
      breakdown.push(`+25 Match Target Location ("${targetLocation}")`);
    } else {
      // Find conflicting event locations
      const mentionedConflictingCities = KNOWN_INDONESIAN_LOCATIONS.filter((loc) => {
        if (targetLocTokens.some((tok) => loc.includes(tok) || tok.includes(loc))) return false;
        if (!textToScan.includes(loc)) return false;
        if (PUBLISHER_DATELINE_LOCATIONS.has(loc)) return false;
        return true;
      });

      if (mentionedConflictingCities.length > 0) {
        score -= 35;
        breakdown.push(`-35 Penalty: Conflicting Event Location [${mentionedConflictingCities.slice(0, 3).join(", ")}]`);
      } else {
        score -= 15;
        breakdown.push(`-15 Penalty: Missing Target Location ("${targetLocation}")`);
      }
    }
  }

  // 4. Specific People / Victims / Actors Corroboration
  if (entities.people && entities.people.length > 0) {
    let peopleMatches = 0;
    const matchedPeopleList: string[] = [];
    for (const person of entities.people) {
      const cleanPerson = person.toLowerCase().trim();
      if (cleanPerson.length > 2 && textToScan.includes(cleanPerson)) {
        peopleMatches++;
        matchedPeopleList.push(person);
      }
    }
    if (peopleMatches > 0) {
      const bonus = Math.min(25, peopleMatches * 15);
      score += bonus;
      breakdown.push(`+${bonus} Matched Specific Actors/Victims [${matchedPeopleList.join(", ")}]`);
    }
  }

  // 5. Specific Organizations / Instansi Involved
  if (entities.organizations && entities.organizations.length > 0) {
    let orgMatches = 0;
    const matchedOrgList: string[] = [];
    for (const org of entities.organizations) {
      const cleanOrg = org.toLowerCase().trim();
      if (cleanOrg.length > 2 && textToScan.includes(cleanOrg)) {
        orgMatches++;
        matchedOrgList.push(org);
      }
    }
    if (orgMatches > 0) {
      const bonus = Math.min(20, orgMatches * 10);
      score += bonus;
      breakdown.push(`+${bonus} Matched Organizations [${matchedOrgList.join(", ")}]`);
    }
  }

  // 6. Specific Numbers / Victim Counts
  if (entities.numbers && entities.numbers.length > 0) {
    let numberMatches = 0;
    for (const num of entities.numbers) {
      const digits = num.replace(/\D/g, "");
      const cleanNum = num.toLowerCase().trim();
      if ((digits.length >= 2 && textToScan.includes(digits)) || (cleanNum.length >= 2 && textToScan.includes(cleanNum))) {
        numberMatches++;
      }
    }
    if (numberMatches > 0) {
      const bonus = Math.min(20, numberMatches * 10);
      score += bonus;
      breakdown.push(`+${bonus} Matched Specific Numbers (${numberMatches} stats/counts)`);
    }
  }

  // 7. Specific Dates / Timeline
  if (entities.dates && entities.dates.length > 0) {
    let dateMatches = 0;
    for (const dt of entities.dates) {
      const cleanDt = dt.toLowerCase().trim();
      if (cleanDt.length > 3 && textToScan.includes(cleanDt)) {
        dateMatches++;
      }
    }
    if (dateMatches > 0) {
      score += 10;
      breakdown.push(`+10 Matched Timeline/Date`);
    }
  }

  // 8. Domain Credibility Tier Adjustment
  const tier = domainTier(article.url);
  if (tier === 1) {
    score += 15;
    breakdown.push("+15 Bonus: Tier-1 Established Media Domain");
  } else if (tier === 3) {
    score -= 30;
    breakdown.push("-30 Penalty: Tier-3 Low Trust / Unverified Domain");
  }

  const finalScore = Math.max(0, Math.min(100, score));
  return { score: finalScore, breakdown };
}



export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: SSEEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        const body = await req.json().catch(() => ({}));
        const rawQuery = body.query || "";

        sendEvent({
          type: "stage",
          stage: "validation",
          stageMessage: "Memvalidasi teks klaim dan konfigurasi sistem...",
          progressPercent: 10,
        });

        const validationResult = verificationInputSchema.safeParse({ query: rawQuery });
        if (!validationResult.success) {
          sendEvent({
            type: "error",
            error: validationResult.error.issues[0]?.message || "Input tidak valid. Masukkan minimal 5 karakter.",
          });
          controller.close();
          return;
        }

        const envCheck = getEnvConfig();
        if (!envCheck.success) {
          sendEvent({
            type: "error",
            error: envCheck.error,
          });
          controller.close();
          return;
        }

        const env = envCheck.data;
        const query = validationResult.data.query;
        const inputIsUrl = isUrl(query);
        let targetSearchArticles: Array<{ title: string; url: string; domain: string; content: string }> = [];

        if (inputIsUrl) {
          sendEvent({
            type: "stage",
            stage: "extraction",
            stageMessage: "Membaca artikel & mengekstraksi entitas utama kejadian...",
            progressPercent: 25,
          });

          let primaryScraped = await scrapeCleanArticle(query, env.JINA_API_KEY);
          const primaryDomain = extractDomain(query);

          // P0 Resilience: If Jina scraping returned empty content or missing title, recover via Tavily & URL Slug
          const slugTitle = extractSlugTitle(query);
          if (!primaryScraped.content || !primaryScraped.title || primaryScraped.title === "Artikel Berita") {
            console.log(`[URL Resilience] Jina returned incomplete content for ${query}. Attempting Tavily metadata recovery...`);
            const tavilyRecovered = await recoverUrlMetadataViaTavily(query, env.TAVILY_API_KEY);
            if (tavilyRecovered) {
              primaryScraped = {
                title: tavilyRecovered.title || primaryScraped.title || slugTitle || "Peristiwa Berita",
                content: tavilyRecovered.snippet || primaryScraped.content || slugTitle,
              };
            } else if (slugTitle) {
              primaryScraped = {
                title: primaryScraped.title && primaryScraped.title !== "Artikel Berita" ? primaryScraped.title : slugTitle,
                content: primaryScraped.content || slugTitle,
              };
            }
          }

          // Ensure title is never generic
          if (!primaryScraped.title || primaryScraped.title === "Artikel Berita") {
            primaryScraped.title = slugTitle || "Peristiwa Berita";
          }
          if (!primaryScraped.content) {
            primaryScraped.content = primaryScraped.title;
          }

          const primaryArticle = {
            title: primaryScraped.title,
            url: query,
            domain: primaryDomain,
            content: primaryScraped.content,
          };

          const aiConfig = {
            openrouterApiKey: env.OPENROUTER_API_KEY,
            openrouterModel: env.OPENROUTER_MODEL,
            groqApiKey: env.GROQ_API_KEY,
            groqModel: env.GROQ_MODEL,
          };

          const entities = await extractArticleEntities(
            primaryScraped.content,
            primaryScraped.title,
            aiConfig
          );



          sendEvent({
            type: "stage",
            stage: "searching",
            stageMessage: entities.location 
              ? `Mencari berita pembanding multi-kueri di lokasi yang sama (${entities.location})...` 
              : "Mencari berita pembanding multi-kueri terakreditasi...",
            progressPercent: 40,
          });

          // Execute retrieval across 3 distinct query variants in parallel
          const searchPromises = [
            searchNewsArticles(entities.queryA, env.TAVILY_API_KEY, 4).catch(() => []),
            searchNewsArticles(entities.queryB, env.TAVILY_API_KEY, 3).catch(() => []),
            searchNewsArticles(entities.queryC, env.TAVILY_API_KEY, 3).catch(() => []),
          ];

          const [resultsA, resultsB, resultsC] = await Promise.all(searchPromises);

          // Merge & Deduplicate candidate articles by normalized URL
          const candidateMap = new Map<string, { title: string; url: string; domain: string; snippet: string }>();
          
          for (const item of [...resultsA, ...resultsB, ...resultsC]) {
            const cleanUrl = item.url.split("?")[0].toLowerCase().trim();
            const cleanPrimaryUrl = query.split("?")[0].toLowerCase().trim();
            if (cleanUrl !== cleanPrimaryUrl && !candidateMap.has(cleanUrl)) {
              candidateMap.set(cleanUrl, item);
            }
          }

          const candidateArticles = Array.from(candidateMap.values());
          console.log(`[URL Retrieval] Merged & deduplicated ${candidateArticles.length} unique candidates from 3 query variants`);

          sendEvent({
            type: "stage",
            stage: "scraping",
            stageMessage: "Mengambil konten artikel & menyaring relevansi sumber...",
            progressPercent: 60,
          });

          const scrapePromises = candidateArticles.map(async (cand) => {
            const scraped = await scrapeCleanArticle(cand.url, env.JINA_API_KEY);
            return {
              title: cand.title,
              url: cand.url,
              domain: cand.domain,
              content: scraped.content || cand.snippet,
            };
          });

          const resolvedCandidates = await Promise.all(scrapePromises);
          const scoredCandidates: ScoredArticle[] = resolvedCandidates.map((art) => {
            const { score, breakdown } = calculateSourceRelevance(art, entities);
            return { ...art, relevanceScore: score, scoreBreakdown: breakdown };
          });

          // Strict filtering: Require score >= 60 to prevent unrelated same-topic false corroboration
          const acceptedSources = scoredCandidates
            .filter((item) => item.relevanceScore >= 60)
            .sort((a, b) => b.relevanceScore - a.relevanceScore);

          // Comprehensive Retrieval Diagnostics Logging
          console.log("\n================ [RETRIEVAL DIAGNOSTICS] ================");
          console.log(`[Query A (Specific)]: "${entities.queryA}" (${resultsA.length} hits)`);
          console.log(`[Query B (Entities)]: "${entities.queryB}" (${resultsB.length} hits)`);
          console.log(`[Query C (Location)]: "${entities.queryC}" (${resultsC.length} hits)`);
          console.log(`[Total Unique Candidates]: ${candidateArticles.length}`);
          console.log(`[Relevance Evaluation]: Accepted ${acceptedSources.length}/${scoredCandidates.length} candidate sources with score >= 60`);

          scoredCandidates.forEach((cand, idx) => {
            if (cand.relevanceScore >= 60) {
              console.log(`  ✅ [ACCEPTED] (#${idx + 1}) Score: ${cand.relevanceScore}/100 | ${cand.title}`);
              console.log(`     URL: ${cand.url}`);
              console.log(`     Reasons: ${cand.scoreBreakdown.join(" | ")}`);
            } else {
              console.log(`  ❌ [REJECTED] (#${idx + 1}) Score: ${cand.relevanceScore}/100 | ${cand.title}`);
              console.log(`     URL: ${cand.url}`);
              console.log(`     Rejection Reason: ${cand.scoreBreakdown.join(" | ")}`);
            }
          });
          console.log("=========================================================\n");

          targetSearchArticles = [
            primaryArticle,
            ...acceptedSources.slice(0, 3).map((s) => ({
              title: s.title,
              url: s.url,
              domain: s.domain,
              content: s.content,
            })),
          ];

        } else {
          sendEvent({
            type: "stage",
            stage: "extraction",
            stageMessage: "Mengekstraksi entitas dari teks klaim & pesan broadcast...",
            progressPercent: 25,
          });

          const aiConfig = {
            openrouterApiKey: env.OPENROUTER_API_KEY,
            openrouterModel: env.OPENROUTER_MODEL,
            groqApiKey: env.GROQ_API_KEY,
            groqModel: env.GROQ_MODEL,
          };

          const searchQuery = await extractSearchQuery(query, aiConfig);

          sendEvent({
            type: "stage",
            stage: "searching",
            stageMessage: "Mencari rujukan berita pembanding di media kredibel...",
            progressPercent: 40,
          });

          const searchResults = await searchNewsArticles(searchQuery || query.slice(0, 100), env.TAVILY_API_KEY, 4);

          if (searchResults.length === 0) {
            sendEvent({
              type: "stage",
              stage: "synthesizing",
              stageMessage: "Menyusun kesimpulan verifikasi...",
              progressPercent: 95,
            });

            const unconfirmedResult: VerificationResult = {
              id: `verif-${Date.now()}`,
              query,
              inputType: "text",
              status: "TIDAK_DAPAT_DIPASTIKAN",
              confidenceScore: 30,
              alasan: "Tidak ditemukan artikel berita atau rujukan resmi terkait narasi klaim ini di portal berita terdaftar. Narasi kemungkinan merupakan isu lokal yang belum terverifikasi atau klaim yang tidak memiliki dasar pemberitaan resmi.",
              ringkasanFakta: [
                "Tidak ada rilis pers atau liputan media arus utama terkait topik ini.",
                "Waspadai penyebaran pesan berantai yang tidak mencantumkan sumber dan tanggal resmi.",
              ],
              sources: [],
              timestamp: new Date().toISOString(),
            };

            sendEvent({
              type: "complete",
              stage: "completed",
              stageMessage: "Verifikasi Selesai",
              progressPercent: 100,
              data: unconfirmedResult,
            });
            controller.close();
            return;
          }

          sendEvent({
            type: "stage",
            stage: "scraping",
            stageMessage: "Mengambil artikel referensi dan membersihkan teks...",
            progressPercent: 60,
          });

          const scrapePromises = searchResults.map(async (res) => {
            const scraped = await scrapeCleanArticle(res.url, env.JINA_API_KEY);
            return {
              title: res.title,
              url: res.url,
              domain: res.domain,
              content: scraped.content || res.snippet,
            };
          });

          targetSearchArticles = await Promise.all(scrapePromises);

          // Domain Tier Prioritization: if at least 2 Tier-1/2 sources are available, discard Tier-3
          const tier1Or2Count = targetSearchArticles.filter((art) => domainTier(art.url) <= 2).length;
          if (tier1Or2Count >= 2) {
            targetSearchArticles = targetSearchArticles.filter((art) => domainTier(art.url) <= 2);
          }
        }

        // For URL input mode, also filter out Tier-3 sources if at least 2 Tier-1/2 articles exist
        const tier1Or2InTarget = targetSearchArticles.filter((art) => domainTier(art.url) <= 2).length;
        if (tier1Or2InTarget >= 2) {
          targetSearchArticles = targetSearchArticles.filter((art) => domainTier(art.url) <= 2);
        }

        sendEvent({
          type: "stage",
          stage: "analyzing",
          stageMessage: "Menganalisis bukti dan sumber pembanding...",
          progressPercent: 80,
        });

        const aiConfig = {
          openrouterApiKey: env.OPENROUTER_API_KEY,
          openrouterModel: env.OPENROUTER_MODEL,
          groqApiKey: env.GROQ_API_KEY,
          groqModel: env.GROQ_MODEL,
        };

        const factDecision = await analyzeFactClaim(
          query,
          targetSearchArticles,
          aiConfig
        );


        sendEvent({
          type: "stage",
          stage: "synthesizing",
          stageMessage: "Menyusun kesimpulan akhir...",
          progressPercent: 95,
        });

        const finalResult: VerificationResult = {
          id: `verif-${Date.now()}`,
          query,
          inputType: inputIsUrl ? "url" : "text",
          status: factDecision.status,
          confidenceScore: factDecision.confidenceScore,
          alasan: factDecision.alasan,
          ringkasanFakta: factDecision.ringkasanFakta,
          sources: factDecision.sources,
          timestamp: new Date().toISOString(),
        };

        sendEvent({
          type: "complete",
          stage: "completed",
          stageMessage: "Verifikasi Selesai",
          progressPercent: 100,
          data: finalResult,
        });

        controller.close();
      } catch (err) {
        sendEvent({
          type: "error",
          error: err instanceof Error ? err.message : "Terjadi kendala internal saat memverifikasi informasi.",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
