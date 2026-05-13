"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getHouseholdForUser,
  getHouseholdPreferences,
  deleteStapleItems,
  insertStapleItems,
} from "@/lib/supabase/queries";
import { tokens } from "@/lib/tokens";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { OnboardingProgress } from "@/components/ui/OnboardingProgress";

// ── Types ─────────────────────────────────────────────────

type CategoryId =
  | "oils"
  | "spices"
  | "grains"
  | "canned"
  | "condiments"
  | "frozen"
  | "dairy_basics"
  | "other";

interface CategoryDef {
  id: Exclude<CategoryId, "other">;
  label: string;
  emoji: string;
  items: string[];
}

// ── Data ──────────────────────────────────────────────────

const CATEGORIES: CategoryDef[] = [
  {
    id: "oils",
    label: "Oils & Vinegars",
    emoji: "🫙",
    items: [
      "Olive oil",
      "Vegetable oil",
      "Sesame oil",
      "Balsamic vinegar",
      "Red wine vinegar",
      "Apple cider vinegar",
    ],
  },
  {
    id: "spices",
    label: "Spices & Seasonings",
    emoji: "🌿",
    items: [
      "Salt",
      "Black pepper",
      "Garlic powder",
      "Onion powder",
      "Paprika",
      "Cumin",
      "Chili powder",
      "Oregano",
      "Italian seasoning",
      "Cinnamon",
      "Red pepper flakes",
      "Bay leaves",
    ],
  },
  {
    id: "grains",
    label: "Grains & Pasta",
    emoji: "🌾",
    items: [
      "White rice",
      "Brown rice",
      "Spaghetti",
      "Penne",
      "Quinoa",
      "Oats",
      "Bread crumbs",
    ],
  },
  {
    id: "canned",
    label: "Canned Goods",
    emoji: "🥫",
    items: [
      "Canned tomatoes (diced)",
      "Canned tomatoes (crushed)",
      "Tomato paste",
      "Canned beans (black)",
      "Canned beans (kidney)",
      "Chicken broth",
      "Coconut milk",
    ],
  },
  {
    id: "condiments",
    label: "Condiments & Sauces",
    emoji: "🍯",
    items: [
      "Soy sauce",
      "Hot sauce",
      "Ketchup",
      "Mustard",
      "Mayonnaise",
      "Worcestershire sauce",
      "Fish sauce",
      "Honey",
      "Maple syrup",
    ],
  },
  {
    id: "frozen",
    label: "Freezer Staples",
    emoji: "❄️",
    items: [
      "Frozen chicken breasts",
      "Frozen ground beef",
      "Frozen shrimp",
      "Frozen vegetables (mixed)",
      "Frozen corn",
    ],
  },
  {
    id: "dairy_basics",
    label: "Dairy & Eggs Basics",
    emoji: "🥚",
    items: [
      "Eggs",
      "Butter",
      "Milk",
      "Heavy cream",
      "Parmesan cheese",
      "Cheddar cheese",
      "Cream cheese",
    ],
  },
];

const ITEM_CATEGORY: Record<string, CategoryId> = {};
for (const cat of CATEGORIES) {
  for (const item of cat.items) {
    ITEM_CATEGORY[item] = cat.id;
  }
}

const ALL_KNOWN_ITEMS = CATEGORIES.flatMap((c) => c.items);

const LS_KEY = "mm_ob_staples";

// ── Icons ─────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={tokens.colors.neutral[400]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconX({ size = 14, color }: { size?: number; color?: string }) {
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

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={tokens.colors.neutral[400]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconCheck({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
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

// ── Sub-components ────────────────────────────────────────

function Chip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: selected ? "6px 12px 6px 8px" : "6px 12px",
      borderRadius: 9999,
      background: selected ? tokens.colors.primary[600] : tokens.colors.neutral[0],
      color: selected ? "#fff" : tokens.colors.neutral[700],
      border: `1.5px solid ${selected ? tokens.colors.primary[600] : tokens.colors.neutral[300]}`,
      fontSize: "13px", fontWeight: selected ? 600 : 400, cursor: "pointer",
      boxShadow: selected ? tokens.shadow.sm : "none",
      transition: "all 0.12s ease", whiteSpace: "nowrap", fontFamily: "inherit",
    }}>
      {selected && <IconCheck />}
      {label}
    </button>
  );
}

