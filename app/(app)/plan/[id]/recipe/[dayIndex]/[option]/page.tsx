export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMealPlanWithDays, getStapleItems, getOnHandItemsForPlan } from "@/lib/supabase/queries";
import { tokens } from "@/lib/tokens";
import { CheckableIngredientList } from "@/components/ui/CheckableIngredientList";
import { SelectRecipeButton } from "@/components/ui/SelectRecipeButton";
import { RecipeRatingButtons } from "@/components/ui/RecipeRatingButtons";
import { isAnyHighlighted } from "@/lib/ingredient-match";
import { selectRecipeAction, rateRecipeAction } from "./actions";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoredRecipe {
  title: string;
  url: string;
  image_url: string | null;
  prep_time: string;
  cook_time: string;
  description: string;
  preferences_match?: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  servings: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function isHighlighted(ingredient: string, highlights: string[]): boolean {
  return isAnyHighlighted(ingredient, highlights);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RecipeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; dayIndex: string; option: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ id, dayIndex, option }, { from }] = await Promise.all([params, searchParams]);
  const backHref = from === "home" ? "/home" : `/plan/${id}`;
  const supabase = await createClient();

  const { data: rawPlan } = await getMealPlanWithDays(supabase, id);
  if (!rawPlan) notFound();
  const plan = rawPlan as unknown as { id: string; household_id: string; week_start: string; status: string; meal_plan_days: unknown[] };

  const days = (plan.meal_plan_days ?? []) as Array<{
    day_index: number;
    option_a: unknown;
    option_b: unknown;
    selected_option: "a" | "b" | "skip" | null;
  }>;

  const day = days.find((d) => d.day_index === parseInt(dayIndex));
  if (!day) notFound();

  const currentOption = option as "a" | "b";
  const recipe = (currentOption === "a" ? day.option_a : day.option_b) as StoredRecipe | null;
  if (!recipe) notFound();

  const isAlreadySelected = day.selected_option === currentOption;
  const peerIsSelected =
    day.selected_option !== null &&
    day.selected_option !== "skip" &&
    day.selected_option !== currentOption;

  const dayDate = new Date(plan.week_start + "T12:00:00");
  dayDate.setDate(dayDate.getDate() + parseInt(dayIndex));
  const dayName = DAY_NAMES[dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1] ?? "this day";

  const isConfirmed = plan.status === "confirmed";

  const [staplesRes, onHandRes, ratingRes] = await Promise.all([
    getStapleItems(supabase, plan.household_id),
    getOnHandItemsForPlan(supabase, id),
    isConfirmed
      ? supabase
          .from("recipe_ratings")
          .select("rating")
          .eq("household_id", plan.household_id)
          .eq("meal_plan_id", id)
          .eq("recipe_title", recipe.title)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const currentRating = (ratingRes.data as { rating?: "up" | "down" | null } | null)?.rating ?? null;

  const highlights = [
    ...(staplesRes.data ?? []).map((s) => s.name),
    ...(onHandRes.data ?? []).map((i) => i.name),
  ];

  const haveIngredients = recipe.ingredients.filter((i) => isHighlighted(i, highlights));
  const needIngredients = recipe.ingredients.filter((i) => !isHighlighted(i, highlights));
  const instructions = recipe.instructions ?? [];

  const timeStr = [
    recipe.prep_time ? `${recipe.prep_time} prep` : null,
    recipe.cook_time ? `${recipe.cook_time} cook` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div style={{ background: tokens.colors.neutral[50], minHeight: "calc(100vh - 72px)" }}>

      {/* Fixed back bar */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: tokens.colors.neutral[0],
        borderBottom: `1px solid ${tokens.colors.neutral[100]}`,
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
      }}>
        <Link href={backHref} style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          textDecoration: "none",
          color: tokens.colors.neutral[700],
          fontSize: "14px",
          fontWeight: 600,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </Link>
      </div>

      {/* Content */}
      <div style={{ padding: "64px 20px 120px" }}>

        {/* Title + meta */}
        <h1 style={{
          fontSize: "22px",
          fontWeight: 700,
          color: tokens.colors.neutral[900],
          letterSpacing: tokens.typography.letterSpacing.heading,
          margin: "0 0 8px",
          lineHeight: 1.25,
        }}>
          {recipe.title}
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {timeStr && (
            <span style={{ fontSize: "13px", color: tokens.colors.neutral[500] }}>{timeStr}</span>
          )}
          {recipe.servings > 0 && (
            <span style={{ fontSize: "13px", color: tokens.colors.neutral[500] }}>
              {recipe.servings} servings
            </span>
          )}
          <span style={{
            fontSize: "12px",
            fontWeight: 600,
            color: haveIngredients.length > 0 ? "#2d6e2d" : tokens.colors.neutral[500],
            background: haveIngredients.length > 0 ? "#dcf0dc" : tokens.colors.neutral[100],
            borderRadius: 9999,
            padding: "3px 10px",
          }}>
            {haveIngredients.length} / {recipe.ingredients.length} on hand
          </span>
        </div>

        {/* Why this fits you — only if blurb exists */}
        {recipe.preferences_match && (
          <div
            style={{
              marginBottom: 24,
              padding: "12px 14px",
              borderRadius: tokens.radius.lg,
              background: tokens.colors.primary[50],
              border: `1px solid ${tokens.colors.primary[100]}`,
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: tokens.colors.primary[700],
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 4px",
              }}
            >
              Why this fits you
            </p>
            <p
              style={{
                fontSize: "13px",
                color: tokens.colors.primary[700],
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {recipe.preferences_match}
            </p>
          </div>
        )}

        {/* Ingredients */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: "14px",
            fontWeight: 700,
            color: tokens.colors.neutral[900],
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 12px",
          }}>
            Ingredients
          </h2>

          {haveIngredients.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#2d6e2d", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>
                You have
              </p>
              {haveIngredients.map((ingr, idx) => (
                <div key={idx} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 0",
                  borderBottom: `1px solid ${tokens.colors.neutral[100]}`,
                }}>
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 6l3 3 5-5" stroke="#2d6e2d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: "14px", color: tokens.colors.neutral[800] }}>{ingr}</span>
                </div>
              ))}
            </div>
          )}

          {needIngredients.length > 0 && (
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: tokens.colors.neutral[400], textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>
                You need
              </p>
              <CheckableIngredientList ingredients={needIngredients} householdId={plan.household_id} planId={id} />
            </div>
          )}
        </section>

        {/* Instructions */}
        {instructions.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{
              fontSize: "14px",
              fontWeight: 700,
              color: tokens.colors.neutral[900],
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 12px",
            }}>
              Instructions
            </h2>
            {instructions.map((step, idx) => (
              <div key={idx} style={{
                display: "flex",
                gap: 12,
                marginBottom: 16,
                alignItems: "flex-start",
              }}>
                <div style={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: tokens.colors.primary[100],
                  color: tokens.colors.primary[600],
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {idx + 1}
                </div>
                <p style={{ fontSize: "14px", color: tokens.colors.neutral[700], lineHeight: 1.55, margin: 0 }}>
                  {step}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Source link */}
        {recipe.url && (
          <a
            href={recipe.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              textAlign: "center",
              padding: "13px",
              borderRadius: tokens.radius.lg,
              border: `1px solid ${tokens.colors.neutral[200]}`,
              fontSize: "14px",
              fontWeight: 600,
              color: tokens.colors.neutral[600],
              textDecoration: "none",
              background: tokens.colors.neutral[0],
            }}
          >
            View original recipe ↗
          </a>
        )}

      </div>

      {/* Sticky bottom bar — sits above the fixed bottom nav */}
      <div style={{
        position: "sticky",
        bottom: 72,
        padding: "12px 20px",
        background: tokens.colors.neutral[0],
        borderTop: `1px solid ${tokens.colors.neutral[200]}`,
        boxShadow: "0 -4px 16px rgba(53,47,45,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        <SelectRecipeButton
          planId={id}
          dayIndex={parseInt(dayIndex)}
          option={currentOption}
          dayName={dayName}
          isAlreadySelected={isAlreadySelected}
          peerIsSelected={peerIsSelected}
          selectAction={selectRecipeAction}
        />
        {isConfirmed && (
          <RecipeRatingButtons
            planId={id}
            recipeTitle={recipe.title}
            recipeUrl={recipe.url ?? ""}
            currentRating={currentRating}
            rateAction={rateRecipeAction}
          />
        )}
      </div>

    </div>
  );
}
