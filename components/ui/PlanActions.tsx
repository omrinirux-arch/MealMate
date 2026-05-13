"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@/lib/tokens";

interface Props {
  planId: string;
  selectedCount: number;
  totalDays: number;
  confirmAction: (formData: FormData) => Promise<void>;
}

export function PlanActions({ planId, selectedCount, totalDays, confirmAction }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const allSelected = selectedCount >= totalDays;
  const remaining = totalDays - selectedCount;

  function handleConfirm() {
    const formData = new FormData();
    formData.append("planId", planId);
    startTransition(() => confirmAction(formData));
  }

  return (
    <div style={{
      position: "sticky",
      bottom: 72, // sits above the 72px fixed bottom nav
      padding: "12px 20px",
      background: tokens.colors.neutral[0],
      borderTop: `1px solid ${tokens.colors.neutral[200]}`,
      boxShadow: "0 -4px 16px rgba(53,47,45,0.07)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      zIndex: 10,
    }}>

      {/* Progress hint */}
      {!allSelected && (
        <p style={{
          fontSize: "12px",
          color: tokens.colors.neutral[500],
          textAlign: "center",
          margin: 0,
        }}>
          Select or skip {remaining} more {remaining === 1 ? "day" : "days"} to continue
        </p>
      )}

      {/* Accept plan button */}
      <button
        onClick={handleConfirm}
        disabled={!allSelected || isPending}
        style={{
          width: "100%",
          padding: "15px",
          borderRadius: tokens.radius.lg,
          background: allSelected && !isPending
            ? `linear-gradient(160deg, ${tokens.colors.primary[500]} 0%, ${tokens.colors.primary[600]} 100%)`
            : tokens.colors.neutral[200],
          color: allSelected && !isPending ? "#fff" : tokens.colors.neutral[400],
          border: "none",
          fontSize: "15px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          cursor: allSelected && !isPending ? "pointer" : "not-allowed",
          boxShadow: allSelected && !isPending ? tokens.shadow.cta : "none",
          transition: "all 0.15s ease",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {isPending ? (
          <>
            <span style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.4)",
              borderTopColor: "#fff",
              animation: "spin 0.7s linear infinite",
              flexShrink: 0,
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Building your list…
          </>
        ) : (
          "Accept plan"
        )}
      </button>

      {/* Regenerate button */}
      <button
        onClick={() => router.push(`/plan/new?fromPlanId=${planId}`)}
        disabled={isPending}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: tokens.radius.lg,
          background: "transparent",
          color: tokens.colors.neutral[500],
          border: `1px solid ${tokens.colors.neutral[200]}`,
          fontSize: "14px",
          fontWeight: 500,
          cursor: isPending ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 4v6h-6" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        Regenerate plan
      </button>

    </div>
  );
}
