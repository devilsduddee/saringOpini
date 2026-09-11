import { verificationResultSchema } from "../schemas";
import assert from "node:assert";

const validSource = {
  title: "Kompas News",
  url: "https://kompas.com/read/123",
  domain: "kompas.com",
};

console.log("[TEST] Running schema validation tests...");

// Test 1: FAKTA with valid ringkasanFakta
{
  const data = {
    status: "FAKTA",
    confidenceScore: 92,
    alasan: "Informasi ini telah diverifikasi oleh kementerian terkait.",
    ringkasanFakta: ["Surat edaran resmi nomor 123 telah diterbitkan."],
    sources: [validSource],
  };
  const result = verificationResultSchema.safeParse(data);
  assert.strictEqual(result.success, true, "FAKTA with facts should succeed");
  console.log("✅ Test 1 Passed: FAKTA with ringkasanFakta passes");
}

// Test 2: FAKTA with empty ringkasanFakta must fail
{
  const data = {
    status: "FAKTA",
    confidenceScore: 90,
    alasan: "Klaim ini benar sesuai dokumen resmi.",
    ringkasanFakta: [],
    sources: [validSource],
  };
  const result = verificationResultSchema.safeParse(data);
  assert.strictEqual(result.success, false, "FAKTA with empty facts must fail");
  console.log("✅ Test 2 Passed: FAKTA with empty ringkasanFakta fails as expected");
}

// Test 3: HOAX with debunking findings
{
  const data = {
    status: "HOAX",
    confidenceScore: 95,
    alasan: "Klaim kuota gratis adalah penipuan phishing berantai.",
    ringkasanFakta: ["Kominfo tidak pernah merilis program kuota gratis pada domain tersebut."],
    sources: [validSource],
  };
  const result = verificationResultSchema.safeParse(data);
  assert.strictEqual(result.success, true, "HOAX with debunking points should succeed");
  console.log("✅ Test 3 Passed: HOAX with debunking findings passes");
}

// Test 4: TIDAK_DAPAT_DIPASTIKAN with empty ringkasanFakta must succeed
{
  const data = {
    status: "TIDAK_DAPAT_DIPASTIKAN",
    confidenceScore: 25,
    alasan: "Tidak ditemukan bukti pemberitaan resmi atau konfirmasi kredibel terkait klaim politik ini.",
    ringkasanFakta: [],
    sources: [],
  };
  const result = verificationResultSchema.safeParse(data);
  assert.strictEqual(result.success, true, "TIDAK_DAPAT_DIPASTIKAN with empty facts should succeed");
  assert.strictEqual(result.data.ringkasanFakta.length, 0, "ringkasanFakta should be empty array");
  console.log("✅ Test 4 Passed: TIDAK_DAPAT_DIPASTIKAN with empty ringkasanFakta passes");
}

// Test 5: "Purbaya jadi presiden 2029" query scenario
{
  const data = {
    status: "TIDAK_DAPAT_DIPASTIKAN",
    confidenceScore: 20,
    alasan: "Klaim mengenai pencalonan atau penetapan figur tertentu sebagai presiden 2029 merupakan opini spekulatif tanpa dasar pengumuman resmi dari instansi pemilu atau partai politik pengusung.",
    ringkasanFakta: [],
    sources: [],
  };
  const result = verificationResultSchema.safeParse(data);
  assert.strictEqual(result.success, true, "'Purbaya jadi presiden 2029' scenario must succeed without error");
  console.log("✅ Test 5 Passed: 'Purbaya jadi presiden 2029' scenario passes cleanly");
}

console.log("\n🎉 ALL 5 SCHEMA VALIDATION TESTS PASSED!");
