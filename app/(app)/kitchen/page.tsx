"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getHouseholdForUser,
  getStapleItems,
  getKitchenTools,
  getHouseholdPreferences,
  upsertHouseholdPreferences,
  deleteSingleStapleItem,
  insertSingleStapleItem,
  deleteSingleKitchenTool,
  insertSingleKitchenTool,
  updateServings,
} from "@/lib/supabase/queries";
import { tokens } from "@/lib/tokens";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

// ── Types ──────────────────────────────────────────────────

type CategoryId =
  | "oils" | "spices" | "grains" | "canned"
  | "condiments" | "frozen" | "dairy_basics" | "other";
type SpiceLevel = "none" | "mild" | "medium" | "hot";

interface StapleItem { id: string; name: string; category: string; }
interface KitchenTool { id: string; name: string; }
interface CategoryDef {
  id: Exclude<CategoryId, "other">;
  label: string;
  emoji: string;
  items: string[];
}

// ── Data ───────────────────────────────────────────────────

const CATEGORIES: CategoryDef[] = [
  { id: "oils", label: "Oils & Vinegars", emoji: "🫙", items: ["Olive oil","Vegetable oil","Sesame oil","Balsamic vinegar","Red wine vinegar","Apple cider vinegar"] },
  { id: "spices", label: "Spices & Seasonings", emoji: "🌿", items: ["Salt","Black pepper","Garlic powder","Onion powder","Paprika","Cumin","Chili powder","Oregano","Italian seasoning","Cinnamon","Red pepper flakes","Bay leaves"] },
  { id: "grains", label: "Grains & Pasta", emoji: "🌾", items: ["White rice","Brown rice","Spaghetti","Penne","Quinoa","Oats","Bread crumbs"] },
  { id: "canned", label: "Canned Goods", emoji: "🥫", items: ["Canned tomatoes (diced)","Canned tomatoes (crushed)","Tomato paste","Canned beans (black)","Canned beans (kidney)","Chicken broth","Coconut milk"] },
  { id: "condiments", label: "Condiments & Sauces", emoji: "🍯", items: ["Soy sauce","Hot sauce","Ketchup","Mustard","Mayonnaise","Worcestershire sauce","Fish sauce","Honey","Maple syrup"] },
  { id: "frozen", label: "Freezer Staples", emoji: "❄️", items: ["Frozen chicken breasts","Frozen ground beef","Frozen shrimp","Frozen vegetables (mixed)","Frozen corn"] },
  { id: "dairy_basics", label: "Dairy & Eggs Basics", emoji: "🥚", items: ["Eggs","Butter","Milk","Heavy cream","Parmesan cheese","Cheddar cheese","Cream cheese"] },
];

const ITEM_CATEGORY: Record<string, CategoryId> = {};
for (const cat of CATEGORIES) {
  for (const item of cat.items) ITEM_CATEGORY[item] = cat.id;
}
const ALL_KNOWN_ITEMS = CATEGORIES.flatMap((c) => c.items);

const PRESET_TOOLS = [
  { id: "instant-pot",    label: "Instant Pot",       emoji: "⚡" },
  { id: "air-fryer",      label: "Air Fryer",          emoji: "💨" },
  { id: "slow-cooker",    label: "Slow Cooker",        emoji: "🍲" },
  { id: "grill",          label: "Grill (outdoor)",    emoji: "🔥" },
  { id: "wok",            label: "Wok",                emoji: "🥘" },
  { id: "dutch-oven",     label: "Dutch Oven",         emoji: "🫕" },
  { id: "food-processor", label: "Food Processor",     emoji: "⚙️" },
  { id: "stand-mixer",    label: "Stand Mixer",        emoji: "🍰" },
  { id: "sous-vide",      label: "Sous Vide",          emoji: "🌡️" },
  { id: "smoker",         label: "Smoker",             emoji: "🪵" },
  { id: "cast-iron",      label: "Cast Iron Skillet",  emoji: "🍳" },
  { id: "sheet-pans",     label: "Sheet Pans",         emoji: "🍪" },
];
const PRESET_TOOL_LABELS = PRESET_TOOLS.map((t) => t.label);

