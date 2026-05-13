"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { insertMealPlanDays, linkUnlinkedOnHandItems } from "@/lib/supabase/queries";
import { tokens } from "@/lib/tokens";

// Each message maps to a real backend step:
//   0 "Searching for recipes…"   → Claude + web search running
//   1 "Matching your preferences…" → recipes parsed & validated
//   2 "Building your week…"      → inserting meal_plan_days to DB
//   3 "Almost there…"            → about to navigate
const MESSAGES = [
  "Searching for recipes…",
  "Matching your preferences…",
  "Building your week…",
  "Almost there…",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      flex: "1 1 0", minWidth: 0,
      background: tokens.colors.neutral[0],
      border: `1px solid ${tokens.colors.neutral[200]}`,
      borderRadius: tokens.radius.lg,
      padding: "12px",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ height: 14, borderRadius: 6, background: tokens.colors.neutral[100], width: "80%" }} />
      <div style={{ height: 11, borderRadius: 6, background: tokens.colors.neutral[100], width: "55%" }} />
      <div style={{ display: "flex", gap: 4 }}>
        {[40, 52, 36].map((w, i) => (
          <div key={i} style={{ height: 20, width: w, borderRadius: 9999, background: tokens.colors.neutral[100] }} />
        ))}
      </div>
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
      background: done
        ? tokens.colors.primary[500]
        : active
          ? tokens.colors.primary[300]
          : tokens.colors.neutral[200],
      transition: "background 0.3s",
    }} />
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

function GeneratingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("planId");
  const householdId = params.get("householdId");
  const daysCount = Math.max(1, Math.min(7, parseInt(params.get("days") ?? "7", 10)));
  const startDayIndex = Math.max(0, Math.min(6, parseInt(params.get("startDay") ?? "0", 10)));

  const [msgIndex, setMsgIndex] = useState(0);
  const [phase, setPhase] = useState<"loading" | "error">("loading");
  const [retryKey, setRetryKey] = useState(0);

  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    if (!planId || !householdId) {
      routerRef.current.replace("/home");
      return;
    }

    const ctrl = new AbortController();
    setPhase("loading");
    setMsgIndex(0);

    let isCleanup = false;
    const timeoutId = setTimeout(() => {
      if (!isCleanup) {
        ctrl.abort();
        setPhase("error");
      }
    }, 90_000);

    async function run() {
      try {
        const res = await fetch("/api/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ household_id: householdId, days: daysCount }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? `Server error ${res.status}`);
        }

        // ── Read the NDJSON stream ───────────────────────────────────────────
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let recipes: unknown[] = [];

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as {
              type: string;
              step?: string;
              recipes?: unknown[];
              count?: number;
              message?: string;
            };

            if (event.type === "progress") {
              if (event.step === "searching") setMsgIndex(0);
              else if (event.step === "matching") setMsgIndex(1);
              // "topup" keeps showing "Searching…" (already at 0 from the re-send)
            } else if (event.type === "done") {
              recipes = event.recipes ?? [];
              break outer;
            } else if (event.type === "error") {
              throw new Error(event.message ?? "Generation failed");
            }
          }
        }

        // ── Building phase: insert days to DB ────────────────────────────────
        setMsgIndex(2);
        const supabase = createClient();

        const dayRows: { meal_plan_id: string; day_index: number; option_a: unknown; option_b: unknown }[] = [];
        for (let i = 0; i < daysCount; i++) {
          const dayIndex = startDayIndex + i;
          if (dayIndex > 6) break;
          dayRows.push({
            meal_plan_id: planId!,
            day_index: dayIndex,
            option_a: recipes[i * 2] ?? null,
            option_b: recipes[i * 2 + 1] ?? null,
          });
        }

        const { error: daysErr } = await insertMealPlanDays(supabase, dayRows);
        if (daysErr) throw new Error(daysErr.message);

        await linkUnlinkedOnHandItems(supabase, householdId!, planId!);

        // ── Finishing ────────────────────────────────────────────────────────
        setMsgIndex(3);
        await new Promise((r) => setTimeout(r, 600));

        clearTimeout(timeoutId);
        routerRef.current.replace(`/plan/${planId}`);
      } catch (err) {
        clearTimeout(timeoutId);
        if (ctrl.signal.aborted && !isCleanup) return; // timeout already set error state
        if (ctrl.signal.aborted) return; // cleanup on unmount
        console.error("[generating]", err);
        setPhase("error");
      }
    }

    run();
    return () => {
      isCleanup = true;
      ctrl.abort();
      clearTimeout(timeoutId);
    };
  }, [planId, householdId, retryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Error state ────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "calc(100vh - 72px)", padding: "0 24px", textAlign: "center",
        background: tokens.colors.neutral[50],
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: tokens.colors.danger[100],
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke={tokens.colors.danger[600]} strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: tokens.colors.neutral[900], marginBottom: 8 }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: "14px", color: tokens.colors.neutral[500], lineHeight: 1.5, maxWidth: 280, marginBottom: 24 }}>
          Something went wrong finding recipes. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          style={{
            padding: "14px 28px", borderRadius: tokens.radius.lg,
            background: `linear-gradient(160deg, ${tokens.colors.primary[500]}, ${tokens.colors.primary[600]})`,
            color: "#fff", fontSize: "15px", fontWeight: 600,
            border: "none", cursor: "pointer",
            boxShadow: tokens.shadow.cta, fontFamily: "inherit",
          }}>
          Retry
        </button>
      </div>
    );
  }

  // ── Loading / skeleton state ───────────────────────────────────────────────
  return (
    <div style={{ background: tokens.colors.neutral[50], minHeight: "calc(100vh - 72px)", padding: "28px 20px 24px" }}>

      {/* Status header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 28, height: 28, flexShrink: 0,
          border: `3px solid ${tokens.colors.primary[200]}`,
          borderTopColor: tokens.colors.primary[500],
          borderRadius: "50%",
          animation: "spin 0.9s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: tokens.colors.neutral[900], margin: 0, transition: "opacity 0.2s" }}>
            {MESSAGES[msgIndex]}
          </p>
          <p style={{ fontSize: "12px", color: tokens.colors.neutral[400], margin: 0 }}>
            This usually takes 20–40 seconds
          </p>
        </div>
      </div>

      {/* Step progress dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28 }}>
        {MESSAGES.map((_, i) => (
          <StepDot key={i} active={i === msgIndex} done={i < msgIndex} />
        ))}
      </div>

      {/* Skeleton rows */}
      {DAYS.slice(0, daysCount).map((day) => (
        <div key={day} style={{ marginBottom: 20 }}>
          <div style={{ height: 12, width: 70, borderRadius: 6, background: tokens.colors.neutral[200], marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GeneratingPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "calc(100vh - 72px)", background: tokens.colors.neutral[50],
      }}>
        <div style={{
          width: 28, height: 28,
          border: `3px solid ${tokens.colors.primary[200]}`,
          borderTopColor: tokens.colors.primary[500],
          borderRadius: "50%", animation: "spin 0.9s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <GeneratingContent />
    </Suspense>
  );
}
