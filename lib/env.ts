import { z } from "zod";

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().optional().default(""),
  OPENROUTER_MODEL: z.string().optional().default("google/gemini-2.5-flash"),
  GROQ_API_KEY: z.string().optional().default(""),
  GROQ_MODEL: z.string().optional().default("llama-3.3-70b-versatile"),
  TAVILY_API_KEY: z.string().min(1, "TAVILY_API_KEY wajib diisi"),
  JINA_API_KEY: z.string().min(1, "JINA_API_KEY wajib diisi"),
}).refine((data) => data.OPENROUTER_API_KEY || data.GROQ_API_KEY, {
  message: "Setidaknya salah satu dari OPENROUTER_API_KEY atau GROQ_API_KEY harus diisi di .env",
});

export type EnvConfig = z.infer<typeof envSchema>;

export function getEnvConfig(): { success: true; data: EnvConfig } | { success: false; error: string } {
  const result = envSchema.safeParse({
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
    GROQ_API_KEY: process.env.GROQ_API_KEY || "",
    GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
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
