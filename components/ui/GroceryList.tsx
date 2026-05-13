"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { tokens } from "@/lib/tokens";

// ── Aisle config ──────────────────────────────────────────────────────────────

const AISLE_ORDER = [
  "produce", "meat", "dairy", "bakery", "canned", "frozen", "grains", "snacks", "misc",
] as const;

const AISLE_LABELS: Record<string, string> = {
  produce: "Produce",
  meat: "Meat & Seafood",
  dairy: "Dairy & Eggs",
  bakery: "Bakery",
  canned: "Canned & Jarred",
  frozen: "Frozen",
  grains: "Grains, Pasta & Rice",
  snacks: "Snacks & Other",
  misc: "Miscellaneous",
};

const ICON_PROPS = {
  width: 14, height: 14, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: "2",
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
};

const AISLE_ICONS: Record<string, React.ReactNode> = {
  produce: (
    <svg {...ICON_PROPS}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  meat: (
    <svg {...ICON_PROPS}>
      <path d="M5.52 13.48a5 5 0 1 1 5.04-5.03" />
      <path d="m6.1 6.1 8.49 8.49" />
      <path d="m12 12 5 5-3 3-5-5" />
    </svg>
  ),
  dairy: (
    <svg {...ICON_PROPS}>
      <path d="M8 2h8" />
      <path d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2" />
      <path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0" />
    </svg>
  ),
  bakery: (
    <svg {...ICON_PROPS}>
      <path d="M2 12a5 5 0 0 1 5-5 8 8 0 0 1 14 0 5 5 0 0 1 1 9.9" />
      <path d="M6 20v-2" /><path d="M12 20v-6" /><path d="M18 20v-2" />
    </svg>
  ),
  canned: (
    <svg {...ICON_PROPS}>
      <path d="M4 9v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
      <path d="M4 5a2 2 0 0 0-2 2v2h20V7a2 2 0 0 0-2-2z" />
      <path d="M9 5V3" /><path d="M15 5V3" />
    </svg>
  ),
  frozen: (
    <svg {...ICON_PROPS}>
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4" />
    </svg>
  ),
  grains: (
    <svg {...ICON_PROPS}>
      <path d="M12 22V2" />
      <path d="M17 12c.7-.7 1-1.6 1-2.5a3.5 3.5 0 0 0-7 0c0 .9.3 1.8 1 2.5" />
      <path d="M17 7c.7-.7 1-1.6 1-2.5a3.5 3.5 0 0 0-7 0c0 .9.3 1.8 1 2.5" />
      <path d="M7 12c-.7-.7-1-1.6-1-2.5a3.5 3.5 0 0 1 7 0c0 .9-.3 1.8-1 2.5" />
      <path d="M7 7c-.7-.7-1-1.6-1-2.5a3.5 3.5 0 0 1 7 0c0 .9-.3 1.8-1 2.5" />
    </svg>
  ),
  snacks: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.33 4.06-7.93 6.26-16.5 7.06" />
    </svg>
  ),
  misc: (
    <svg {...ICON_PROPS}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  aisle: string;
  is_checked: boolean;
  is_manual: boolean;
  source_recipe_title: string | null;
}

export interface PantryItem {
  name: string;
  aisle: string;
  sourceRecipes: string[];
  ingredientStrings: string[];
}

interface Props {
  initialItems: GroceryItem[];
  listId: string;
  pantryItems?: PantryItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractAmount(ing: string): string {
  // Match "number unit (optional parens)" e.g. "2 tbsp", "1/2 cup", "1 can (15 oz)", "1 1/2 cups"
  const m = ing.match(/^((?:\d+\s+)?\d+(?:[\/\.]\d+)?)\s+([a-zA-Z]+(?:\s+\([^)]*\))?)/);
  if (m) return `${m[1]} ${m[2]}`;
  const n = ing.match(/^((?:\d+\s+)?\d+(?:[\/\.]\d+)?)/);
  return n ? n[1].trim() : "";
}

function buildShareText(items: GroceryItem[]): string {
  const unchecked = items.filter((i) => !i.is_checked);
  const grouped = new Map<string, GroceryItem[]>();
  for (const item of unchecked) {
    const aisle = item.aisle ?? "misc";
    if (!grouped.has(aisle)) grouped.set(aisle, []);
    grouped.get(aisle)!.push(item);
  }
  return AISLE_ORDER.filter((aisle) => grouped.has(aisle))
    .map((aisle) => {
      const rows = grouped
        .get(aisle)!
        .map((item) => {
          const qty = [item.quantity, item.unit].filter(Boolean).join(" ");
          return `□ ${item.name}${qty ? `, ${qty}` : ""}`;
        })
        .join("\n");
      return `${(AISLE_LABELS[aisle] ?? aisle).toUpperCase()}\n${rows}`;
    })
    .join("\n\n");
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GroceryList({ initialItems, listId, pantryItems }: Props) {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [addValue, setAddValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set());
  const [expandedPantry, setExpandedPantry] = useState<Set<string>>(new Set());
  const [alreadyHaveOpen, setAlreadyHaveOpen] = useState(false);
  const [copyConfirmed, setCopyConfirmed] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const itemNamesLower = new Set(items.map((i) => i.name.toLowerCase()));
  const visiblePantry = (pantryItems ?? []).filter(
    (p) => !itemNamesLower.has(p.name.toLowerCase())
  );

  const pendingDeleteRef = useRef<{
    id: string;
    item: GroceryItem;
    timeoutId: ReturnType<typeof setTimeout>;
  } | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkedCount = items.filter((i) => i.is_checked).length;
  const totalCount = items.length;
  const allDone = totalCount > 0 && checkedCount === totalCount;
  const progressPct = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  const grouped = new Map<string, GroceryItem[]>();
  for (const item of items) {
    const aisle = item.aisle ?? "misc";
    if (!grouped.has(aisle)) grouped.set(aisle, []);
    grouped.get(aisle)!.push(item);
  }

  function notifyBadge() {
    window.dispatchEvent(new CustomEvent("groceryItemsChanged"));
  }

  function toggleCheck(id: string, current: boolean) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_checked: !current } : i)));
    notifyBadge();
    const supabase = createClient();
    supabase.from("grocery_items").update({ is_checked: !current }).eq("id", id).then(() => {});
  }

  function deleteItem(item: GroceryItem) {
    // Flush any in-flight delete immediately
    if (pendingDeleteRef.current) {
      const { id, timeoutId } = pendingDeleteRef.current;
      clearTimeout(timeoutId);
      pendingDeleteRef.current = null;
      const supabase = createClient();
      supabase.from("grocery_items").delete().eq("id", id).then(() => {});
    }

    // Dismiss current toast timer
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    // Optimistically remove from UI
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    notifyBadge();

    // Schedule DB delete after 3s (can be cancelled by undo)
    const timeoutId = setTimeout(() => {
      pendingDeleteRef.current = null;
      setToast(null);
      const supabase = createClient();
      void supabase.from("grocery_items").delete().eq("id", item.id);
    }, 3000);

    pendingDeleteRef.current = { id: item.id, item, timeoutId };

    const displayName = item.name.length > 24 ? item.name.slice(0, 24) + "…" : item.name;
    setToast({ message: `Removed “${displayName}”` });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }

  function undoDelete() {
    if (!pendingDeleteRef.current) return;
    const { item, timeoutId } = pendingDeleteRef.current;
    clearTimeout(timeoutId);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    pendingDeleteRef.current = null;
    setItems((prev) => [...prev, item]);
    notifyBadge();
    setToast(null);
  }

  async function addItem() {
    const name = addValue.trim();
    if (!name || isAdding) return;
    setAddValue("");
    setIsAdding(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("grocery_items")
      .insert({
        grocery_list_id: listId,
        name,
        quantity: "",
        unit: "",
        aisle: "misc",
        is_checked: false,
        is_manual: true,
        source_recipe_title: null,
      })
      .select("id, name, quantity, unit, aisle, is_checked, is_manual, source_recipe_title")
      .single();

    setIsAdding(false);
    if (!error && data) {
      setItems((prev) => [...prev, data as GroceryItem]);
      notifyBadge();
    }
  }

  function movePantryItemToList(p: PantryItem) {
    const amount = p.ingredientStrings.map(extractAmount).filter(Boolean).join(" · ");
    const newItem: GroceryItem = {
      id: crypto.randomUUID(),
      name: p.name,
      quantity: amount,
      unit: "",
      aisle: p.aisle,
      is_checked: false,
      is_manual: false,
      source_recipe_title: p.sourceRecipes.join(", ") || null,
    };
    setItems((prev) => [...prev, newItem]);
    notifyBadge();
    const supabase = createClient();
    supabase.from("grocery_items").insert({ ...newItem, grocery_list_id: listId }).then(() => {});
  }

  async function copyToClipboard() {
    const text = buildShareText(items);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-HTTPS or browsers without Clipboard API
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopyConfirmed(true);
      setTimeout(() => setCopyConfirmed(false), 1500);
    } catch {
      // copy silently failed
    }
  }

  async function shareList() {
    const text = buildShareText(items);
    if (navigator.share) {
      try {
        await navigator.share({ text, title: "Grocery List" });
        setShowShareSheet(false);
        return;
      } catch {
        // user cancelled or API unavailable — fall through
      }
    }
    await copyToClipboard();
    setShowShareSheet(false);
  }

  return (
    <>
      {/* Header */}
      <div style={{
        padding: "32px 20px 12px",
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
        background: tokens.colors.neutral[0],
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "13px", color: tokens.colors.neutral[500], margin: "0 0 4px" }}>
              This week
            </p>
            <h1 style={{
              fontSize: "22px",
              fontWeight: 700,
              color: tokens.colors.neutral[900],
              letterSpacing: tokens.typography.letterSpacing.heading,
              margin: "0 0 8px",
            }}>
              Grocery List
            </h1>
          </div>
          {/* Share button */}
          <button
            type="button"
            onClick={() => setShowShareSheet(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: tokens.colors.neutral[100],
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 30,
            }}
            aria-label="Share grocery list"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={tokens.colors.neutral[600]} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>

        {/* Progress text */}
        {totalCount > 0 && (
          <p style={{
            fontSize: "13px",
            fontWeight: 600,
            color: allDone ? tokens.colors.primary[600] : tokens.colors.neutral[500],
            margin: "0 0 8px",
          }}>
            {allDone ? "All done ✓" : `${checkedCount} of ${totalCount} items`}
          </p>
        )}

        {/* Progress bar */}
        {totalCount > 0 && (
          <div style={{
            height: 3,
            borderRadius: tokens.radius.pill,
            background: tokens.colors.neutral[200],
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              borderRadius: tokens.radius.pill,
              background: allDone ? tokens.colors.primary[500] : tokens.colors.primary[400],
              width: `${progressPct}%`,
              transition: "width 0.2s ease, background 0.2s ease",
            }} />
          </div>
        )}
      </div>

      {/* Add item row */}
      <div style={{
        background: tokens.colors.neutral[0],
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 20px" }}>
          <div style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: `2px solid ${tokens.colors.primary[400]}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: isAdding ? 0.4 : 1,
            transition: "opacity 0.15s",
          }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <line x1="5.5" y1="1" x2="5.5" y2="10" stroke={tokens.colors.primary[500]} strokeWidth="2" strokeLinecap="round" />
              <line x1="1" y1="5.5" x2="10" y2="5.5" stroke={tokens.colors.primary[500]} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <input
            type="text"
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void addItem(); } }}
            placeholder="Add an item (paper towels, snacks...)"
            disabled={isAdding}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "15px",
              color: tokens.colors.neutral[800],
              fontFamily: tokens.typography.fontFamily,
              padding: 0,
            }}
          />
        </div>
      </div>

      {/* Aisle sections */}
      <div style={{ paddingBottom: visiblePantry.length > 0 ? 8 : 32 }}>
        {AISLE_ORDER.filter((aisle) => grouped.has(aisle)).map((aisle) => {
          const aisleItems = grouped.get(aisle)!;
          return (
            <div key={aisle} style={{ marginBottom: 8 }}>
              {/* Section header */}
              <div style={{ padding: "6px 20px", background: tokens.colors.neutral[50] }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: tokens.colors.neutral[500] }}>
                  {AISLE_ICONS[aisle]}
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {AISLE_LABELS[aisle] ?? aisle}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div style={{ background: tokens.colors.neutral[0] }}>
                {aisleItems.map((item, idx) => {
                  const quantityStr = [item.quantity, item.unit].filter(Boolean).join(" ");
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "13px 20px",
                        borderBottom: idx < aisleItems.length - 1
                          ? `1px solid ${tokens.colors.neutral[100]}`
                          : "none",
                        opacity: item.is_checked ? 0.45 : 1,
                        transition: "opacity 0.15s ease",
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id, item.is_checked)}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          border: item.is_checked ? "none" : `2px solid ${tokens.colors.neutral[300]}`,
                          background: item.is_checked ? tokens.colors.primary[500] : "transparent",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0,
                          transition: "background 0.15s ease, border 0.15s ease",
                        }}
                        aria-label={item.is_checked ? "Uncheck" : "Check"}
                      >
                        {item.is_checked && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>

                      {/* Name + source — also toggles check */}
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id, item.is_checked)}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          padding: 0,
                          fontFamily: "inherit",
                        }}
                      >
                        <p style={{
                          fontSize: "15px",
                          fontWeight: 500,
                          color: tokens.colors.neutral[900],
                          margin: 0,
                          textDecoration: item.is_checked ? "line-through" : "none",
                        }}>
                          {item.name}
                        </p>
                        {item.source_recipe_title && (() => {
                          const title = item.source_recipe_title;
                          const LIMIT = 30;
                          const needsTrunc = title.length > LIMIT;
                          const isExpanded = expandedRecipes.has(item.id);
                          return (
                            <>
                              <p style={{
                                fontSize: "11px",
                                color: tokens.colors.neutral[400],
                                margin: "2px 0 0",
                                ...(!isExpanded ? {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                } : {}),
                              }}>
                                {title}
                              </p>
                              {needsTrunc && (
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedRecipes((prev) => {
                                      const next = new Set(prev);
                                      if (isExpanded) next.delete(item.id);
                                      else next.add(item.id);
                                      return next;
                                    });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.stopPropagation();
                                      setExpandedRecipes((prev) => {
                                        const next = new Set(prev);
                                        if (isExpanded) next.delete(item.id);
                                        else next.add(item.id);
                                        return next;
                                      });
                                    }
                                  }}
                                  style={{
                                    display: "inline-block",
                                    marginTop: 1,
                                    fontSize: "11px",
                                    color: tokens.colors.primary[500],
                                    cursor: "pointer",
                                  }}
                                >
                                  {isExpanded ? "see less" : "see more"}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </button>

                      {/* Quantity */}
                      {quantityStr && (
                        <p style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: tokens.colors.neutral[500],
                          margin: 0,
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}>
                          {quantityStr}
                        </p>
                      )}

                      {/* Delete × */}
                      <button
                        type="button"
                        onClick={() => deleteItem(item)}
                        style={{
                          width: 28,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          borderRadius: "50%",
                          flexShrink: 0,
                          color: tokens.colors.neutral[400],
                          padding: 0,
                        }}
                        aria-label={`Remove ${item.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Already have section */}
      {visiblePantry.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          {/* Section header — clickable to collapse/expand */}
          <button
            type="button"
            onClick={() => setAlreadyHaveOpen((v) => !v)}
            style={{
              width: "100%",
              padding: "6px 20px",
              background: tokens.colors.neutral[50],
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: tokens.colors.neutral[500] }}>
              {/* Home/pantry icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Already Have
              </span>
              <span style={{
                fontSize: "11px",
                fontWeight: 600,
                color: tokens.colors.neutral[400],
                textTransform: "none",
                letterSpacing: 0,
              }}>
                ({visiblePantry.length})
              </span>
            </div>
            {/* Chevron */}
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={tokens.colors.neutral[400]} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{
                transform: alreadyHaveOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
                flexShrink: 0,
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Items */}
          {alreadyHaveOpen && <div style={{ background: tokens.colors.neutral[0] }}>
            {visiblePantry.map((p, idx) => {
              const recipeText = p.sourceRecipes.join(", ");
              const amountText = p.ingredientStrings
                .map(extractAmount)
                .filter(Boolean)
                .join(" · ");
              const LIMIT = 30;
              const needsTrunc = recipeText.length > LIMIT;
              const isExpanded = expandedPantry.has(p.name);
              return (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "13px 20px",
                    borderBottom: idx < visiblePantry.length - 1
                      ? `1px solid ${tokens.colors.neutral[100]}`
                      : "none",
                    opacity: 0.75,
                  }}
                >
                  {/* Green checked checkbox */}
                  <button
                    type="button"
                    onClick={() => movePantryItemToList(p)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: "none",
                      background: tokens.colors.primary[500],
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    aria-label={`Move ${p.name} to shopping list`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Name + recipe subtitle */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: "15px",
                      fontWeight: 500,
                      color: tokens.colors.neutral[900],
                      margin: 0,
                      textDecoration: "line-through",
                    }}>
                      {p.name}
                    </p>
                    {recipeText && (
                      <>
                        <p style={{
                          fontSize: "11px",
                          color: tokens.colors.neutral[400],
                          margin: "2px 0 0",
                          ...(!isExpanded ? {
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          } : {}),
                        }}>
                          {recipeText}
                        </p>
                        {needsTrunc && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPantry((prev) => {
                                const next = new Set(prev);
                                if (isExpanded) next.delete(p.name);
                                else next.add(p.name);
                                return next;
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                setExpandedPantry((prev) => {
                                  const next = new Set(prev);
                                  if (isExpanded) next.delete(p.name);
                                  else next.add(p.name);
                                  return next;
                                });
                              }
                            }}
                            style={{
                              display: "inline-block",
                              marginTop: 1,
                              fontSize: "11px",
                              color: tokens.colors.primary[500],
                              cursor: "pointer",
                            }}
                          >
                            {isExpanded ? "see less" : "see more"}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Amount */}
                  {amountText && (
                    <p style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: tokens.colors.neutral[500],
                      margin: 0,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}>
                      {amountText}
                    </p>
                  )}
                </div>
              );
            })}
          </div>}
        </div>
      )}

      {/* Undo toast */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 84,
          left: 16,
          right: 16,
          zIndex: 49,
          background: tokens.colors.neutral[900],
          borderRadius: tokens.radius.lg,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          boxShadow: tokens.shadow.lg,
        }}>
          <span style={{ fontSize: "14px", color: tokens.colors.neutral[0], fontWeight: 500 }}>
            {toast.message}
          </span>
          <button
            type="button"
            onClick={undoDelete}
            style={{
              background: "none",
              border: `1px solid ${tokens.colors.neutral[600]}`,
              borderRadius: tokens.radius.pill,
              padding: "5px 14px",
              fontSize: "13px",
              fontWeight: 600,
              color: tokens.colors.neutral[0],
              cursor: "pointer",
              flexShrink: 0,
              fontFamily: "inherit",
            }}
          >
            Undo
          </button>
        </div>
      )}

      {/* Share sheet backdrop */}
      {showShareSheet && (
        <div
          onClick={() => setShowShareSheet(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 60,
          }}
        />
      )}

      {/* Share sheet */}
      {showShareSheet && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 61,
          background: tokens.colors.neutral[0],
          borderRadius: `${tokens.radius.xl} ${tokens.radius.xl} 0 0`,
          paddingBottom: 24,
          boxShadow: tokens.shadow.lg,
        }}>
          {/* Handle */}
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: tokens.colors.neutral[300] }} />
          </div>

          <p style={{
            fontSize: "13px",
            fontWeight: 600,
            color: tokens.colors.neutral[500],
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "6px 0 0",
          }}>
            Share list
          </p>

          {/* Copy to clipboard */}
          <button
            type="button"
            onClick={() => void copyToClipboard()}
            style={{
              width: "100%",
              padding: "16px 20px",
              background: "none",
              border: "none",
              borderTop: `1px solid ${tokens.colors.neutral[100]}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontFamily: "inherit",
              marginTop: 8,
            }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: tokens.radius.md,
              background: tokens.colors.neutral[100],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke={tokens.colors.neutral[700]} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </div>
            <span style={{
              fontSize: "16px",
              fontWeight: 500,
              color: copyConfirmed ? tokens.colors.primary[600] : tokens.colors.neutral[900],
              transition: "color 0.15s",
            }}>
              {copyConfirmed ? "Copied!" : "Copy to clipboard"}
            </span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => void shareList()}
            style={{
              width: "100%",
              padding: "16px 20px",
              background: "none",
              border: "none",
              borderTop: `1px solid ${tokens.colors.neutral[100]}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontFamily: "inherit",
            }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: tokens.radius.md,
              background: tokens.colors.neutral[100],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke={tokens.colors.neutral[700]} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
            <span style={{ fontSize: "16px", fontWeight: 500, color: tokens.colors.neutral[900] }}>
              Share
            </span>
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={() => setShowShareSheet(false)}
            style={{
              display: "block",
              width: "calc(100% - 40px)",
              margin: "8px 20px 0",
              padding: "15px",
              background: tokens.colors.neutral[100],
              border: "none",
              borderRadius: tokens.radius.lg,
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: 600,
              color: tokens.colors.neutral[700],
              fontFamily: "inherit",
              textAlign: "center",
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </>
  );
}