function CategorySection({ category, selected, onToggle, defaultOpen }: {
  category: CategoryDef; selected: Set<string>; onToggle: (item: string) => void; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const count = category.items.filter((i) => selected.has(i)).length;

  return (
    <div style={{ background: tokens.colors.neutral[0], borderRadius: tokens.radius.lg, boxShadow: tokens.shadow.sm, overflow: "hidden" }}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
        style={{ padding: "14px 16px", background: "transparent", cursor: "pointer", gap: 8, fontFamily: "inherit" }}>
        <div className="flex items-center" style={{ gap: 10 }}>
          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{category.emoji}</span>
          <span style={{ fontSize: "15px", fontWeight: 600, color: tokens.colors.neutral[800] }}>{category.label}</span>
          {count > 0 && (
            <span style={{ fontSize: "11px", fontWeight: 700, background: tokens.colors.primary[100], color: tokens.colors.primary[700], borderRadius: 9999, padding: "1px 7px", lineHeight: 1.6 }}>
              {count}
            </span>
          )}
        </div>
        <IconChevron open={open} />
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {category.items.map((item) => (
            <Chip key={item} label={item} selected={selected.has(item)} onToggle={() => onToggle(item)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResultRow({ item, selected, onToggle }: { item: string; selected: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="w-full flex items-center justify-between"
      style={{ padding: "11px 0", borderBottom: `1px solid ${tokens.colors.neutral[100]}`, background: "transparent", cursor: "pointer", fontFamily: "inherit", gap: 8 }}>
      <span style={{ fontSize: "15px", color: tokens.colors.neutral[800], textAlign: "left" }}>{item}</span>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: selected ? tokens.colors.primary[500] : "transparent", border: `2px solid ${selected ? tokens.colors.primary[500] : tokens.colors.neutral[300]}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s ease" }}>
        {selected && <IconCheck />}
      </div>
    </button>
  );
}

function SummaryChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center" style={{ gap: 5, paddingLeft: 10, paddingRight: 6, paddingTop: 5, paddingBottom: 5, borderRadius: 9999, background: tokens.colors.primary[100], color: tokens.colors.primary[700], border: `1px solid ${tokens.colors.primary[200]}`, fontSize: "12px", fontWeight: 500 }}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{label}</span>
      <button type="button" onClick={onRemove} className="flex items-center justify-center"
        style={{ width: 16, height: 16, borderRadius: "50%", background: tokens.colors.primary[200], flexShrink: 0, cursor: "pointer", fontFamily: "inherit" }}>
        <IconX size={8} color={tokens.colors.primary[700]} />
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

export default function StaplesOnboardingPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loadingHousehold, setLoadingHousehold] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      const membership = await getHouseholdForUser(supabase, user.id);
      if (!membership) { router.push("/household/create"); return; }

      // Skip onboarding if already completed
      const { data: prefs } = await getHouseholdPreferences(supabase, membership.household_id);
      if (prefs) { router.push("/home"); return; }

      setHouseholdId(membership.household_id);

      // Restore selections from localStorage (back-navigation support)
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          const items: string[] = JSON.parse(saved);
          const known = items.filter((i) => ALL_KNOWN_ITEMS.includes(i));
          const custom = items.filter((i) => !ALL_KNOWN_ITEMS.includes(i));
          setSelected(new Set(items));
          if (custom.length > 0) setCustomItems(custom);
        }
      } catch {}

      setLoadingHousehold(false);
    }
    load();
  }, [router]);

  const toggleItem = useCallback((item: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item); else next.add(item);
      return next;
    });
  }, []);

  const removeItem = useCallback((item: string) => {
    setSelected((prev) => { const next = new Set(prev); next.delete(item); return next; });
    setCustomItems((prev) => prev.filter((i) => i !== item));
  }, []);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  const canAddCustom =
    trimmedQuery.length > 1 &&
    !ALL_KNOWN_ITEMS.some((i) => i.toLowerCase() === trimmedQuery.toLowerCase()) &&
    !customItems.some((i) => i.toLowerCase() === trimmedQuery.toLowerCase());

  const handleAddCustom = useCallback(() => {
    const item = trimmedQuery;
    setCustomItems((prev) => [...prev, item]);
    setSelected((prev) => new Set([...prev, item]));
    setQuery("");
  }, [trimmedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canAddCustom) handleAddCustom();
    else if (e.key === "Escape") setQuery("");
  };

  async function handleNext() {
    if (!householdId) return;
    setSaving(true);
    setError(null);

    // Persist for back-navigation
    localStorage.setItem(LS_KEY, JSON.stringify(Array.from(selected)));

    const supabase = createClient();

    // Idempotent: delete then re-insert
    await deleteStapleItems(supabase, householdId);

    if (selected.size > 0) {
      const rows = Array.from(selected).map((name) => ({
        household_id: householdId,
        name,
        category: ITEM_CATEGORY[name] ?? ("other" as CategoryId),
      }));
      const { error: err } = await insertStapleItems(supabase, rows);
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    }

    router.push("/onboarding/tools");
  }

  const searchResults = isSearching
    ? ALL_KNOWN_ITEMS.filter((i) => i.toLowerCase().includes(trimmedQuery.toLowerCase()))
    : [];
  const totalSelected = selected.size;
  const selectedArray = Array.from(selected);

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
      <div style={{ flexShrink: 0, background: tokens.colors.neutral[50], boxShadow: "0 1px 0 rgba(53,47,45,0.06)", paddingBottom: 12 }}>
        <div style={{ padding: "16px 20px 14px" }}>
          <OnboardingProgress step={1} />
          <h1 style={{ marginTop: 14, fontSize: "24px", fontWeight: 700, color: tokens.colors.neutral[900], letterSpacing: "-0.025em", lineHeight: 1.2 }}>
            What&apos;s always in<br />your kitchen?
          </h1>
          <p style={{ marginTop: 6, fontSize: "14px", color: tokens.colors.neutral[500], lineHeight: 1.5 }}>
            Pick your pantry staples — we&apos;ll skip these from your grocery list.
          </p>
        </div>
        <div style={{ padding: "0 20px" }}>
          <div className="flex items-center" style={{ gap: 10, background: tokens.colors.neutral[0], border: `1.5px solid ${tokens.colors.neutral[200]}`, borderRadius: 12, padding: "10px 14px", boxShadow: tokens.shadow.sm }}>
            <IconSearch />
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Search or add your own…"
              style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "15px", color: tokens.colors.neutral[900], fontFamily: "inherit" }} />
            {query.length > 0 && (
              <button type="button" onClick={() => setQuery("")} style={{ display: "flex", padding: 2, cursor: "pointer" }}>
                <IconX size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "12px 20px 24px" }}>
        {error && <div style={{ marginBottom: 12 }}><ErrorBanner message={error} /></div>}

        {isSearching ? (
          <div style={{ background: tokens.colors.neutral[0], borderRadius: tokens.radius.lg, boxShadow: tokens.shadow.sm, padding: "0 16px" }}>
            {searchResults.length > 0
              ? searchResults.map((item) => (
                  <SearchResultRow key={item} item={item} selected={selected.has(item)} onToggle={() => toggleItem(item)} />
                ))
              : !canAddCustom && (
                  <div style={{ padding: "16px 0" }}>
                    <span style={{ fontSize: "14px", color: tokens.colors.neutral[500] }}>
                      No matches for &ldquo;<strong style={{ color: tokens.colors.neutral[800] }}>{trimmedQuery}</strong>&rdquo;
                    </span>
                  </div>
                )}
            {canAddCustom && (
              <button type="button" onClick={handleAddCustom} className="w-full flex items-center"
                style={{ gap: 8, padding: "12px 0 14px", borderTop: searchResults.length > 0 ? `1px solid ${tokens.colors.neutral[100]}` : "none", background: "transparent", cursor: "pointer", fontSize: "15px", fontWeight: 500, color: tokens.colors.primary[600], fontFamily: "inherit" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px dashed ${tokens.colors.primary[400]}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IconPlus color={tokens.colors.primary[500]} />
                </div>
                Add &ldquo;{trimmedQuery}&rdquo;
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 10 }}>
            {customItems.length > 0 && (
              <div style={{ background: tokens.colors.neutral[0], borderRadius: tokens.radius.lg, boxShadow: tokens.shadow.sm, padding: "14px 16px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: tokens.colors.neutral[600], letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                  Your custom items
                </span>
                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {customItems.map((item) => (
                    <div key={item} className="inline-flex items-center"
                      style={{ gap: 6, padding: "5px 10px 5px 12px", borderRadius: 9999, background: selected.has(item) ? tokens.colors.primary[600] : tokens.colors.neutral[100], color: selected.has(item) ? "#fff" : tokens.colors.neutral[700], fontSize: "13px", fontWeight: 500, border: `1.5px solid ${selected.has(item) ? tokens.colors.primary[600] : tokens.colors.neutral[200]}` }}>
                      {item}
                      <button type="button" onClick={() => removeItem(item)} style={{ display: "flex", opacity: 0.7, cursor: "pointer" }}>
                        <IconX size={12} color={selected.has(item) ? "rgba(255,255,255,0.8)" : tokens.colors.neutral[500]} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {CATEGORIES.map((cat, i) => (
              <CategorySection key={cat.id} category={cat} selected={selected} onToggle={toggleItem} defaultOpen={i === 0} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 safe-bottom" style={{ background: tokens.colors.neutral[50], borderTop: `1px solid ${tokens.colors.neutral[200]}`, padding: "14px 20px 24px" }}>
        {totalSelected > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: "12px", fontWeight: 500, color: tokens.colors.neutral[500], marginBottom: 8 }}>
              {totalSelected} staple{totalSelected !== 1 ? "s" : ""} selected
            </p>
            <div className="flex flex-wrap" style={{ gap: 6, maxHeight: 88, overflowY: "auto" }}>
              {selectedArray.map((item) => (
                <SummaryChip key={item} label={item} onRemove={() => removeItem(item)} />
              ))}
            </div>
          </div>
        )}
        <button type="button" onClick={handleNext} disabled={saving} className="w-full flex items-center justify-center"
          style={{ gap: 8, padding: "17px", borderRadius: tokens.radius.lg, background: saving ? tokens.colors.primary[400] : `linear-gradient(160deg, ${tokens.colors.primary[500]} 0%, ${tokens.colors.primary[600]} 100%)`, color: "#fff", fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em", cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : tokens.shadow.cta, transition: "all 0.12s ease", fontFamily: "inherit", opacity: saving ? 0.8 : 1 }}>
          {saving ? "Saving…" : totalSelected === 0 ? "Skip for now" : `Continue with ${totalSelected} staple${totalSelected !== 1 ? "s" : ""}`}
          {!saving && <IconArrow />}
        </button>
      </div>
    </div>
  );
}