const DIETARY_GOALS = [
  { id: "lower-cholesterol", label: "Lower cholesterol" },
  { id: "lose-weight",       label: "Lose weight" },
  { id: "build-muscle",      label: "Build muscle / high protein" },
  { id: "heart-healthy",     label: "Heart healthy" },
  { id: "low-sodium",        label: "Low sodium" },
  { id: "balanced",          label: "Balanced / no specific goal" },
];

const RECIPE_STYLES = [
  { id: "quick",        label: "Quick & easy",       sub: "under 30 min" },
  { id: "one-pan",      label: "One-pan / one-pot",  sub: null },
  { id: "meal-prep",    label: "Meal prep friendly", sub: "great leftovers" },
  { id: "involved",     label: "More involved",      sub: "weekend project" },
  { id: "kid-friendly", label: "Kid-friendly",       sub: "mild flavors" },
];

const SPICE_LEVELS: { id: SpiceLevel; label: string; emoji: string }[] = [
  { id: "none",   label: "None",   emoji: "🧊" },
  { id: "mild",   label: "Mild",   emoji: "🌿" },
  { id: "medium", label: "Medium", emoji: "🌶️" },
  { id: "hot",    label: "Hot",    emoji: "🔥" },
];

// ── Icons ───────────────────────────────────────────────────

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

// ── Sub-components ─────────────────────────────────────────

function CollapsibleSection({ title, count, open, onToggle, children }: {
  title: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: tokens.colors.neutral[0],
      borderRadius: tokens.radius.xl,
      boxShadow: tokens.shadow.sm,
      border: `1px solid ${tokens.colors.neutral[200]}`,
      overflow: "hidden",
    }}>
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between"
        style={{ padding: "16px 18px", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: tokens.colors.neutral[900] }}>{title}</span>
          {count !== undefined && count > 0 && (
            <span style={{ fontSize: "11px", fontWeight: 700, background: tokens.colors.primary[100], color: tokens.colors.primary[700], borderRadius: 9999, padding: "2px 8px" }}>
              {count}
            </span>
          )}
        </div>
        <IconChevron open={open} />
      </button>
      {open && <div style={{ borderTop: `1px solid ${tokens.colors.neutral[100]}` }}>{children}</div>}
    </div>
  );
}

function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center" style={{
      gap: 5, paddingLeft: 10, paddingRight: 6, paddingTop: 5, paddingBottom: 5,
      borderRadius: 9999, background: tokens.colors.primary[100],
      color: tokens.colors.primary[700], border: `1px solid ${tokens.colors.primary[200]}`,
      fontSize: "13px", fontWeight: 500,
    }}>
      <span>{label}</span>
      <button type="button" onClick={onRemove} className="flex items-center justify-center"
        style={{ width: 16, height: 16, borderRadius: "50%", background: tokens.colors.primary[200], flexShrink: 0, cursor: "pointer", fontFamily: "inherit" }}>
        <IconX size={8} color={tokens.colors.primary[700]} />
      </button>
    </div>
  );
}

function SearchResultRow({ item, selected, onToggle }: { item: string; selected: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="w-full flex items-center justify-between"
      style={{ padding: "11px 0", borderBottom: `1px solid ${tokens.colors.neutral[100]}`, background: "transparent", cursor: "pointer", fontFamily: "inherit", gap: 8 }}>
      <span style={{ fontSize: "15px", color: tokens.colors.neutral[800], textAlign: "left" }}>{item}</span>
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0, transition: "all 0.15s ease",
        background: selected ? tokens.colors.primary[500] : "transparent",
        border: `2px solid ${selected ? tokens.colors.primary[500] : tokens.colors.neutral[300]}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <IconCheck />}
      </div>
    </button>
  );
}

function ToolRow({ label, emoji, selected, onToggle }: {
  label: string; emoji: string; selected: boolean; onToggle: () => void;
}) {
  return (
    <button type="button" onClick={onToggle} className="w-full flex items-center"
      style={{
        gap: 12, padding: "13px 14px", textAlign: "left", fontFamily: "inherit",
        background: selected ? tokens.colors.primary[50] : tokens.colors.neutral[0],
        border: `1.5px solid ${selected ? tokens.colors.primary[500] : tokens.colors.neutral[200]}`,
        borderRadius: tokens.radius.md, cursor: "pointer",
        boxShadow: selected ? tokens.shadow.md : tokens.shadow.sm,
        transition: "all 0.12s ease",
      }}>
      <span style={{ fontSize: "1.375rem", lineHeight: 1, flexShrink: 0 }}>{emoji}</span>
      <span style={{ flex: 1, fontSize: "15px", fontWeight: selected ? 600 : 400, color: selected ? tokens.colors.primary[700] : tokens.colors.neutral[900] }}>
        {label}
      </span>
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0, transition: "all 0.15s ease",
        background: selected ? tokens.colors.primary[500] : "transparent",
        border: `2px solid ${selected ? tokens.colors.primary[500] : tokens.colors.neutral[300]}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <IconCheck />}
      </div>
    </button>
  );
}

