"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getHouseholdForUser,
  getHouseholdPreferences,
  upsertHouseholdPreferences,
} from "@/lib/supabase/queries";
import { tokens } from "@/lib/tokens";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { OnboardingProgress } from "@/components/ui/OnboardingProgress";

// ── Data ──────────────────────────────────────────────────

const DIETARY_GOALS = [
  { id: "lower-cholesterol", label: "Lower cholesterol" },
  { id: "lose-weight",       label: "Lose weight" },
  { id: "build-muscle",      label: "Build muscle / high protein" },
  { id: "heart-healthy",     label: "Heart healthy" },
  { id: "low-sodium",        label: "Low sodium" },
  { id: "balanced",          label: "Balanced / no specific goal" },
] as const;

const RECIPE_STYLES = [
  { id: "quick",        label: "Quick & easy",          sub: "under 30 min" },
  { id: "one-pan",      label: "One-pan / one-pot",     sub: null },
  { id: "meal-prep",    label: "Meal prep friendly",    sub: "great leftovers" },
  { id: "involved",     label: "More involved",         sub: "weekend project" },
  { id: "kid-friendly", label: "Kid-friendly",          sub: "mild flavors" },
] as const;

type SpiceLevel = "none" | "mild" | "medium" | "hot";

const SPICE_LEVELS: { id: SpiceLevel; label: string; emoji: string }[] = [
  { id: "none",   label: "None",   emoji: "🧊" },
  { id: "mild",   label: "Mild",   emoji: "🌿" },
  { id: "medium", label: "Medium", emoji: "🌶️" },
  { id: "hot",    label: "Hot",    emoji: "🔥" },
];

// ── Icons ─────────────────────────────────────────────────

function IconCheck({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={tokens.colors.neutral[700]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconX({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color ?? tokens.colors.neutral[400]} strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ── Sub-components ────────────────────────────────────────

function SectionLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{ fontSize: "13px", fontWeight: 700, color: tokens.colors.neutral[600], letterSpacing: "0.03em", textTransform: "uppercase" }}>
        {label}
      </span>
      {hint && <p style={{ fontSize: "13px", color: tokens.colors.neutral[500], marginTop: 2, lineHeight: 1.4 }}>{hint}</p>}
    </div>
  );
}

function PrefChip({ label, sub, active, onToggle }: { label: string; sub?: string | null; active: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: active ? "8px 14px 8px 10px" : "8px 14px",
        borderRadius: 9999,
        background: active ? tokens.colors.primary[600] : tokens.colors.neutral[0],
        color: active ? "#fff" : tokens.colors.neutral[700],
        border: `1.5px solid ${active ? tokens.colors.primary[600] : tokens.colors.neutral[300]}`,
        fontSize: "14px", fontWeight: active ? 600 : 400,
        cursor: "pointer", boxShadow: active ? tokens.shadow.sm : "none",
        transition: "all 0.12s ease", whiteSpace: "nowrap", fontFamily: "inherit",
      }}>
      {active && (
        <span style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IconCheck />
        </span>
      )}
      <span>{label}</span>
      {sub && !active && (
        <span style={{ fontSize: "12px", opacity: 0.65 }}>· {sub}</span>
      )}
    </button>
  );
}

