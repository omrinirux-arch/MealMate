"use client";

import { useState, useEffect } from "react";
import { tokens } from "@/lib/tokens";
import { ingredientMatches } from "@/lib/ingredient-match";

const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface StoredRecipe {
  title?: string;
  prep_time?: string;
  cook_time?: string;
  description?: string;
  ingredients?: string[];
}

interface PlanDay {
  day_index: number;
  selected_option: "a" | "b" | "skip" | null;
  option_a: StoredRecipe | null;
  option_b: StoredRecipe | null;
}

interface Props {
  planId: string;
  weekStart: string;
  days: PlanDay[];
  highlights: string[];
}

export function HomePlanStrip({ planId, weekStart, days, highlights }: Props) {
  const sortedDays = [...days].sort((a, b) => a.day_index - b.day_index);
  const firstDayIndex = sortedDays[0]?.day_index ?? 0;

  const [selectedIndex, setSelectedIndex] = useState(firstDayIndex);
  const [todayIndex, setTodayIndex] = useState<number | null>(null);

  useEffect(() => {
    const weekStartDate = new Date(weekStart + "T00:00:00");
    const today = new Date();
    const diff = Math.floor(
      (today.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const idx = Math.max(0, Math.min(6, diff));
    setTodayIndex(idx);
    // Select today if it's in the plan, else select the first plan day
    const planIndices = new Set(days.map((d) => d.day_index));
    setSelectedIndex(planIndices.has(idx) ? idx : firstDayIndex);
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const dayMap = new Map<number, PlanDay>(days.map((d) => [d.day_index, d]));

  function dateObjForIndex(i: number): Date {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + i);
    return d;
  }

  function dateForIndex(i: number): number {
    return dateObjForIndex(i).getDate();
  }

  function dayAbbrForIndex(i: number): string {
    const jsDay = dateObjForIndex(i).getDay();
    return DAY_ABBR[jsDay === 0 ? 6 : jsDay - 1];
  }

  const selectedDay = dayMap.get(selectedIndex) ?? null;

  function getRecipe(day: PlanDay): StoredRecipe | null {
    if (day.selected_option === "a") return day.option_a;
    if (day.selected_option === "b") return day.option_b;
    return null;
  }

  function matchCount(recipe: StoredRecipe): number {
    if (!highlights.length || !recipe.ingredients?.length) return 0;
    return recipe.ingredients.filter((ing) =>
      highlights.some((h) => ingredientMatches(ing, h))
    ).length;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Date strip */}
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          scrollbarWidth: "none",
          paddingBottom: 2,
        }}
      >
        {sortedDays.map(({ day_index: i }) => {
          const isToday = i === todayIndex;
          const isSelected = i === selectedIndex;

          let bg = "transparent";
          let color: string = tokens.colors.neutral[500];
          let border = `1.5px solid transparent`;
          let fontWeight: number = 500;

          if (isToday && isSelected) {
            bg = tokens.colors.primary[500];
            color = "#fff";
            fontWeight = 700;
            border = `1.5px solid ${tokens.colors.primary[500]}`;
          } else if (isToday) {
            bg = tokens.colors.primary[500];
            color = "#fff";
            fontWeight = 700;
            border = `1.5px solid ${tokens.colors.primary[500]}`;
          } else if (isSelected) {
            bg = tokens.colors.primary[100];
            color = tokens.colors.primary[700];
            fontWeight = 600;
            border = `1.5px solid ${tokens.colors.primary[300]}`;
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "8px 12px",
                borderRadius: tokens.radius.lg,
                background: bg,
                border,
                color,
                fontWeight,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.12s, color 0.12s",
              }}
            >
              <span style={{ fontSize: "11px", letterSpacing: "0.03em" }}>
                {dayAbbrForIndex(i)}
              </span>
              <span style={{ fontSize: "16px" }}>{dateForIndex(i)}</span>
            </button>
          );
        })}
      </div>

      {/* Recipe card */}
      {!selectedDay || selectedDay.selected_option === null ? (
        <div
          style={{
            background: tokens.colors.neutral[0],
            border: `1px solid ${tokens.colors.neutral[200]}`,
            borderRadius: tokens.radius.lg,
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            boxShadow: tokens.shadow.sm,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "14px", color: tokens.colors.neutral[500], margin: 0 }}>
            No recipe chosen for this day
          </p>
          <a
            href={`/plan/${planId}`}
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: tokens.colors.primary[600],
              textDecoration: "none",
            }}
          >
            Go to plan →
          </a>
        </div>
      ) : selectedDay.selected_option === "skip" ? (
        <div
          style={{
            background: tokens.colors.neutral[50],
            border: `1px solid ${tokens.colors.neutral[200]}`,
            borderRadius: tokens.radius.lg,
            padding: "20px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: tokens.shadow.sm,
            opacity: 0.7,
          }}
        >
          <p style={{ fontSize: "14px", color: tokens.colors.neutral[500], margin: 0 }}>
            No dinner this day
          </p>
        </div>
      ) : (() => {
        const recipe = getRecipe(selectedDay);
        if (!recipe) return null;
        const have = matchCount(recipe);
        const option = selectedDay.selected_option as "a" | "b";

        return (
          <a
            href={`/plan/${planId}/recipe/${selectedDay.day_index}/${option}?from=home`}
            style={{
              display: "block",
              background: tokens.colors.neutral[0],
              border: `1px solid ${tokens.colors.neutral[200]}`,
              borderRadius: tokens.radius.lg,
              padding: "16px",
              boxShadow: tokens.shadow.sm,
              textDecoration: "none",
            }}
          >
            <p
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: tokens.colors.neutral[900],
                margin: "0 0 6px",
                letterSpacing: tokens.typography.letterSpacing.heading,
                lineHeight: 1.3,
              }}
            >
              {recipe.title ?? "Untitled recipe"}
            </p>

            {(recipe.prep_time || recipe.cook_time) && (
              <p style={{ fontSize: "13px", color: tokens.colors.neutral[500], margin: "0 0 8px" }}>
                {[recipe.prep_time && `Prep ${recipe.prep_time}`, recipe.cook_time && `Cook ${recipe.cook_time}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            {have > 0 && (
              <span
                style={{
                  display: "inline-block",
                  marginBottom: 8,
                  padding: "3px 9px",
                  borderRadius: tokens.radius.pill,
                  background: tokens.colors.primary[100],
                  color: tokens.colors.primary[700],
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {have} ingredient{have !== 1 ? "s" : ""} on hand
              </span>
            )}

            {recipe.description && (
              <p
                style={{
                  fontSize: "13px",
                  color: tokens.colors.neutral[600],
                  margin: "0 0 12px",
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {recipe.description}
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, color: tokens.colors.primary[600] }}>
                View recipe →
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: tokens.colors.semantic.success,
                  background: tokens.colors.primary[50],
                  padding: "3px 8px",
                  borderRadius: tokens.radius.pill,
                }}
              >
                Selected ✓
              </span>
            </div>
          </a>
        );
      })()}
    </div>
  );
}
