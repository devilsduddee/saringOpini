import { z } from "zod";

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY wajib diisi"),
  OPENROUTER_MODEL: z.string().min(1, "OPENROUTER_MODEL wajib diisi di environment (.env / .env.local)"),
  TAVILY_API_KEY: z.string().min(1, "TAVILY_API_KEY wajib diisi"),
  JINA_API_KEY: z.string().min(1, "JINA_API_KEY wajib diisi"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function getEnvConfig(): { success: true; data: EnvConfig } | { success: false; error: string } {
  const result = envSchema.safeParse({
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    JINA_API_KEY: process.env.JINA_API_KEY,
  });

  if (!result.success) {
    const missingKeys = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    return {
      success: false,
      error: `Konfigurasi environment belum lengkap atau tidak valid (${missingKeys}). Harap periksa file .env`,
    };
  }

  return { success: true, data: result.data };
}
