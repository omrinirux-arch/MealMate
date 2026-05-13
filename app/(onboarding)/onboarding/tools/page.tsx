"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getHouseholdForUser,
  getHouseholdPreferences,
  deleteKitchenTools,
  insertKitchenTools,
} from "@/lib/supabase/queries";
import { tokens } from "@/lib/tokens";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { OnboardingProgress } from "@/components/ui/OnboardingProgress";

// ── Data ──────────────────────────────────────────────────

interface Tool {
  id: string;
  label: string;
  emoji: string;
}

const TOOLS: Tool[] = [
  { id: "instant-pot",     label: "Instant Pot",       emoji: "⚡" },
  { id: "air-fryer",       label: "Air Fryer",          emoji: "💨" },
  { id: "slow-cooker",     label: "Slow Cooker",        emoji: "🍲" },
  { id: "grill",           label: "Grill (outdoor)",    emoji: "🔥" },
  { id: "wok",             label: "Wok",                emoji: "🥘" },
  { id: "dutch-oven",      label: "Dutch Oven",         emoji: "🫕" },
  { id: "food-processor",  label: "Food Processor",     emoji: "⚙️" },
  { id: "stand-mixer",     label: "Stand Mixer",        emoji: "🍰" },
  { id: "sous-vide",       label: "Sous Vide",          emoji: "🌡️" },
  { id: "smoker",          label: "Smoker",             emoji: "🪵" },
  { id: "cast-iron",       label: "Cast Iron Skillet",  emoji: "🍳" },
  { id: "sheet-pans",      label: "Sheet Pans",         emoji: "🍪" },
];

const TOOL_LABELS = TOOLS.map((t) => t.label);
const LS_KEY = "mm_ob_tools";

// ── Icons ─────────────────────────────────────────────────

