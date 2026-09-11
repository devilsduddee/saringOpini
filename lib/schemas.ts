import { z } from "zod";

export const verificationInputSchema = z.object({
  query: z
    .string()
    .min(5, "Input terlalu pendek. Masukkan minimal 5 karakter.")
    .max(5000, "Input melebihi batas maksimal 5000 karakter.")
    .trim(),
});

export const verificationSourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  domain: z.string(),
  snippet: z.string().optional(),
});

export const verificationResultSchema = z
  .object({
    status: z.enum(["FAKTA", "HOAX", "TIDAK_DAPAT_DIPASTIKAN"]),
    confidenceScore: z.number().int().min(0).max(100),
    alasan: z.string().min(10, "Alasan harus memiliki minimal 10 karakter."),
    ringkasanFakta: z.array(z.string()).default([]),
    sources: z.array(verificationSourceSchema),
  })
  .superRefine((data, ctx) => {
    if (data.status === "FAKTA" && data.ringkasanFakta.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ringkasanFakta"],
        message: "Status FAKTA wajib menyertakan minimal 1 poin ringkasan fakta terkonfirmasi.",
      });
    }
  });

export type VerificationInput = z.infer<typeof verificationInputSchema>;
export type VerificationResultPayload = z.infer<typeof verificationResultSchema>;

