"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getHouseholdForUser,
  createDraftMealPlan,
  insertOnHandItems,
  archiveMealPlan,
} from "@/lib/supabase/queries";
import { tokens } from "@/lib/tokens";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

// ── Icons ───────────────────────────────────────────────────

function IconX({ size = 10, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color ?? tokens.colors.neutral[400]} strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ── Main page ──────────────────────────────────────────────

function PlanNewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPlanId = searchParams.get("fromPlanId");
  const inputRef = useRef<HTMLInputElement>(null);

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [includeToday, setIncludeToday] = useState(false);
  const [daysCount, setDaysCount] = useState(7);

  // 0=Mon … 6=Sun
  const todayDayIndex = (() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  })();
  const startDayIndex = includeToday ? todayDayIndex : todayDayIndex + 1;

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }
      const membership = await getHouseholdForUser(supabase, user.id);
      if (!membership) { router.push("/household/create"); return; }
      setHouseholdId(membership.household_id);

      if (fromPlanId) {
        const { data } = await supabase
          .from("on_hand_items")
          .select("name")
          .eq("meal_plan_id", fromPlanId);
        if (data && data.length > 0) {
          setItems(data.map((i: { name: string }) => i.name));
        }
      }
    }
    load();
  }, [router, fromPlanId]);

  const addItem = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setItems(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
    setInputValue("");
  }, [inputValue]);

  const removeItem = useCallback((item: string) => {
    setItems(prev => prev.filter(i => i !== item));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
    if (e.key === "Backspace" && !inputValue && items.length > 0) {
      setItems(prev => prev.slice(0, -1));
    }
  };

  async function proceed(withItems: string[]) {
    if (!householdId) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (fromPlanId) {
      await archiveMealPlan(supabase, fromPlanId);
    }

    const { data: plan, error: planErr } = await createDraftMealPlan(supabase, householdId);
    if (planErr || !plan) {
      setError(planErr?.message ?? "Failed to start plan generation");
      setLoading(false);
      return;
    }

    if (withItems.length > 0) {
      const rows = withItems.map(name => ({
        household_id: householdId,
        meal_plan_id: plan.id,
        name,
      }));
      const { error: itemErr } = await insertOnHandItems(supabase, rows);
      if (itemErr) {
        setError(itemErr.message);
        setLoading(false);
        return;
      }
    }

    router.push(`/plan/generating?planId=${plan.id}&householdId=${householdId}&days=${daysCount}&startDay=${startDayIndex}`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 72px)", background: tokens.colors.neutral[50] }}>

      {/* ── Header ── */}
      <div style={{ padding: "40px 24px 24px" }}>
        {fromPlanId && (
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              color: tokens.colors.neutral[500], fontSize: "14px", fontWeight: 500,
              padding: 0, marginBottom: 20, fontFamily: "inherit",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
        )}
        <div style={{ width: 52, height: 52, borderRadius: tokens.radius.lg, background: tokens.colors.primary[100], display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={tokens.colors.primary[600]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
          </svg>
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: tokens.colors.neutral[900], letterSpacing: tokens.typography.letterSpacing.heading, lineHeight: 1.25, marginBottom: 8 }}>
          Anything on hand you<br />want to use this week?
        </h1>
        <p style={{ fontSize: "15px", color: tokens.colors.neutral[500], lineHeight: 1.5 }}>
          We&apos;ll prioritize recipes that use these up.
        </p>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: "0 20px" }}>

        {error && <div style={{ marginBottom: 16 }}><ErrorBanner message={error} /></div>}

        {/* Tag input */}
        <div
          style={{
            background: tokens.colors.neutral[0],
            border: `1.5px solid ${tokens.colors.neutral[200]}`,
            borderRadius: tokens.radius.lg,
            padding: "12px 14px",
            display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
            minHeight: 56, cursor: "text",
            boxShadow: tokens.shadow.sm,
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {items.map(item => (
            <span key={item} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              paddingLeft: 12, paddingRight: 6, paddingTop: 6, paddingBottom: 6,
              borderRadius: 9999, fontSize: "14px", fontWeight: 500,
              background: tokens.colors.primary[100], color: tokens.colors.primary[700],
              border: `1px solid ${tokens.colors.primary[200]}`,
            }}>
              {item}
              <button type="button" onClick={() => removeItem(item)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: tokens.colors.primary[200], cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
                <IconX size={8} color={tokens.colors.primary[700]} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={items.length === 0 ? "e.g. chicken thighs, zucchini…" : "Add another item…"}
            style={{ flex: "1 1 160px", minWidth: 100, border: "none", background: "transparent", outline: "none", fontSize: "15px", color: tokens.colors.neutral[900], fontFamily: "inherit" }}
          />
        </div>

        {inputValue.trim() && (
          <button type="button" onClick={addItem}
            style={{ marginTop: 10, fontSize: "14px", fontWeight: 600, color: tokens.colors.primary[600], background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
            + Add &ldquo;{inputValue.trim()}&rdquo;
          </button>
        )}

        <p style={{ marginTop: 10, fontSize: "12px", color: tokens.colors.neutral[400] }}>
          Press Enter to add each item
        </p>

        {items.length > 0 && (
          <p style={{ marginTop: 20, fontSize: "13px", color: tokens.colors.neutral[500] }}>
            <strong style={{ color: tokens.colors.neutral[700] }}>{items.length} item{items.length !== 1 ? "s" : ""}</strong> will be prioritized in your plan.
          </p>
        )}

        {/* Days + today card */}
        <div style={{
          marginTop: 28,
          background: tokens.colors.neutral[0],
          border: `1.5px solid ${tokens.colors.neutral[200]}`,
          borderRadius: tokens.radius.lg,
          boxShadow: tokens.shadow.sm,
          overflow: "hidden",
        }}>
          {/* Stepper row */}
          <div style={{
            padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <p style={{ fontSize: "15px", fontWeight: 600, color: tokens.colors.neutral[800], margin: 0 }}>
                Days to plan
              </p>
              <p style={{ fontSize: "13px", color: tokens.colors.neutral[500], margin: "2px 0 0" }}>
                {daysCount === 1 ? "Next 1 day" : `Next ${daysCount} days`}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => setDaysCount(d => Math.max(1, d - 1))}
                disabled={daysCount <= 1 || 7 <= 1}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  border: `1.5px solid ${daysCount <= 1 ? tokens.colors.neutral[200] : tokens.colors.neutral[300]}`,
                  background: "transparent",
                  color: daysCount <= 1 ? tokens.colors.neutral[300] : tokens.colors.neutral[700],
                  fontSize: "20px", fontWeight: 400, lineHeight: 1,
                  cursor: daysCount <= 1 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >
                −
              </button>
              <span style={{ fontSize: "22px", fontWeight: 700, color: tokens.colors.neutral[900], minWidth: 20, textAlign: "center" }}>
                {daysCount}
              </span>
              <button
                type="button"
                onClick={() => setDaysCount(d => Math.min(7, d + 1))}
                disabled={daysCount >= 7}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  border: `1.5px solid ${daysCount >= 7 ? tokens.colors.neutral[200] : tokens.colors.neutral[300]}`,
                  background: "transparent",
                  color: daysCount >= 7 ? tokens.colors.neutral[300] : tokens.colors.neutral[700],
                  fontSize: "20px", fontWeight: 400, lineHeight: 1,
                  cursor: daysCount >= 7 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: tokens.colors.neutral[100], margin: "0 16px" }} />

          {/* Include today row */}
          <div style={{
            padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <p style={{ fontSize: "15px", fontWeight: 600, color: tokens.colors.neutral[800], margin: 0 }}>
                Include today
              </p>
              <p style={{ fontSize: "13px", color: tokens.colors.neutral[500], margin: "2px 0 0" }}>
                {includeToday ? "Starting from today" : "Starting from tomorrow"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={includeToday}
              onClick={() => setIncludeToday(v => !v)}
              style={{
                position: "relative",
                width: 44, height: 26,
                borderRadius: 13,
                background: includeToday ? tokens.colors.primary[500] : tokens.colors.neutral[200],
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s",
                flexShrink: 0,
                padding: 0,
              }}
            >
              <span style={{
                position: "absolute",
                top: 3,
                left: includeToday ? 21 : 3,
                width: 20, height: 20,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.18s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
              }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        position: "sticky", bottom: 0,
        background: tokens.colors.neutral[50],
        borderTop: `1px solid ${tokens.colors.neutral[200]}`,
        padding: "14px 20px 24px",
        display: "flex", gap: 10,
      }}>
        <button type="button" onClick={() => proceed([])} disabled={loading}
          style={{
            flex: "0 0 auto", padding: "15px 20px",
            borderRadius: tokens.radius.lg,
            background: "transparent",
            border: `1.5px solid ${tokens.colors.neutral[300]}`,
            color: tokens.colors.neutral[700],
            fontSize: "15px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            fontFamily: "inherit",
          }}>
          Skip
        </button>
        <button type="button" onClick={() => proceed(items)} disabled={loading}
          style={{
            flex: 1, padding: "15px",
            borderRadius: tokens.radius.lg,
            background: loading
              ? tokens.colors.primary[400]
              : `linear-gradient(160deg, ${tokens.colors.primary[500]} 0%, ${tokens.colors.primary[600]} 100%)`,
            color: "#fff",
            fontSize: "16px", fontWeight: 600,
            letterSpacing: "-0.01em",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : tokens.shadow.cta,
            transition: "all 0.12s ease",
            fontFamily: "inherit",
            opacity: loading ? 0.8 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          {loading ? "Starting…" : "Generate Plan"}
          {!loading && <IconSparkle />}
        </button>
      </div>
    </div>
  );
}

export default function PlanNewPage() {
  return (
    <Suspense>
      <PlanNewInner />
    </Suspense>
  );
}
