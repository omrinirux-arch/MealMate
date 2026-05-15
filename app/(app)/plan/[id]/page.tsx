export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getMealPlanWithDays,
  getStapleItems,
  getOnHandItemsForPlan,
} from "@/lib/supabase/queries";
import { tokens } from "@/lib/tokens";
import { isAnyHighlighted } from "@/lib/ingredient-match";
import { SelectableRecipeCard } from "@/components/ui/SelectableRecipeCard";
import { PlanActions } from "@/components/ui/PlanActions";
import { DayActions } from "@/components/ui/DayActions";
import { selectRecipeAction, confirmPlanAction, skipDayAction, unskipDayAction } from "./actions";
import { DraftPlanGuard } from "@/components/ui/DraftPlanGuard";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoredRecipe {
  title: string;
  url: string;
  image_url: string | null;
  prep_time: string;
  cook_time: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  servings: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDateRange(weekStart: string, firstDayIndex: number, lastDayIndex: number): string {
  const base = new Date(weekStart + "T12:00:00");
  const first = new Date(base);
  first.setDate(base.getDate() + firstDayIndex);
  const last = new Date(base);
  last.setDate(base.getDate() + lastDayIndex);
  if (first.getMonth() === last.getMonth()) {
    return `${MONTHS[first.getMonth()]} ${first.getDate()} – ${last.getDate()}`;
  }
  return `${MONTHS[first.getMonth()]} ${first.getDate()} – ${MONTHS[last.getMonth()]} ${last.getDate()}`;
}

// ── Empty slot ────────────────────────────────────────────────────────────────

function EmptySlot() {
  return (
    <div style={{
      flex: "1 1 0",
      minWidth: 0,
      background: tokens.colors.neutral[50],
      border: `1px dashed ${tokens.colors.neutral[200]}`,
      borderRadius: tokens.radius.lg,
      padding: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <p style={{ fontSize: "11px", color: tokens.colors.neutral[400], textAlign: "center", margin: 0, lineHeight: 1.4 }}>
        Couldn&apos;t find options for this day.
      </p>
    </div>
  );
}

// ── Day section ───────────────────────────────────────────────────────────────

function DaySection({
  planId,
  dayIndex,
  weekStart,
  optionA,
  optionB,
  highlights,
  selectedOption,
}: {
  planId: string;
  dayIndex: number;
  weekStart: string;
  optionA: unknown;
  optionB: unknown;
  highlights: string[];
  selectedOption: "a" | "b" | "skip" | null;
}) {
  const date = new Date(weekStart + "T12:00:00");
  date.setDate(date.getDate() + dayIndex);
  const dateLabel = `${MONTHS[date.getMonth()]} ${date.getDate()}`;

  const recipeA = optionA as StoredRecipe | null;
  const recipeB = optionB as StoredRecipe | null;
  const isSkipped = selectedOption === "skip";

  function cardProps(recipe: StoredRecipe, option: "a" | "b") {
    const haveCount = recipe.ingredients.filter((i) => isAnyHighlighted(i, highlights)).length;
    return {
      recipe,
      haveCount,
      totalCount: recipe.ingredients.length,
      detailHref: `/plan/${planId}/recipe/${dayIndex}/${option}`,
      isSelected: selectedOption === option,
      planId,
      dayIndex,
      option,
      selectAction: selectRecipeAction,
    };
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Day header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p style={{
          fontSize: "12px",
          fontWeight: 700,
          color: tokens.colors.neutral[700],
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          {DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1]}
          <span style={{ fontWeight: 400, color: tokens.colors.neutral[400], textTransform: "none", letterSpacing: 0 }}>
            {dateLabel}
          </span>
          {isSkipped && (
            <span style={{
              fontSize: "10px",
              fontWeight: 600,
              color: tokens.colors.neutral[400],
              background: tokens.colors.neutral[100],
              border: `1px solid ${tokens.colors.neutral[200]}`,
              borderRadius: 9999,
              padding: "1px 7px",
              textTransform: "none",
              letterSpacing: 0,
            }}>
              Skipped
            </span>
          )}
        </p>
        <DayActions
          planId={planId}
          dayIndex={dayIndex}
          selectedOption={selectedOption}
          skipAction={skipDayAction}
          unskipAction={unskipDayAction}
        />
      </div>

      {/* Recipe cards (dimmed when skipped) */}
      <div style={{ display: "flex", gap: 8, opacity: isSkipped ? 0.45 : 1, transition: "opacity 0.15s ease" }}>
        {recipeA ? <SelectableRecipeCard key="a" {...cardProps(recipeA, "a")} /> : <EmptySlot />}
        {recipeB ? <SelectableRecipeCard key="b" {...cardProps(recipeB, "b")} /> : <EmptySlot />}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PlanViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rawPlan } = await getMealPlanWithDays(supabase, id);
  if (!rawPlan) notFound();
  const plan = rawPlan as unknown as { id: string; household_id: string; week_start: string; status: string; meal_plan_days: unknown[] };

  const planStatus = plan.status ?? "draft";
  const isDraft = planStatus === "draft";

  const days = (plan.meal_plan_days ?? []) as Array<{
    day_index: number;
    option_a: unknown;
    option_b: unknown;
    selected_option: "a" | "b" | "skip" | null;
  }>;

  const [staplesRes, onHandRes] = await Promise.all([
    getStapleItems(supabase, plan.household_id),
    getOnHandItemsForPlan(supabase, id),
  ]);

  const highlights = [
    ...(staplesRes.data ?? []).map((s) => s.name),
    ...(onHandRes.data ?? []).map((i) => i.name),
  ];

  const sortedDays = [...days].sort((a, b) => a.day_index - b.day_index);
  const firstDayIndex = sortedDays[0]?.day_index ?? 0;
  const lastDayIndex = sortedDays[sortedDays.length - 1]?.day_index ?? 6;
  const dateRange = formatDateRange(plan.week_start, firstDayIndex, lastDayIndex);

  // Week boundary notice: plan ends before Sunday
  const endsBeforeSunday = lastDayIndex < 6;
  const boundaryDayName = DAY_NAMES[lastDayIndex] ?? "Sunday";

  // Count days that are resolved (recipe selected OR skipped)
  const selectedCount = days.filter(
    (d) => d.selected_option === "a" || d.selected_option === "b" || d.selected_option === "skip"
  ).length;
  const totalDays = sortedDays.length;

  return (
    <div style={{ background: tokens.colors.neutral[50], minHeight: "calc(100vh - 72px)" }}>
      {isDraft && <DraftPlanGuard />}

      {/* Header */}
      <div style={{
        padding: "32px 20px 20px",
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
        background: tokens.colors.neutral[0],
        marginBottom: 20,
      }}>
        <p style={{ fontSize: "12px", color: tokens.colors.neutral[500], marginBottom: 4 }}>
          {dateRange}
        </p>
        <h1 style={{
          fontSize: "22px",
          fontWeight: 700,
          color: tokens.colors.neutral[900],
          letterSpacing: tokens.typography.letterSpacing.heading,
          margin: 0,
        }}>
          This Week&apos;s Plan
        </h1>
      </div>

      {/* Week boundary notice */}
      {endsBeforeSunday && (
        <div style={{
          margin: "0 20px 16px",
          padding: "10px 14px",
          background: tokens.colors.secondary[50],
          border: `1px solid ${tokens.colors.secondary[200]}`,
          borderRadius: tokens.radius.md,
          fontSize: "13px",
          color: tokens.colors.secondary[700],
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          Planned {totalDays} {totalDays === 1 ? "day" : "days"} through {boundaryDayName} — week ends before Sunday.
        </div>
      )}

      {/* Day sections — extra bottom padding so the sticky PlanActions bar doesn't overlap the last day */}
      <div style={{ padding: "0 20px 180px" }}>
        {sortedDays.map((day) => (
          <DaySection
            key={day.day_index}
            planId={id}
            dayIndex={day.day_index}
            weekStart={plan.week_start}
            optionA={day.option_a}
            optionB={day.option_b}
            highlights={highlights}
            selectedOption={day.selected_option}
          />
        ))}
      </div>

      {/* Accept plan + Regenerate CTAs */}
      <PlanActions
        planId={id}
        selectedCount={selectedCount}
        totalDays={totalDays}
        confirmAction={confirmPlanAction}
      />

    </div>
  );
}
