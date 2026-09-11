"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { VerificationForm } from "@/components/verification/VerificationForm";
import { LoadingState } from "@/components/verification/LoadingState";
import { ResultCard } from "@/components/verification/ResultCard";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { VerificationResult, VerificationState, VerificationStage } from "@/types/verification";
import { animateHeroReveal, animateResultCard, smoothCenterInViewport } from "@/lib/gsap";
import { AlertCircle } from "lucide-react";

export default function HomePage() {
  const [state, setState] = useState<VerificationState>({
    isLoading: false,
    stage: "idle",
    stageMessage: "",
    result: null,
    error: null,
  });

  const [progressPercent, setProgressPercent] = useState<number>(0);

  useEffect(() => {
    const cleanup = animateHeroReveal("#hero-section");
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // When result arrives, smoothly scroll to result card first, then trigger reveal animation
  useEffect(() => {
    if (state.result && !state.isLoading) {
      // Allow DOM to mount the ResultCard
      requestAnimationFrame(() => {
        smoothCenterInViewport("#result-card", {
          duration: 0.5,
          onComplete: () => {
            animateResultCard("#result-card");
          },
        });
      });
    }
  }, [state.result, state.isLoading]);

  const handleVerify = async (query: string) => {
    console.log(`[Client] Submitting query for real-time verification: "${query.slice(0, 80)}..."`);
    const t0 = performance.now();

    setState({
      isLoading: true,
      stage: "validation",
      stageMessage: "Menghubungkan ke gateway verifikasi...",
      result: null,
      error: null,
    });
    setProgressPercent(10);

    // Smoothly scroll and center the loading pipeline immediately
    requestAnimationFrame(() => {
      smoothCenterInViewport("#verification-loader-container", {
        duration: 0.5,
      });
    });

    try {
      console.log(`[Client] Initiating SSE stream from /api/verify/stream...`);
      const response = await fetch("/api/verify/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Koneksi stream gagal (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace(/^data:\s*/, "").trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr) as {
                type: "stage" | "complete" | "error";
                stage?: VerificationStage;
                stageMessage?: string;
                progressPercent?: number;
                data?: VerificationResult;
                error?: string;
              };

              if (event.type === "stage") {
                console.log(`[SSE Stage] ${event.stage} (${event.progressPercent}%): ${event.stageMessage}`);
                setState((prev) => ({
                  ...prev,
                  stage: event.stage || prev.stage,
                  stageMessage: event.stageMessage || prev.stageMessage,
                }));
                if (typeof event.progressPercent === "number") {
                  setProgressPercent(event.progressPercent);
                }
              } else if (event.type === "complete" && event.data) {
                const duration = (performance.now() - t0).toFixed(0);
                console.log(`[SSE Complete] Real pipeline verified in ${duration}ms!`, event.data);
                setProgressPercent(100);

                setTimeout(() => {
                  setState({
                    isLoading: false,
                    stage: "completed",
                    stageMessage: "Selesai",
                    result: event.data!,
                    error: null,
                  });
                }, 250);
                return;
              } else if (event.type === "error") {
                console.error(`[SSE Error]:`, event.error);
                setState({
                  isLoading: false,
                  stage: "error",
                  stageMessage: "",
                  result: null,
                  error: event.error || "Gagal memproses verifikasi.",
                });
                return;
              }
            } catch (parseErr) {
              console.warn(`[SSE Parse Warning]:`, parseErr);
            }
          }
        }
      }
    } catch (err) {
      const duration = (performance.now() - t0).toFixed(0);
      console.error(`[Client] Stream reader error (${duration}ms):`, err);
      setState({
        isLoading: false,
        stage: "error",
        stageMessage: "",
        result: null,
        error: err instanceof Error ? err.message : "Terjadi kendala koneksi server.",
      });
    }
  };

  const handleReset = () => {
    setProgressPercent(0);
    setState({
      isLoading: false,
      stage: "idle",
      stageMessage: "",
      result: null,
      error: null,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0D0D0D] text-white">
      <Navbar />

      <main className="flex-1">
        <HeroSection />

        <section aria-labelledby="verification-heading" className="py-6 md:py-8 px-4 sm:px-6 lg:px-8 bg-[#0D0D0D]">
          <h2 id="verification-heading" className="sr-only">
            Alat Verifikasi Fakta
          </h2>

          <VerificationForm onVerify={handleVerify} isLoading={state.isLoading} />

          {state.error && (
            <div 
              role="alert"
              className="w-full max-w-[960px] mx-auto my-6 p-4 rounded-2xl bg-[#EF4444]/10 border-2 border-[#EF4444]/40 text-[#EF4444] flex items-start gap-3 text-sm font-semibold"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="block text-white mb-0.5">Pemberitahuan Sistem:</strong>
                <span>{state.error}</span>
              </div>
            </div>
          )}

          {state.isLoading && (
            <LoadingState 
              stage={state.stage} 
              stageMessage={state.stageMessage} 
              progressPercent={progressPercent} 
            />
          )}

          {state.result && !state.isLoading && (
            <ResultCard result={state.result} onReset={handleReset} />
          )}
        </section>

        <HowItWorksSection />
        <FAQSection />
      </main>

      <Footer />
    </div>
  );
}
