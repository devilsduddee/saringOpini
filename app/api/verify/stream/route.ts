import { NextRequest } from "next/server";
import { verificationInputSchema } from "@/lib/schemas";
import { getEnvConfig } from "@/lib/env";
import { extractSearchQuery, extractArticleEntities, analyzeFactClaim } from "@/lib/openrouter";
import { searchNewsArticles } from "@/lib/tavily";
import { scrapeCleanArticle } from "@/lib/jina";
import { isUrl, extractDomain } from "@/lib/utils";
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
  "bojonegoro", "tuban", "lamongan", "gresik", "bangkalan", "sampang", "pamekasan", "sumenep"
];

function calculateSourceRelevance(
  article: { title: string; content: string; url: string; domain: string },
  entities: { title?: string; location?: string; keyEntities?: string[] }
): { score: number; breakdown: string[] } {
  let score = 50;
  const breakdown: string[] = ["Baseline: 50"];

  const textToScan = `${article.title} ${article.content.slice(0, 1500)}`.toLowerCase();
  const targetLocation = entities.location ? entities.location.toLowerCase().trim() : "";

  if (targetLocation && targetLocation.length > 2) {
    if (textToScan.includes(targetLocation)) {
      score += 35;
      breakdown.push(`+35 Match Target Location ("${targetLocation}")`);
    } else {
      const mentionedOtherCities = KNOWN_INDONESIAN_LOCATIONS.filter(
        (loc) => loc !== targetLocation && textToScan.includes(loc)
      );
      if (mentionedOtherCities.length > 0) {
        score -= 40;
        breakdown.push(`-40 Penalty: Mentions Different Location(s) [${mentionedOtherCities.slice(0, 3).join(", ")}]`);
      } else {
        score -= 15;
        breakdown.push(`-15 Penalty: Missing Target Location ("${targetLocation}")`);
      }
    }
  }

  if (entities.keyEntities && entities.keyEntities.length > 0) {
    let entityMatches = 0;
    for (const ent of entities.keyEntities) {
      const cleanEnt = ent.toLowerCase().trim();
      if (cleanEnt.length > 2 && textToScan.includes(cleanEnt)) {
        entityMatches++;
      }
    }
    if (entityMatches > 0) {
      const bonus = Math.min(30, entityMatches * 10);
      score += bonus;
      breakdown.push(`+${bonus} Matched ${entityMatches} Key Entities`);
    }
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

          const primaryScraped = await scrapeCleanArticle(query, env.JINA_API_KEY);
          const primaryDomain = extractDomain(query);

          const primaryArticle = {
            title: primaryScraped.title,
            url: query,
            domain: primaryDomain,
            content: primaryScraped.content,
          };

          const entities = await extractArticleEntities(
            primaryScraped.content,
            primaryScraped.title,
            env.OPENROUTER_API_KEY,
            env.OPENROUTER_MODEL
          );

          sendEvent({
            type: "stage",
            stage: "searching",
            stageMessage: entities.location 
              ? `Mencari berita pembanding dengan lokasi yang sama (${entities.location})...` 
              : "Mencari artikel berita pembanding terakreditasi...",
            progressPercent: 40,
          });

          let candidateArticles: Array<{ title: string; url: string; domain: string; snippet: string }> = [];
          try {
            candidateArticles = await searchNewsArticles(entities.searchQuery, env.TAVILY_API_KEY, 5);
          } catch {
            // ignore search network issue
          }

          sendEvent({
            type: "stage",
            stage: "scraping",
            stageMessage: "Mengambil konten artikel & menyaring relevansi sumber...",
            progressPercent: 60,
          });

          const scrapePromises = candidateArticles
            .filter((c) => c.url !== query)
            .map(async (cand) => {
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

          const acceptedSources = scoredCandidates
            .filter((item) => item.relevanceScore >= 60)
            .sort((a, b) => b.relevanceScore - a.relevanceScore);

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

          const searchQuery = await extractSearchQuery(query, env.OPENROUTER_API_KEY, env.OPENROUTER_MODEL);

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
        }

        sendEvent({
          type: "stage",
          stage: "analyzing",
          stageMessage: "Menganalisis bukti dan sumber pembanding...",
          progressPercent: 80,
        });

        const factDecision = await analyzeFactClaim(
          query,
          targetSearchArticles,
          env.OPENROUTER_API_KEY,
          env.OPENROUTER_MODEL
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
