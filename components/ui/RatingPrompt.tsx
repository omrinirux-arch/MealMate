"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { tokens } from "@/lib/tokens";

export interface UnratedRecipe {
  title: string;
  dayName: string;
}

interface Props {
  recipes: UnratedRecipe[];
  householdId: string;
  mealPlanId: string;
}

export function RatingPrompt({ recipes, householdId, mealPlanId }: Props) {
  const [queue, setQueue] = useState(recipes);
  const [confirming, setConfirming] = useState<"up" | "down" | null>(null);
  const supabase = createClient();

  if (queue.length === 0) return null;

  const current = queue[0];

  async function submitRating(rating: "up" | "down") {
    setConfirming(rating);
    supabase.from("recipe_ratings").insert({
      household_id: householdId,
      meal_plan_id: mealPlanId,
      recipe_url: "",
      recipe_title: current.title,
      rating,
      cooked_at: new Date().toISOString(),
    }).then(() => {});

    setTimeout(() => {
      setConfirming(null);
      setQueue((prev) => prev.slice(1));
    }, 900);
  }

  function dismiss() {
    setQueue((prev) => prev.slice(1));
  }

  return (
    <div style={{
      background: tokens.colors.neutral[0],
      border: `1px solid ${tokens.colors.neutral[200]}`,
      borderRadius: tokens.radius.lg,
      padding: "16px",
      marginBottom: 16,
      boxShadow: tokens.shadow.sm,
    }}>
      <p style={{
        fontSize: "11px",
        fontWeight: 700,
        color: tokens.colors.neutral[400],
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        margin: "0 0 4px",
      }}>
        How was {current.dayName}&apos;s dinner?
      </p>
      <p style={{
        fontSize: "15px",
        fontWeight: 600,
        color: tokens.colors.neutral[900],
        margin: "0 0 14px",
        lineHeight: 1.3,
      }}>
        {current.title}
      </p>

      {confirming ? (
        <p style={{
          fontSize: "14px",
          fontWeight: 600,
          color: confirming === "up" ? "#2d6e2d" : tokens.colors.neutral[500],
          margin: 0,
        }}>
          {confirming === "up"
            ? "Great! We’ll suggest similar recipes."
            : "Got it, we’ll avoid similar ones."}
        </p>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => submitRating("up")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.colors.neutral[200]}`,
              background: tokens.colors.neutral[0],
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              color: tokens.colors.neutral[700],
            }}
          >
            👍 Loved it
          </button>
          <button
            onClick={() => submitRating("down")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.colors.neutral[200]}`,
              background: tokens.colors.neutral[0],
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              color: tokens.colors.neutral[700],
            }}
          >
            👎 Not for us
          </button>
          <button
            onClick={dismiss}
            style={{
              marginLeft: "auto",
              padding: "8px 10px",
              borderRadius: tokens.radius.md,
              border: "none",
              background: "transparent",
              fontSize: "13px",
              color: tokens.colors.neutral[400],
              cursor: "pointer",
            }}
          >
            Not now
          </button>
        </div>
      )}
    </div>
  );
}
