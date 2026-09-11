export type VerificationStatus = "FAKTA" | "HOAX" | "TIDAK_DAPAT_DIPASTIKAN";

export interface VerificationSource {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

export interface VerificationResult {
  id: string;
  query: string;
  inputType: "url" | "text";
  status: VerificationStatus;
  confidenceScore: number; // 0 - 100
  alasan: string;
  ringkasanFakta: string[];
  sources: VerificationSource[];
  timestamp: string;
}

export type VerificationStage =
  | "idle"
  | "validation"
  | "extraction"
  | "searching"
  | "scraping"
  | "analyzing"
  | "synthesizing"
  | "completed"
  | "error";

export interface VerificationState {
  isLoading: boolean;
  stage: VerificationStage;
  stageMessage: string;
  result: VerificationResult | null;
  error: string | null;
}
