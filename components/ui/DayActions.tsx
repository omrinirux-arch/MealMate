"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@/lib/tokens";

interface Props {
  planId: string;
  dayIndex: number;
  selectedOption: "a" | "b" | "skip" | null;
  skipAction: (formData: FormData) => Promise<void>;
  unskipAction: (formData: FormData) => Promise<void>;
}

export function DayActions({ planId, dayIndex, selectedOption, skipAction, unskipAction }: Props) {
  const router = useRouter();
  const [isSkipPending, startSkipTransition] = useTransition();
  const [isRegenPending, setIsRegenPending] = useState(false);

  const isSkipped = selectedOption === "skip";
  const isPending = isSkipPending || isRegenPending;

  function handleSkip() {
    const fd = new FormData();
    fd.append("planId", planId);
    fd.append("dayIndex", String(dayIndex));
    startSkipTransition(() => (isSkipped ? unskipAction : skipAction)(fd));
  }

  async function handleRegen() {
    setIsRegenPending(true);
    try {
      const res = await fetch("/api/regenerate-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId, day_index: dayIndex }),
      });
      if (!res.ok) {
        console.error("[DayActions] regenerate-day failed", await res.text());
      }
      router.refresh();
    } finally {
      setIsRegenPending(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>

      {/* Skip / Undo skip */}
      <button
        type="button"
        onClick={handleSkip}
        disabled={isPending}
        style={{
          fontSize: "11px",
          fontWeight: 500,
          color: isSkipped ? tokens.colors.primary[600] : tokens.colors.neutral[400],
          background: "none",
          border: "none",
          cursor: isPending ? "not-allowed" : "pointer",
          padding: "3px 6px",
          fontFamily: "inherit",
          opacity: isPending ? 0.5 : 1,
          letterSpacing: "0.01em",
        }}
      >
        {isSkipped ? "Undo skip" : "Skip day"}
      </button>

      {/* Divider */}
      <span style={{ color: tokens.colors.neutral[200], fontSize: "11px", userSelect: "none" }}>|</span>

      {/* Regenerate this day */}
      <button
        type="button"
        onClick={handleRegen}
        disabled={isPending}
        title="Regenerate suggestions for this day"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          cursor: isPending ? "not-allowed" : "pointer",
          color: tokens.colors.neutral[400],
          padding: "3px 4px",
          opacity: isRegenPending ? 0.5 : 1,
          fontFamily: "inherit",
        }}
      >
        {isRegenPending ? (
          <>
            <span style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              border: `2px solid ${tokens.colors.neutral[200]}`,
              borderTopColor: tokens.colors.neutral[500],
              display: "inline-block",
              animation: "dayActionspin 0.7s linear infinite",
              flexShrink: 0,
            }} />
            <style>{`@keyframes dayActionspin { to { transform: rotate(360deg); } }`}</style>
          </>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        )}
      </button>

    </div>
  );
}
