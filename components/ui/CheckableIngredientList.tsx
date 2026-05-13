"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { tokens } from "@/lib/tokens";

// Strip leading quantities/measurements to get just the ingredient name.
// e.g. "2 tablespoons olive oil, divided" → "olive oil"
function extractName(full: string): string {
  const cleaned = full
    .replace(/^[\d\s\-\/\.¼½¾⅓⅔⅛⅜⅝⅞]+/, "")
    .replace(
      /^(cups?|tablespoons?|tbsps?|teaspoons?|tsps?|ounces?|oz|pounds?|lbs?|grams?|g|ml|liters?|l|pinch|dash|handful|cloves?|slices?|pieces?|cans?|packages?|pkg|bunches?|heads?|stalks?|sprigs?)\s+/i,
      ""
    )
    .replace(/,.*$/, "")
    .trim();
  return cleaned || full.trim();
}

interface Props {
  ingredients: string[];
  householdId: string;
  planId: string;
}

export function CheckableIngredientList({ ingredients, householdId, planId }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [staplePrompt, setStaplePrompt] = useState<number | null>(null);
  const [savedAsStaple, setSavedAsStaple] = useState<Set<number>>(new Set());

  async function toggle(idx: number) {
    const isChecking = !checked.has(idx);

    setChecked((prev) => {
      const next = new Set(prev);
      isChecking ? next.add(idx) : next.delete(idx);
      return next;
    });

    const supabase = createClient();
    const name = extractName(ingredients[idx]);

    if (isChecking) {
      setStaplePrompt(idx);
      await supabase.from("on_hand_items").insert({ household_id: householdId, meal_plan_id: planId, name });
    } else {
      setStaplePrompt(null);
      await supabase
        .from("on_hand_items")
        .delete()
        .eq("household_id", householdId)
        .eq("meal_plan_id", planId)
        .eq("name", name);
    }
  }

  async function addToStaples(idx: number) {
    setStaplePrompt(null);
    const supabase = createClient();
    const name = extractName(ingredients[idx]);
    const { error } = await supabase
      .from("staple_items")
      .insert({ household_id: householdId, name, category: "other" });
    if (!error) {
      setSavedAsStaple((prev) => new Set(prev).add(idx));
      window.dispatchEvent(new CustomEvent("staples-changed"));
    }
  }

  return (
    <div>
      {ingredients.map((ingr, idx) => {
        const done = checked.has(idx);
        const showPrompt = staplePrompt === idx;
        const isStaple = savedAsStaple.has(idx);

        return (
          <div key={idx}>
            {/* Row */}
            <button
              type="button"
              onClick={() => toggle(idx)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 0",
                background: "none",
                border: "none",
                borderBottom: `1px solid ${tokens.colors.neutral[100]}`,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <div style={{
                flexShrink: 0,
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: done ? "none" : `1.5px solid ${tokens.colors.neutral[300]}`,
                background: done ? "#dcf0dc" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}>
                {done && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#2d6e2d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{
                fontSize: "14px",
                flex: 1,
                color: done ? tokens.colors.neutral[400] : tokens.colors.neutral[700],
                textDecoration: done ? "line-through" : "none",
                transition: "color 0.15s",
              }}>
                {ingr}
              </span>
              {isStaple && (
                <span style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: tokens.colors.primary[500],
                  background: tokens.colors.primary[100],
                  borderRadius: 9999,
                  padding: "2px 7px",
                  flexShrink: 0,
                }}>
                  staple
                </span>
              )}
            </button>

            {/* Staple prompt — appears inline below the checked item */}
            {showPrompt && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 20px 9px 30px",
                margin: "0 -20px",
                background: tokens.colors.primary[100],
                borderBottom: `1px solid ${tokens.colors.primary[200]}`,
              }}>
                <span style={{ fontSize: "13px", color: tokens.colors.primary[700], fontWeight: 500 }}>
                  Add to staples?
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => addToStaples(idx)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 9999,
                      background: tokens.colors.primary[500],
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaplePrompt(null)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 9999,
                      background: "transparent",
                      color: tokens.colors.primary[600],
                      fontSize: "12px",
                      fontWeight: 600,
                      border: `1px solid ${tokens.colors.primary[300]}`,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
