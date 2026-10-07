import assert from "node:assert";
import { calculateSourceRelevance } from "../../app/api/verify/stream/route";
import { verificationResultSchema } from "../schemas";

console.log("[TEST] Running Claim Extraction & Relevance Tests...\n");

{
  const claimEntities = {
    event: "keracunan program makan bergizi gratis mbg",
    location: "",
    numbers: ["40000", "40.000", "40 ribu"],
  };

  const offTopicArticle = {
    title: "52 Warga Garut Keracunan Sate Jebred, 2 Meninggal Dunia",
    content: "Dinas Kesehatan Kabupaten Garut melaporkan 52 warga mengalami keracunan setelah mengonsumsi sate jebred di Kecamatan Cilawu dan Cigedug.",
    url: "https://www.cnnindonesia.com/nasional/20231011123456/keracunan-sate-jebred-garut",
    domain: "cnnindonesia.com",
  };

  const relevantMBGArticle = {
    title: "JPPI Catat 40.759 Korban Dugaan Keracunan Makanan Program Makan Bergizi Gratis",
    content: "Jaringan Pemantau Pendidikan Indonesia (JPPI) merilis data pemantauan bahwa terdapat 40.759 warga dan siswa di 36 provinsi yang menjadi korban keracunan makanan dalam pelaksanaan program Makan Bergizi Gratis (MBG).",
    url: "https://www.kompas.com/tren/read/2026/08/10/jppi-keracunan-mbg-40-ribu-korban",
    domain: "kompas.com",
  };

  const offTopicResult = calculateSourceRelevance(offTopicArticle, claimEntities, "umum");
  const relevantResult = calculateSourceRelevance(relevantMBGArticle, claimEntities, "umum");

  console.log(`Off-topic article score: ${offTopicResult.score}/100 (${offTopicResult.breakdown.join(" | ")})`);
  console.log(`Relevant MBG article score: ${relevantResult.score}/100 (${relevantResult.breakdown.join(" | ")})`);

  assert.ok(offTopicResult.score < 50, "Off-topic article (sate jebred) must be rejected with score < 50");
  assert.ok(relevantResult.score >= 60, "Relevant MBG article must be accepted with score >= 60");
  console.log("✅ [Relevance Filter] Sate jebred successfully filtered out & MBG article successfully accepted!");
}

{
  const payloadApproximation = {
    status: "FAKTA",
    confidenceScore: 90,
    alasan: "Klaim pengguna mengenai 40.000 keracunan MBG terkonfirmasi oleh data resmi JPPI yang mencatat 40.759 korban, serta data surveilans Kemenkes yang mencatat hingga 50.059 korban. Angka 40.000 merupakan pembulatan wajar dalam wacana publik.",
    ringkasanFakta: [
      "Monitoring JPPI mencatat 40.759 korban keracunan program Makan Bergizi Gratis (MBG) di 36 provinsi.",
      "Data surveilans Kemenkes per September 2026 mencatat 50.059 korban dari 560 kejadian.",
      "Angka 40.000 merupakan estimasi pembulatan yang mendekati fakta laporan resmi.",
    ],
    sources: [
      {
        title: "JPPI Catat 40.759 Korban Keracunan MBG",
        url: "https://www.kompas.com/jppi-keracunan-mbg",
        domain: "kompas.com",
      },
    ],
  };

  const parsed = verificationResultSchema.safeParse(payloadApproximation);
  assert.ok(parsed.success, "Payload approximation should pass Zod schema validation");
  console.log("✅ [Schema Validation] FAKTA with numerical approximation passes validation cleanly!");
}

console.log("\n🎉 ALL CLAIM EXTRACTION & RELEVANCE TESTS PASSED!");