function SpiceSelector({ value, onChange }: { value: SpiceLevel; onChange: (v: SpiceLevel) => void }) {
  return (
    <div style={{ display: "flex", gap: 0, background: tokens.colors.neutral[100], border: `1.5px solid ${tokens.colors.neutral[200]}`, borderRadius: 12, padding: 4 }}>
      {SPICE_LEVELS.map((level) => {
        const active = value === level.id;
        return (
          <button key={level.id} type="button" onClick={() => onChange(level.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 4px 8px", borderRadius: 9, background: active ? tokens.colors.primary[600] : "transparent", border: "none", cursor: "pointer", transition: "all 0.15s ease", boxShadow: active ? tokens.shadow.sm : "none", fontFamily: "inherit" }}>
            <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{level.emoji}</span>
            <span style={{ fontSize: "12px", fontWeight: active ? 700 : 400, color: active ? "#fff" : tokens.colors.neutral[500], letterSpacing: "0.01em" }}>
              {level.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ExclusionTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px 4px 12px", background: tokens.colors.neutral[100], color: tokens.colors.neutral[600], border: `1px solid ${tokens.colors.neutral[200]}`, borderRadius: 9999, fontSize: "13px", fontWeight: 500 }}>
      {label}
      <button type="button" onClick={onRemove} style={{ display: "flex", background: "none", border: "none", cursor: "pointer", padding: 1, opacity: 0.6 }}>
        <IconX size={12} color={tokens.colors.neutral[500]} />
      </button>
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────

export default function PreferencesOnboardingPage() {
  const router = useRouter();
  const exclInputRef = useRef<HTMLInputElement>(null);

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loadingHousehold, setLoadingHousehold] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [goals, setGoals] = useState<Set<string>>(new Set());
  const [styles, setStyles] = useState<Set<string>>(new Set());
  const [spice, setSpice] = useState<SpiceLevel>("mild");
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [exclInput, setExclInput] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      const membership = await getHouseholdForUser(supabase, user.id);
      if (!membership) { router.push("/household/create"); return; }

      const { data: prefs } = await getHouseholdPreferences(supabase, membership.household_id);
      if (prefs) { router.push("/home"); return; }

      setHouseholdId(membership.household_id);
      setLoadingHousehold(false);
    }
    load();
  }, [router]);

  const toggleGoal = useCallback((id: string) => {
    setGoals((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);

  const toggleStyle = useCallback((id: string) => {
    setStyles((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);

  const addExclusion = useCallback((raw: string) => {
    const parts = raw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    setExclusions((prev) => {
      const existing = new Set(prev.map((s) => s.toLowerCase()));
      const toAdd = parts.filter((p) => !existing.has(p.toLowerCase()));
      return [...prev, ...toAdd];
    });
    setExclInput("");
  }, []);

  const handleExclKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && exclInput.trim()) {
      e.preventDefault();
      addExclusion(exclInput);
    }
    if (e.key === "Backspace" && !exclInput && exclusions.length > 0) {
      setExclusions((prev) => prev.slice(0, -1));
    }
  };

  async function handleFinish() {
    if (!householdId) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await upsertHouseholdPreferences(supabase, {
      household_id: householdId,
      dietary_goals: Array.from(goals),
      recipe_style: Array.from(styles),
      spice_tolerance: spice,
      exclusions,
    });

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    // Clear onboarding localStorage
    localStorage.removeItem("mm_ob_staples");
    localStorage.removeItem("mm_ob_tools");

    router.push("/home");
  }

  if (loadingHousehold) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: tokens.colors.neutral[50] }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${tokens.colors.primary[200]}`, borderTopColor: tokens.colors.primary[500], animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: tokens.colors.neutral[50] }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0, background: tokens.colors.neutral[50], boxShadow: "0 1px 0 rgba(53,47,45,0.06)", padding: "16px 20px 20px" }}>
        <OnboardingProgress step={3} />
        <h1 style={{ marginTop: 14, fontSize: "24px", fontWeight: 700, color: tokens.colors.neutral[900], letterSpacing: "-0.025em", lineHeight: 1.2 }}>
          Personalize your<br />meal plan
        </h1>
        <p style={{ marginTop: 6, fontSize: "14px", color: tokens.colors.neutral[500], lineHeight: 1.5 }}>
          Help us suggest recipes that fit your household.
        </p>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "20px 20px 32px" }}>
        {error && <div style={{ marginBottom: 16 }}><ErrorBanner message={error} /></div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Dietary goals */}
          <div>
            <SectionLabel label="Dietary Goals" hint="Select all that apply" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DIETARY_GOALS.map((g) => (
                <PrefChip key={g.id} label={g.label} active={goals.has(g.id)} onToggle={() => toggleGoal(g.id)} />
              ))}
            </div>
          </div>

          {/* Recipe style */}
          <div>
            <SectionLabel label="Recipe Style" hint="What kind of cooking do you prefer?" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {RECIPE_STYLES.map((s) => (
                <PrefChip key={s.id} label={s.label} sub={s.sub} active={styles.has(s.id)} onToggle={() => toggleStyle(s.id)} />
              ))}
            </div>
          </div>

          {/* Spice tolerance */}
          <div>
            <SectionLabel label="Spice Tolerance" />
            <SpiceSelector value={spice} onChange={setSpice} />
          </div>

          {/* Excluded ingredients */}
          <div>
            <SectionLabel label="Exclude Ingredients" hint="We'll avoid these in recipe suggestions." />

            {/* Tag input */}
            <div style={{ background: tokens.colors.neutral[0], border: `1.5px solid ${tokens.colors.neutral[200]}`, borderRadius: tokens.radius.md, padding: "10px 14px", boxShadow: tokens.shadow.sm, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minHeight: 48, cursor: "text" }}
              onClick={() => exclInputRef.current?.focus()}>
              {exclusions.map((tag) => (
                <ExclusionTag key={tag} label={tag} onRemove={() => setExclusions((prev) => prev.filter((e) => e !== tag))} />
              ))}
              <input ref={exclInputRef} value={exclInput} onChange={(e) => setExclInput(e.target.value)} onKeyDown={handleExclKey}
                placeholder={exclusions.length === 0 ? "e.g. mushrooms, shellfish" : "Add more…"}
                style={{ flex: "1 1 120px", minWidth: 80, border: "none", background: "transparent", outline: "none", fontSize: "14px", color: tokens.colors.neutral[900], fontFamily: "inherit" }} />
            </div>
            <p style={{ marginTop: 6, fontSize: "12px", color: tokens.colors.neutral[400] }}>
              Press Enter or comma to add
            </p>
          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 safe-bottom" style={{ background: tokens.colors.neutral[50], borderTop: `1px solid ${tokens.colors.neutral[200]}`, padding: "14px 20px 24px", display: "flex", gap: 10 }}>
        <button type="button" onClick={() => router.push("/onboarding/tools")}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "15px 20px", borderRadius: tokens.radius.lg, background: tokens.colors.neutral[0], border: `1.5px solid ${tokens.colors.neutral[300]}`, color: tokens.colors.neutral[700], fontSize: "15px", fontWeight: 600, cursor: "pointer", boxShadow: tokens.shadow.sm, fontFamily: "inherit", flexShrink: 0 }}>
          <IconChevronLeft />
          Back
        </button>
        <button type="button" onClick={handleFinish} disabled={saving}
          className="flex items-center justify-center"
          style={{ flex: 1, gap: 8, padding: "15px", borderRadius: tokens.radius.lg, background: saving ? tokens.colors.primary[400] : `linear-gradient(160deg, ${tokens.colors.primary[500]} 0%, ${tokens.colors.primary[600]} 100%)`, color: "#fff", fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em", cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : tokens.shadow.cta, transition: "all 0.12s ease", fontFamily: "inherit", opacity: saving ? 0.8 : 1 }}>
          {saving ? "Saving…" : "Finish Setup"}
          {!saving && <IconSparkle />}
        </button>
      </div>
    </div>
  );
}
