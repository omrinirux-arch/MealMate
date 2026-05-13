"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { tokens } from "@/lib/tokens";

interface Props {
  planId: string;
  householdId: string;
}

export function GroceryRetryButton({ planId, householdId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleRetry() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-grocery-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId, household_id: householdId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Failed to generate list");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={handleRetry}
        disabled={loading}
        style={{
          padding: "13px 28px",
          borderRadius: tokens.radius.lg,
          background: loading
            ? tokens.colors.primary[300]
            : `linear-gradient(160deg, ${tokens.colors.primary[500]}, ${tokens.colors.primary[600]})`,
          color: "#fff",
          fontSize: "15px",
          fontWeight: 600,
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : tokens.shadow.cta,
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {loading && (
          <span style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.4)",
            borderTopColor: "#fff",
            animation: "spin 0.7s linear infinite",
            flexShrink: 0,
          }} />
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {loading ? "Building your list…" : "Retry"}
      </button>
      {error && (
        <p style={{ fontSize: "13px", color: tokens.colors.danger[500], margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