function IconCheck({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
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

function IconPlus({ color }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color ?? tokens.colors.neutral[500]} strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// ── Tool row ──────────────────────────────────────────────

function ToolRow({ tool, selected, onToggle }: { tool: Tool; selected: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="w-full flex items-center"
      style={{
        gap: 12, padding: "13px 14px",
        background: selected ? tokens.colors.primary[50] : tokens.colors.neutral[0],
        border: `1.5px solid ${selected ? tokens.colors.primary[500] : tokens.colors.neutral[200]}`,
        borderRadius: tokens.radius.md, cursor: "pointer",
        boxShadow: selected ? tokens.shadow.md : tokens.shadow.sm,
        transition: "all 0.12s ease", textAlign: "left", fontFamily: "inherit",
      }}>
      <span style={{ fontSize: "1.375rem", lineHeight: 1, flexShrink: 0 }}>{tool.emoji}</span>
      <span style={{ flex: 1, fontSize: "15px", fontWeight: selected ? 600 : 400, color: selected ? tokens.colors.primary[700] : tokens.colors.neutral[900] }}>
        {tool.label}
      </span>
      <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: selected ? tokens.colors.primary[500] : "transparent", border: `2px solid ${selected ? tokens.colors.primary[500] : tokens.colors.neutral[300]}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}>
        {selected && <IconCheck />}
      </div>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────

export default function ToolsOnboardingPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loadingHousehold, setLoadingHousehold] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customTools, setCustomTools] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");

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

      // Restore from localStorage (back-navigation)
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          const items: string[] = JSON.parse(saved);
          const known = items.filter((i) => TOOL_LABELS.includes(i));
          const custom = items.filter((i) => !TOOL_LABELS.includes(i));
          setSelected(new Set(items));
          if (custom.length > 0) setCustomTools(custom);
        }
      } catch {}

      setLoadingHousehold(false);
    }
    load();
  }, [router]);

  const toggleTool = useCallback((label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }, []);

  const trimmedInput = customInput.trim();
  const canAddCustom =
    trimmedInput.length > 1 &&
    !TOOL_LABELS.some((l) => l.toLowerCase() === trimmedInput.toLowerCase()) &&
    !customTools.some((l) => l.toLowerCase() === trimmedInput.toLowerCase());

  const handleAddCustom = useCallback(() => {
    const label = trimmedInput;
    setCustomTools((prev) => [...prev, label]);
    setSelected((prev) => new Set([...prev, label]));
    setCustomInput("");
  }, [trimmedInput]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canAddCustom) handleAddCustom();
    else if (e.key === "Escape") setCustomInput("");
  };

  const removeCustomTool = useCallback((label: string) => {
    setCustomTools((prev) => prev.filter((l) => l !== label));
    setSelected((prev) => { const next = new Set(prev); next.delete(label); return next; });
  }, []);

  async function handleNext() {
    if (!householdId) return;
    setSaving(true);
    setError(null);

    localStorage.setItem(LS_KEY, JSON.stringify(Array.from(selected)));

    const supabase = createClient();
    await deleteKitchenTools(supabase, householdId);

    if (selected.size > 0) {
      const rows = Array.from(selected).map((name) => ({ household_id: householdId, name }));
      const { error: err } = await insertKitchenTools(supabase, rows);
      if (err) { setError(err.message); setSaving(false); return; }
    }

    router.push("/onboarding/preferences");
  }

  const totalSelected = selected.size;

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
        <OnboardingProgress step={2} />
        <h1 style={{ marginTop: 14, fontSize: "24px", fontWeight: 700, color: tokens.colors.neutral[900], letterSpacing: "-0.025em", lineHeight: 1.2 }}>
          What tools do you<br />cook with?
        </h1>
        <p style={{ marginTop: 6, fontSize: "14px", color: tokens.colors.neutral[500], lineHeight: 1.5 }}>
          We&apos;ll suggest recipes that match your equipment.
        </p>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "16px 20px" }}>
        {error && <div style={{ marginBottom: 12 }}><ErrorBanner message={error} /></div>}

        {/* Tool list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TOOLS.map((tool) => (
            <ToolRow key={tool.id} tool={tool} selected={selected.has(tool.label)} onToggle={() => toggleTool(tool.label)} />
          ))}
        </div>

        {/* Custom tools */}
        {customTools.length > 0 && (
          <div style={{ marginTop: 12, background: tokens.colors.neutral[0], borderRadius: tokens.radius.lg, boxShadow: tokens.shadow.sm, padding: "14px 16px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: tokens.colors.neutral[600], letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              Your custom tools
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {customTools.map((label) => (
                <div key={label} className="flex items-center justify-between"
                  style={{ padding: "10px 14px", borderRadius: tokens.radius.md, background: tokens.colors.primary[50], border: `1.5px solid ${tokens.colors.primary[200]}` }}>
                  <span style={{ fontSize: "15px", fontWeight: 500, color: tokens.colors.primary[700] }}>{label}</span>
                  <button type="button" onClick={() => removeCustomTool(label)} style={{ display: "flex", cursor: "pointer", padding: 2 }}>
                    <IconX size={14} color={tokens.colors.primary[400]} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add custom tool input */}
        <div style={{ marginTop: 12 }}>
          <div className="flex items-center" style={{ gap: 10, background: tokens.colors.neutral[0], border: `1.5px solid ${tokens.colors.neutral[200]}`, borderRadius: tokens.radius.md, padding: "10px 14px", boxShadow: tokens.shadow.sm }}>
            <input ref={inputRef} value={customInput} onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleInputKeyDown} placeholder="Add a custom tool…"
              style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "15px", color: tokens.colors.neutral[900], fontFamily: "inherit" }} />
            {canAddCustom ? (
              <button type="button" onClick={handleAddCustom}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 9999, background: tokens.colors.primary[600], color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <IconPlus color="white" />
                Add
              </button>
            ) : customInput.length > 0 ? (
              <button type="button" onClick={() => setCustomInput("")} style={{ display: "flex", cursor: "pointer" }}>
                <IconX size={14} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Assumed tools note */}
        <div style={{ marginTop: 20, marginBottom: 8, padding: "12px 14px", borderRadius: tokens.radius.md, background: tokens.colors.primary[50], border: `1px solid ${tokens.colors.primary[200]}` }}>
          <p style={{ fontSize: "13px", color: tokens.colors.primary[700], lineHeight: 1.5 }}>
            <strong>Always assumed:</strong> stovetop, oven, microwave, pots &amp; pans, knives, cutting board.
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 safe-bottom" style={{ background: tokens.colors.neutral[50], borderTop: `1px solid ${tokens.colors.neutral[200]}`, padding: "14px 20px 24px", display: "flex", gap: 10 }}>
        <button type="button" onClick={() => router.push("/onboarding/staples")}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "15px 20px", borderRadius: tokens.radius.lg, background: tokens.colors.neutral[0], border: `1.5px solid ${tokens.colors.neutral[300]}`, color: tokens.colors.neutral[700], fontSize: "15px", fontWeight: 600, cursor: "pointer", boxShadow: tokens.shadow.sm, fontFamily: "inherit", flexShrink: 0 }}>
          <IconChevronLeft />
          Back
        </button>
        <button type="button" onClick={handleNext} disabled={saving}
          className="flex items-center justify-center"
          style={{ flex: 1, gap: 8, padding: "15px", borderRadius: tokens.radius.lg, background: saving ? tokens.colors.primary[400] : `linear-gradient(160deg, ${tokens.colors.primary[500]} 0%, ${tokens.colors.primary[600]} 100%)`, color: "#fff", fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em", cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : tokens.shadow.cta, transition: "all 0.12s ease", fontFamily: "inherit", opacity: saving ? 0.8 : 1 }}>
          {saving ? "Saving…" : totalSelected === 0 ? "Skip for now" : `Continue with ${totalSelected} tool${totalSelected !== 1 ? "s" : ""}`}
          {!saving && <IconArrow />}
        </button>
      </div>
    </div>
  );
}
