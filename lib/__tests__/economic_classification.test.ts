import assert from "node:assert";
import {
  isEconomicTopic,
  classifyTopic,
  domainTier,
  isEconomicOfficialDomain,
  extractEmitenMention,
} from "../utils";
import { calculateSourceRelevance } from "../../app/api/verify/stream/route";

console.log("[TEST] Running Economic Classification & Source Verification Tests...\n");

{
  const testCases = [
    { text: "BEI menghentikan sementara suspensi perdagangan saham GOTO", expected: true, label: "BEI / Saham" },
    { text: "OJK mencabut izin usaha 5 perusahaan pinjol ilegal di Jakarta", expected: true, label: "OJK / Pinjol" },
    { text: "KSEI merilis jadwal pencatatan pemegang saham untuk dividen BBCA", expected: true, label: "KSEI / Dividen" },
    { text: "IDClear memastikan efisiensi penjaminan transaksi di pasar modal", expected: true, label: "IDClear / Pasar Modal" },
    { text: "https://www.idx.co.id/id/berita/pengumuman/123", expected: true, label: "IDX URL" },
    { text: "https://ojk.go.id/id/siaran-pers/2026/01", expected: true, label: "OJK URL" },
    { text: "IHSG anjlok 2% di tengah kenaikan suku bunga Bank Indonesia", expected: true, label: "IHSG & Suku Bunga" },
    { text: "Emiten tambang emas membukukan lonjakan laba bersih kuartal II", expected: true, label: "Emiten & Laba" },
    { text: "apakah ridho pemilik AADI", expected: true, label: "AADI Emiten Mention" },
  ];

  for (const tc of testCases) {
    const result = isEconomicTopic(tc.text);
    assert.strictEqual(result, tc.expected, `Expected ${tc.label} to be recognized as economic`);
    assert.strictEqual(classifyTopic(tc.text), "ekonomi", `classifyTopic should return 'ekonomi' for ${tc.label}`);
    console.log(`✅ [Classification Positive] ${tc.label} correctly classified as ekonomi`);
  }
}

{
  const nonEconomicCases = [
    { text: "Kebakaran melanda pemukiman padat penduduk di Manggarai tadi malam", label: "Kebakaran pemukiman" },
    { text: "Timnas Indonesia berhasil menaklukkan lawannya 2-0 di Stadion Utama GBK", label: "Sepak bola / Olahraga" },
    { text: "Resep masakan rendang daging sapi empuk khas Padang", label: "Kuliner / Resep" },
    { text: "BMKG mengeluarkan peringatan dini cuaca ekstrem di pesisir selatan", label: "Cuaca BMKG" },
  ];

  for (const tc of nonEconomicCases) {
    const result = isEconomicTopic(tc.text);
    assert.strictEqual(result, false, `Expected ${tc.label} to NOT be classified as economic`);
    assert.strictEqual(classifyTopic(tc.text), "umum", `classifyTopic should return 'umum' for ${tc.label}`);
    console.log(`✅ [Classification Negative] ${tc.label} correctly classified as umum`);
  }
}

{
  const officialEconomicUrls = [
    "https://www.idx.co.id/id/perusahaan-tercatat/keterbukaan-informasi",
    "https://idx.co.id/id",
    "https://www.ksei.co.id/id/berita",
    "https://ksei.co.id/id",
    "https://www.idclear.co.id/id/tentang-kami",
    "https://idclear.co.id/id",
    "https://ojk.go.id/id/kanal/pasar-modal",
    "https://www.ojk.go.id/id",
  ];

  for (const url of officialEconomicUrls) {
    const isOfficial = isEconomicOfficialDomain(url);
    const tier = domainTier(url);

    assert.strictEqual(isOfficial, true, `URL ${url} must be identified as official economic domain`);
    assert.strictEqual(tier, 1, `URL ${url} must be Tier 1`);
    console.log(`✅ [Tier 1 Official] ${url} -> Tier 1 (isOfficial: ${isOfficial})`);
  }
}