function PrefChip({ label, sub, active, onToggle }: {
  label: string; sub?: string | null; active: boolean; onToggle: () => void;
}) {
  return (
    <button type="button" onClick={onToggle} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: active ? "8px 14px 8px 10px" : "8px 14px",
      borderRadius: 9999, whiteSpace: "nowrap", fontFamily: "inherit",
      background: active ? tokens.colors.primary[600] : tokens.colors.neutral[0],
      color: active ? "#fff" : tokens.colors.neutral[700],
      border: `1.5px solid ${active ? tokens.colors.primary[600] : tokens.colors.neutral[300]}`,
      fontSize: "14px", fontWeight: active ? 600 : 400,
      cursor: "pointer", boxShadow: active ? tokens.shadow.sm : "none",
      transition: "all 0.12s ease",
    }}>
      {active && (
        <span style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IconCheck size={9} />
        </span>
      )}
      <span>{label}</span>
      {sub && !active && <span style={{ fontSize: "12px", opacity: 0.65 }}>· {sub}</span>}
    </button>
  );
}

function SpiceSelector({ value, onChange }: { value: SpiceLevel; onChange: (v: SpiceLevel) => void }) {
  return (
    <div style={{ display: "flex", background: tokens.colors.neutral[100], border: `1.5px solid ${tokens.colors.neutral[200]}`, borderRadius: 12, padding: 4 }}>
      {SPICE_LEVELS.map((level) => {
        const active = value === level.id;
        return (
          <button key={level.id} type="button" onClick={() => onChange(level.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, padding: "10px 4px 8px", borderRadius: 9, border: "none",
            background: active ? tokens.colors.primary[600] : "transparent",
            cursor: "pointer", transition: "all 0.15s ease",
            boxShadow: active ? tokens.shadow.sm : "none", fontFamily: "inherit",
          }}>
            <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{level.emoji}</span>
            <span style={{ fontSize: "12px", fontWeight: active ? 700 : 400, color: active ? "#fff" : tokens.colors.neutral[500] }}>
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

// ── Main page ──────────────────────────────────────────────

export default function KitchenPage() {
  const router = useRouter();
  const stapleInputRef = useRef<HTMLInputElement>(null);
  const customToolInputRef = useRef<HTMLInputElement>(null);
  const exclInputRef = useRef<HTMLInputElement>(null);
  const pendingDeleteRef = useRef<StapleItem | null>(null);

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [staplesOpen, setStaplesOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [prefsOpen, setPrefsOpen] = useState(true);

  const [staples, setStaples] = useState<StapleItem[]>([]);
  const [pendingDelete, setPendingDelete] = useState<StapleItem | null>(null);
  const [stapleQuery, setStapleQuery] = useState("");

  const [savedTools, setSavedTools] = useState<KitchenTool[]>([]);
  const [customToolInput, setCustomToolInput] = useState("");

  const [goals, setGoals] = useState<Set<string>>(new Set());
  const [styles, setStyles] = useState<Set<string>>(new Set());
  const [spice, setSpice] = useState<SpiceLevel>("mild");
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [exclInput, setExclInput] = useState("");
  const [servings, setServings] = useState(4);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // ── Load all data on mount ──
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      const membership = await getHouseholdForUser(supabase, user.id);
      if (!membership) { router.push("/household/create"); return; }

      const hId = membership.household_id;
      setHouseholdId(hId);
      setHouseholdName((membership.households as { name: string } | null)?.name ?? "");

      const [staplesResult, toolsResult, prefsResult] = await Promise.all([
        getStapleItems(supabase, hId),
        getKitchenTools(supabase, hId),
        getHouseholdPreferences(supabase, hId),
      ]);

      if (staplesResult.data) {
        setStaples(staplesResult.data.map(s => ({ id: s.id, name: s.name, category: s.category ?? "other" })));
      }
      if (toolsResult.data) {
        setSavedTools(toolsResult.data.map(t => ({ id: t.id, name: t.name })));
      }
      if (prefsResult.data) {
        const p = prefsResult.data;
        setGoals(new Set(p.dietary_goals ?? []));
        setStyles(new Set(p.recipe_style ?? []));
        setSpice(p.spice_tolerance ?? "mild");
        setExclusions(p.exclusions ?? []);
        setServings(p.servings ?? 4);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  // ── Re-fetch staples when added from another page (e.g. recipe detail) ──
  useEffect(() => {
    if (!householdId) return;
    const handleStaplesChanged = () => {
      getStapleItems(createClient(), householdId).then(({ data }) => {
        if (data) setStaples(data.map(s => ({ id: s.id, name: s.name, category: s.category ?? "other" })));
      });
    };
    window.addEventListener("staples-changed", handleStaplesChanged);
    return () => window.removeEventListener("staples-changed", handleStaplesChanged);
  }, [householdId]);

  // ── Undo: 3-second delayed delete for staples ──
  useEffect(() => {
    if (!pendingDelete) return;
    const item = pendingDelete;
    const timer = setTimeout(async () => {
      const supabase = createClient();
      await deleteSingleStapleItem(supabase, item.id);
      setPendingDelete(null);
      pendingDeleteRef.current = null;
    }, 3000);
    return () => clearTimeout(timer);
  }, [pendingDelete]);

  // ── Staple handlers ──
  const handleRemoveStaple = useCallback((item: StapleItem) => {
    // Commit any already-pending deletion before starting a new one
    const current = pendingDeleteRef.current;
    if (current) {
      createClient().from("staple_items").delete().eq("id", current.id);
    }
    setStaples(prev => prev.filter(s => s.id !== item.id));
    pendingDeleteRef.current = item;
    setPendingDelete(item);
  }, []);

  const handleUndo = useCallback(() => {
    const item = pendingDeleteRef.current;
    if (item) {
      setStaples(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
      pendingDeleteRef.current = null;
      setPendingDelete(null);
    }
  }, []);

  const savedStapleNames = useMemo(() => new Set(staples.map(s => s.name)), [staples]);

  const handleToggleStapleInSearch = useCallback(async (name: string) => {
    if (!householdId) return;
    if (savedStapleNames.has(name)) {
      const existing = staples.find(s => s.name === name);
      if (existing) handleRemoveStaple(existing);
    } else {
      const category: CategoryId = ITEM_CATEGORY[name] ?? "other";
      const supabase = createClient();
      const { data, error: err } = await insertSingleStapleItem(supabase, { household_id: householdId, name, category });
      if (err) { setError(err.message); return; }
      if (data) setStaples(prev => [...prev, { id: data.id, name, category }].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, [householdId, savedStapleNames, staples, handleRemoveStaple]);

  const handleAddCustomStaple = useCallback(async (name: string) => {
    if (!householdId || !name.trim() || savedStapleNames.has(name)) return;
    const supabase = createClient();
    const { data, error: err } = await insertSingleStapleItem(supabase, { household_id: householdId, name, category: "other" });
    if (err) { setError(err.message); return; }
    if (data) setStaples(prev => [...prev, { id: data.id, name, category: "other" }].sort((a, b) => a.name.localeCompare(b.name)));
    setStapleQuery("");
  }, [householdId, savedStapleNames]);

  // ── Tool handlers ──
  const savedToolNames = useMemo(() => new Set(savedTools.map(t => t.name)), [savedTools]);

  const handleToggleTool = useCallback(async (label: string) => {
    if (!householdId) return;
    const existing = savedTools.find(t => t.name === label);
    const supabase = createClient();
    if (existing) {
      setSavedTools(prev => prev.filter(t => t.id !== existing.id));
      const { error: err } = await deleteSingleKitchenTool(supabase, existing.id);
      if (err) { setSavedTools(prev => [...prev, existing]); setError(err.message); }
    } else {
      const tempId = `temp-${label}`;
      setSavedTools(prev => [...prev, { id: tempId, name: label }]);
      const { data, error: err } = await insertSingleKitchenTool(supabase, { household_id: householdId, name: label });
      if (err) {
        setSavedTools(prev => prev.filter(t => t.id !== tempId));
        setError(err.message);
      } else if (data) {
        setSavedTools(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id } : t));
      }
    }
  }, [householdId, savedTools]);

  const customTools = useMemo(() => savedTools.filter(t => !PRESET_TOOL_LABELS.includes(t.name)), [savedTools]);
  const trimmedCustomTool = customToolInput.trim();
  const canAddCustomTool = trimmedCustomTool.length > 1 && !savedToolNames.has(trimmedCustomTool);

  const handleAddCustomTool = useCallback(async () => {
    if (!householdId || !canAddCustomTool) return;
    const label = trimmedCustomTool;
    const tempId = `temp-${label}`;
    setSavedTools(prev => [...prev, { id: tempId, name: label }]);
    setCustomToolInput("");
    const supabase = createClient();
    const { data, error: err } = await insertSingleKitchenTool(supabase, { household_id: householdId, name: label });
    if (err) {
      setSavedTools(prev => prev.filter(t => t.id !== tempId));
      setError(err.message);
    } else if (data) {
      setSavedTools(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id } : t));
    }
  }, [householdId, canAddCustomTool, trimmedCustomTool]);

  // ── Servings (immediate save) ──
  const handleServingsChange = useCallback(async (newValue: number) => {
    if (!householdId || newValue < 1 || newValue > 12) return;
    setServings(newValue);
    const supabase = createClient();
    await updateServings(supabase, householdId, newValue);
  }, [householdId]);

  // ── Preferences batch save ──
  async function handleSavePrefs() {
    if (!householdId) return;
    setPrefsSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await upsertHouseholdPreferences(supabase, {
      household_id: householdId,
      dietary_goals: Array.from(goals),
      recipe_style: Array.from(styles),
      spice_tolerance: spice,
      exclusions,
    });
    setPrefsSaving(false);
    if (err) {
      setError(err.message);
    } else {
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    }
  }

  // ── Exclusion tag input ──
  const addExclusion = useCallback((raw: string) => {
    const parts = raw.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    setExclusions(prev => {
      const existing = new Set(prev.map(s => s.toLowerCase()));
      return [...prev, ...parts.filter(p => !existing.has(p.toLowerCase()))];
    });
    setExclInput("");
  }, []);

  const handleExclKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && exclInput.trim()) {
      e.preventDefault();
      addExclusion(exclInput);
    }
    if (e.key === "Backspace" && !exclInput && exclusions.length > 0) {
      setExclusions(prev => prev.slice(0, -1));
    }
  };

  // ── Derived search state ──
  const trimmedQuery = stapleQuery.trim();
  const isSearching = trimmedQuery.length > 0;
  const searchResults = isSearching
    ? ALL_KNOWN_ITEMS.filter(i => i.toLowerCase().includes(trimmedQuery.toLowerCase()))
    : [];
  const canAddCustomStaple =
    trimmedQuery.length > 1 &&
    !ALL_KNOWN_ITEMS.some(i => i.toLowerCase() === trimmedQuery.toLowerCase()) &&
    !savedStapleNames.has(trimmedQuery);

  // ── Grouped staples for display ──
  const staplesByCategory = useMemo(() => {
    const map = new Map<string, StapleItem[]>();
    for (const staple of staples) {
      const cat = staple.category || "other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(staple);
    }
    return map;
  }, [staples]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: "calc(100vh - 72px)", background: tokens.colors.neutral[50] }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${tokens.colors.primary[200]}`, borderTopColor: tokens.colors.primary[500], animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: tokens.colors.neutral[50], minHeight: "100%", paddingBottom: 32 }}>

      {/* ── Page header ── */}
      <div style={{ padding: "24px 20px 4px" }}>
        <p style={{ fontSize: "12px", fontWeight: 500, color: tokens.colors.neutral[400], letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 2 }}>
          Settings
        </p>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: tokens.colors.neutral[900], letterSpacing: tokens.typography.letterSpacing.heading, lineHeight: 1.2 }}>
          Kitchen
        </h1>
        {householdName && (
          <p style={{ fontSize: "14px", color: tokens.colors.neutral[500], marginTop: 4 }}>{householdName}</p>
        )}
      </div>

      {error && (
        <div style={{ padding: "12px 16px 0" }}>
          <ErrorBanner message={error} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 16px 0" }}>

        {/* ════════════════════════════════════════════════════
            STAPLE ITEMS
        ════════════════════════════════════════════════════ */}
        <CollapsibleSection title="Staple Items" count={staples.length} open={staplesOpen} onToggle={() => setStaplesOpen(o => !o)}>
          <div style={{ padding: "14px 16px 16px" }}>

            {/* Search / add bar */}
            <div className="flex items-center" style={{ gap: 10, background: tokens.colors.neutral[50], border: `1.5px solid ${tokens.colors.neutral[200]}`, borderRadius: 10, padding: "9px 12px", marginBottom: 14 }}>
              <IconSearch />
              <input
                ref={stapleInputRef}
                value={stapleQuery}
                onChange={e => setStapleQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && canAddCustomStaple) handleAddCustomStaple(trimmedQuery);
                  if (e.key === "Escape") setStapleQuery("");
                }}
                placeholder="Search or add a staple…"
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "14px", color: tokens.colors.neutral[900], fontFamily: "inherit" }}
              />
              {stapleQuery.length > 0 && (
                <button type="button" onClick={() => setStapleQuery("")} style={{ display: "flex", cursor: "pointer" }}>
                  <IconX size={14} />
                </button>
              )}
            </div>

            {/* Search results panel */}
            {isSearching ? (
              <div style={{ background: tokens.colors.neutral[0], borderRadius: tokens.radius.md, border: `1px solid ${tokens.colors.neutral[200]}`, padding: "0 14px" }}>
                {searchResults.map(item => (
                  <SearchResultRow key={item} item={item} selected={savedStapleNames.has(item)} onToggle={() => handleToggleStapleInSearch(item)} />
                ))}
                {searchResults.length === 0 && !canAddCustomStaple && (
                  <div style={{ padding: "14px 0" }}>
                    <span style={{ fontSize: "14px", color: tokens.colors.neutral[500] }}>
                      No matches for &ldquo;<strong style={{ color: tokens.colors.neutral[800] }}>{trimmedQuery}</strong>&rdquo;
                    </span>
                  </div>
                )}
                {canAddCustomStaple && (
                  <button type="button" onClick={() => handleAddCustomStaple(trimmedQuery)} className="w-full flex items-center"
                    style={{ gap: 8, padding: "12px 0", borderTop: searchResults.length > 0 ? `1px solid ${tokens.colors.neutral[100]}` : "none", background: "transparent", cursor: "pointer", fontSize: "14px", fontWeight: 500, color: tokens.colors.primary[600], fontFamily: "inherit" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px dashed ${tokens.colors.primary[400]}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <IconPlus color={tokens.colors.primary[500]} />
                    </div>
                    Add &ldquo;{trimmedQuery}&rdquo;
                  </button>
                )}
              </div>
            ) : staples.length === 0 ? (
              <p style={{ fontSize: "14px", color: tokens.colors.neutral[400], textAlign: "center", padding: "16px 0" }}>
                No staples yet. Search above to add some.
              </p>
            ) : (
              /* Grouped saved staples */
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {CATEGORIES.map(cat => {
                  const items = staplesByCategory.get(cat.id);
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: tokens.colors.neutral[500], letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
                        {cat.emoji} {cat.label}
                      </p>
                      <div className="flex flex-wrap" style={{ gap: 7 }}>
                        {items.map(staple => (
                          <RemovableChip key={staple.id} label={staple.name} onRemove={() => handleRemoveStaple(staple)} />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {(staplesByCategory.get("other") ?? []).length > 0 && (
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: tokens.colors.neutral[500], letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
                      Custom items
                    </p>
                    <div className="flex flex-wrap" style={{ gap: 7 }}>
                      {staplesByCategory.get("other")!.map(staple => (
                        <RemovableChip key={staple.id} label={staple.name} onRemove={() => handleRemoveStaple(staple)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* ════════════════════════════════════════════════════
            KITCHEN TOOLS
        ════════════════════════════════════════════════════ */}
        <CollapsibleSection title="Kitchen Tools" count={savedTools.length} open={toolsOpen} onToggle={() => setToolsOpen(o => !o)}>
          <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>

            {PRESET_TOOLS.map(tool => (
              <ToolRow
                key={tool.id}
                label={tool.label}
                emoji={tool.emoji}
                selected={savedToolNames.has(tool.label)}
                onToggle={() => handleToggleTool(tool.label)}
              />
            ))}

            {customTools.length > 0 && (
              <div style={{ marginTop: 4, background: tokens.colors.neutral[0], borderRadius: tokens.radius.lg, border: `1px solid ${tokens.colors.neutral[200]}`, padding: "12px 14px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: tokens.colors.neutral[500], letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
                  Custom tools
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {customTools.map(tool => (
                    <div key={tool.id} className="flex items-center justify-between"
                      style={{ padding: "10px 14px", borderRadius: tokens.radius.md, background: tokens.colors.primary[50], border: `1.5px solid ${tokens.colors.primary[200]}` }}>
                      <span style={{ fontSize: "15px", fontWeight: 500, color: tokens.colors.primary[700] }}>{tool.name}</span>
                      <button type="button" onClick={() => handleToggleTool(tool.name)} style={{ display: "flex", cursor: "pointer" }}>
                        <IconX size={14} color={tokens.colors.primary[400]} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center" style={{ gap: 10, background: tokens.colors.neutral[0], border: `1.5px solid ${tokens.colors.neutral[200]}`, borderRadius: tokens.radius.md, padding: "10px 14px", boxShadow: tokens.shadow.sm }}>
                <input
                  ref={customToolInputRef}
                  value={customToolInput}
                  onChange={e => setCustomToolInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && canAddCustomTool) handleAddCustomTool();
                    if (e.key === "Escape") setCustomToolInput("");
                  }}
                  placeholder="Add a custom tool…"
                  style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "15px", color: tokens.colors.neutral[900], fontFamily: "inherit" }}
                />
                {canAddCustomTool ? (
                  <button type="button" onClick={handleAddCustomTool}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 9999, background: tokens.colors.primary[600], color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    <IconPlus color="white" />
                    Add
                  </button>
                ) : customToolInput.length > 0 ? (
                  <button type="button" onClick={() => setCustomToolInput("")} style={{ display: "flex", cursor: "pointer" }}>
                    <IconX size={14} />
                  </button>
                ) : null}
              </div>
            </div>

            <div style={{ padding: "10px 14px", borderRadius: tokens.radius.md, background: tokens.colors.primary[50], border: `1px solid ${tokens.colors.primary[200]}` }}>
              <p style={{ fontSize: "13px", color: tokens.colors.primary[700], lineHeight: 1.5 }}>
                <strong>Always assumed:</strong> stovetop, oven, microwave, pots &amp; pans, knives, cutting board.
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* ════════════════════════════════════════════════════
            PREFERENCES
        ════════════════════════════════════════════════════ */}
        <CollapsibleSection title="Preferences" open={prefsOpen} onToggle={() => setPrefsOpen(o => !o)}>
          <div style={{ padding: "16px 16px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Serving size — saves immediately */}
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: tokens.colors.neutral[600], letterSpacing: "0.03em", textTransform: "uppercase" }}>
                  Serving Size
                </p>
                <p style={{ fontSize: "12px", color: tokens.colors.neutral[400], marginTop: 2 }}>Saves automatically</p>
              </div>
              <div className="flex items-center" style={{ background: tokens.colors.neutral[100], borderRadius: tokens.radius.md, border: `1.5px solid ${tokens.colors.neutral[200]}`, overflow: "hidden" }}>
                <button type="button" onClick={() => handleServingsChange(servings - 1)} disabled={servings <= 1}
                  style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", fontSize: "18px", fontWeight: 300, color: servings <= 1 ? tokens.colors.neutral[300] : tokens.colors.neutral[700], cursor: servings <= 1 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  −
                </button>
                <span style={{ minWidth: 36, textAlign: "center", fontSize: "16px", fontWeight: 700, color: tokens.colors.neutral[900] }}>
                  {servings}
                </span>
                <button type="button" onClick={() => handleServingsChange(servings + 1)} disabled={servings >= 12}
                  style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", fontSize: "18px", fontWeight: 300, color: servings >= 12 ? tokens.colors.neutral[300] : tokens.colors.neutral[700], cursor: servings >= 12 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  +
                </button>
              </div>
            </div>

            <div style={{ height: 1, background: tokens.colors.neutral[100] }} />

            {/* Dietary goals */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: tokens.colors.neutral[600], letterSpacing: "0.03em", textTransform: "uppercase", marginBottom: 4 }}>Dietary Goals</p>
              <p style={{ fontSize: "13px", color: tokens.colors.neutral[500], marginBottom: 12, lineHeight: 1.4 }}>Select all that apply</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DIETARY_GOALS.map(g => (
                  <PrefChip key={g.id} label={g.label} active={goals.has(g.id)}
                    onToggle={() => setGoals(prev => { const n = new Set(prev); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n; })} />
                ))}
              </div>
            </div>

            {/* Recipe style */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: tokens.colors.neutral[600], letterSpacing: "0.03em", textTransform: "uppercase", marginBottom: 4 }}>Recipe Style</p>
              <p style={{ fontSize: "13px", color: tokens.colors.neutral[500], marginBottom: 12, lineHeight: 1.4 }}>What kind of cooking do you prefer?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {RECIPE_STYLES.map(s => (
                  <PrefChip key={s.id} label={s.label} sub={s.sub} active={styles.has(s.id)}
                    onToggle={() => setStyles(prev => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })} />
                ))}
              </div>
            </div>

            {/* Spice tolerance */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: tokens.colors.neutral[600], letterSpacing: "0.03em", textTransform: "uppercase", marginBottom: 12 }}>Spice Tolerance</p>
              <SpiceSelector value={spice} onChange={setSpice} />
            </div>

            {/* Excluded ingredients */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: tokens.colors.neutral[600], letterSpacing: "0.03em", textTransform: "uppercase", marginBottom: 4 }}>Exclude Ingredients</p>
              <p style={{ fontSize: "13px", color: tokens.colors.neutral[500], marginBottom: 10, lineHeight: 1.4 }}>We&apos;ll avoid these in recipe suggestions.</p>
              <div
                style={{ background: tokens.colors.neutral[0], border: `1.5px solid ${tokens.colors.neutral[200]}`, borderRadius: tokens.radius.md, padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minHeight: 48, cursor: "text" }}
                onClick={() => exclInputRef.current?.focus()}>
                {exclusions.map(tag => (
                  <ExclusionTag key={tag} label={tag} onRemove={() => setExclusions(prev => prev.filter(e => e !== tag))} />
                ))}
                <input
                  ref={exclInputRef}
                  value={exclInput}
                  onChange={e => setExclInput(e.target.value)}
                  onKeyDown={handleExclKey}
                  placeholder={exclusions.length === 0 ? "e.g. mushrooms, shellfish" : "Add more…"}
                  style={{ flex: "1 1 120px", minWidth: 80, border: "none", background: "transparent", outline: "none", fontSize: "14px", color: tokens.colors.neutral[900], fontFamily: "inherit" }}
                />
              </div>
              <p style={{ marginTop: 6, fontSize: "12px", color: tokens.colors.neutral[400] }}>Press Enter or comma to add</p>
            </div>

            {/* Save Preferences button */}
            <button type="button" onClick={handleSavePrefs} disabled={prefsSaving}
              style={{
                width: "100%", padding: "15px", borderRadius: tokens.radius.lg,
                background: prefsSaved
                  ? tokens.colors.primary[500]
                  : prefsSaving
                    ? tokens.colors.primary[400]
                    : `linear-gradient(160deg, ${tokens.colors.primary[500]} 0%, ${tokens.colors.primary[600]} 100%)`,
                color: "#fff", fontSize: "16px", fontWeight: 600,
                cursor: prefsSaving ? "not-allowed" : "pointer",
                boxShadow: prefsSaving ? "none" : tokens.shadow.cta,
                transition: "all 0.12s ease", fontFamily: "inherit",
                opacity: prefsSaving ? 0.8 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              {prefsSaved ? "Saved ✓" : prefsSaving ? "Saving…" : "Save Preferences"}
            </button>
          </div>
        </CollapsibleSection>

      </div>

      {/* ── Undo snackbar (fixed, above bottom nav) ── */}
      {pendingDelete && (
        <div style={{
          position: "fixed", bottom: 80, left: 16, right: 16, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: tokens.colors.neutral[900], borderRadius: tokens.radius.lg,
          padding: "12px 16px", boxShadow: tokens.shadow.lg,
        }}>
          <span style={{ fontSize: "14px", color: "#fff" }}>
            Removed <strong>{pendingDelete.name}</strong>
          </span>
          <button type="button" onClick={handleUndo}
            style={{ fontSize: "14px", fontWeight: 700, color: tokens.colors.primary[300], background: "none", border: "none", cursor: "pointer", paddingLeft: 16, fontFamily: "inherit" }}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