{
  const articleOfficial = {
    title: "Pengumuman Suspensi Perdagangan Saham BUMI oleh Bursa",
    url: "https://www.idx.co.id/id/berita/pengumuman/123",
    domain: "idx.co.id",
    content: "PT Bursa Efek Indonesia (BEI) melakukan penghentian sementara (suspensi) perdagangan saham emiten BUMI mulai sesi I.",
  };

  const articleRegular = {
    title: "Suspensi Saham BUMI Diberlakukan Hari Ini",
    url: "https://kompas.com/ekonomi/read/2026/01/suspensi-saham",
    domain: "kompas.com",
    content: "Bursa Efek Indonesia resmi menghentikan sementara perdagangan saham BUMI mulai pagi ini.",
  };

  const entities = {
    event: "suspensi perdagangan saham BUMI",
    organizations: ["BEI", "BUMI"],
  };

  const evalOfficial = calculateSourceRelevance(articleOfficial, entities, "ekonomi");
  const evalRegular = calculateSourceRelevance(articleRegular, entities, "ekonomi");

  const hasOfficialBonus = evalOfficial.breakdown.some((b) => b.includes("Official Economic & Capital Market Authority"));
  assert.strictEqual(hasOfficialBonus, true, "Official economic domain must receive +25 authority bonus in economic category");
  assert.strictEqual(evalOfficial.score >= 80, true, "Official BEI source should score highly");
  console.log(`✅ [Relevance Scoring] Official IDX Score: ${evalOfficial.score}/100 (Bonus detected: ${hasOfficialBonus})`);
  console.log(`✅ [Relevance Scoring] Regular Tier-1 Score: ${evalRegular.score}/100`);
}

{
  const emitenAADI = extractEmitenMention("apakah ridho pemilik AADI");
  assert.notStrictEqual(emitenAADI, null, "AADI must be extracted as emiten");
  assert.strictEqual(emitenAADI?.ticker, "AADI");
  console.log(`✅ [Emiten Extraction] 'apakah ridho pemilik AADI' -> ${emitenAADI?.ticker} (${emitenAADI?.fullName})`);

  const emitenGoto = extractEmitenMention("ridho pemilik goto?");
  assert.notStrictEqual(emitenGoto, null, "GoTo must be extracted as emiten");
  assert.strictEqual(emitenGoto?.ticker, "GOTO", "Ticker must be GOTO");
  assert.strictEqual(isEconomicTopic("ridho pemilik goto?"), true, "'ridho pemilik goto?' must be classified as ekonomi");
  console.log(`✅ [Emiten Extraction] 'ridho pemilik goto?' -> ${emitenGoto?.ticker} (${emitenGoto?.fullName})`);

  const emitenBCA = extractEmitenMention("apakah saham bbca akan bagi dividen");
  assert.strictEqual(emitenBCA?.ticker, "BBCA");
  console.log(`✅ [Emiten Extraction] 'bbca' -> ${emitenBCA?.ticker}`);

  const emitenDynamic = extractEmitenMention("Saham BREN melesat 10 persen");
  assert.strictEqual(emitenDynamic?.ticker, "BREN");
  console.log(`✅ [Emiten Extraction] Dynamic ticker BREN -> ${emitenDynamic?.ticker}`);

  const emitenNone = extractEmitenMention("resep rendang padang asli");
  assert.strictEqual(emitenNone, null);
  console.log(`✅ [Emiten Extraction] Non-emiten query returns null cleanly`);

  const commonWordsNone = extractEmitenMention("KAMI KITA BISA PADA SAAT HARI INI");
  assert.strictEqual(commonWordsNone, null);
  console.log(`✅ [Emiten Extraction] Common uppercase 4-letter words cleanly ignored`);
}

console.log("\n🎉 ALL ECONOMIC CLASSIFICATION & SOURCE TESTS PASSED SUCCESSFULLY!");
