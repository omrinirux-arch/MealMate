export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import {
  getHouseholdForUser,
  getCurrentMealPlan,
  getStapleItems,
  getOnHandItemsForPlan,
  getKitchenTools,
  getHouseholdPreferences,
} from "@/lib/supabase/queries";
import { tokens } from "@/lib/tokens";
import { GeneratePlanCTA } from "@/components/ui/GeneratePlanCTA";
import { RatingPrompt } from "@/components/ui/RatingPrompt";
import { HomePlanStrip } from "@/components/ui/HomePlanStrip";
import type { UnratedRecipe } from "@/components/ui/RatingPrompt";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const member = user ? await getHouseholdForUser(supabase, user.id) : null;
  const householdId = member?.household_id;
  const { data: plan } = householdId
    ? await getCurrentMealPlan(supabase, householdId)
    : { data: null };

  const planId = (plan as unknown as { id?: string } | null)?.id ?? null;
  const [staplesRes, onHandRes, toolsRes, prefsRes] = householdId
    ? await Promise.all([
        getStapleItems(supabase, householdId),
        planId ? getOnHandItemsForPlan(supabase, planId) : Promise.resolve({ data: [] as { name: string }[], error: null }),
        getKitchenTools(supabase, householdId),
        getHouseholdPreferences(supabase, householdId),
      ])
    : [
        { data: [] as { name: string }[] },
        { data: [] as { name: string }[] },
        { data: [] as { id: string; name: string }[] },
        { data: null },
      ];

  const highlights = [
    ...(staplesRes.data ?? []).map((s) => s.name),
    ...(onHandRes.data ?? []).map((i) => i.name),
  ];

  const staplesCount = (staplesRes.data ?? []).length;
  const toolsCount = (toolsRes.data ?? []).length;
  const prefs = prefsRes.data as { dietary_goals?: string[]; spice_tolerance?: string } | null;
  const prefsSet = !!(prefs && (prefs.spice_tolerance || (prefs.dietary_goals?.length ?? 0) > 0));

  type PlanDay = {
    day_index: number;
    selected_option: "a" | "b" | "skip" | null;
    option_a: { title?: string; prep_time?: string; cook_time?: string; description?: string; ingredients?: string[] } | null;
    option_b: { title?: string; prep_time?: string; cook_time?: string; description?: string; ingredients?: string[] } | null;
  };
  const typedPlan = plan as unknown as {
    id: string;
    household_id: string;
    week_start: string;
    status: string;
    meal_plan_days?: PlanDay[];
  } | null;
  const days = typedPlan?.meal_plan_days ?? [];
  const hasActivePlan = plan && days.length > 0;
  const isConfirmed = typedPlan?.status === "confirmed";

  // Detect "all meals done": every planned day has passed
  let allMealsDone = false;
  if (typedPlan && hasActivePlan) {
    const weekStart = new Date(typedPlan.week_start + "T00:00:00");
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    allMealsDone = isConfirmed && days.every((d) => d.day_index < daysPassed);
  }

  // Find unrated past recipes for confirmed plan
  let unratedRecipes: UnratedRecipe[] = [];
  if (typedPlan && isConfirmed && !allMealsDone) {
    const weekStart = new Date(typedPlan.week_start + "T00:00:00");
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));

    const pastSelectedDays = days.filter(
      (d) => (d.selected_option === "a" || d.selected_option === "b") && d.day_index < daysPassed
    );

    if (pastSelectedDays.length > 0) {
      const { data: ratings } = await supabase
        .from("recipe_ratings")
        .select("recipe_title")
        .eq("meal_plan_id", planId!)
        .eq("household_id", householdId!);

      const ratedTitles = new Set((ratings ?? []).map((r) => r.recipe_title));

      unratedRecipes = pastSelectedDays
        .sort((a, b) => a.day_index - b.day_index)
        .map((d) => {
          const recipe = d.selected_option === "a" ? d.option_a : d.option_b;
          return { title: recipe?.title ?? "", dayName: DAY_NAMES[d.day_index] ?? "that day" };
        })
        .filter((r) => r.title && !ratedTitles.has(r.title));
    }
  }

  return (
    <div style={{ padding: "32px 20px 24px", background: tokens.colors.neutral[50], minHeight: "calc(100vh - 72px)" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: "13px", color: tokens.colors.neutral[500], marginBottom: 4 }}>
          This week&apos;s plan
        </p>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 700,
            letterSpacing: tokens.typography.letterSpacing.heading,
            color: tokens.colors.neutral[900],
            margin: 0,
          }}
        >
          {hasActivePlan ? "Your meal plan" : "No plan yet"}
        </h1>
      </div>

      {/* Rating prompt */}
      {unratedRecipes.length > 0 && (
        <RatingPrompt
          recipes={unratedRecipes}
          householdId={householdId!}
          mealPlanId={typedPlan!.id}
        />
      )}

      {/* Empty state — no plan */}
      {!hasActivePlan && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", paddingTop: 48, paddingBottom: 48, gap: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: tokens.colors.neutral[100],
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={tokens.colors.neutral[400]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2V6M8 2V6M3 10H21" />
              <path d="M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p style={{ fontSize: "18px", fontWeight: 700, color: tokens.colors.neutral[900], margin: 0 }}>
              Ready to plan your week?
            </p>
            <p style={{ fontSize: "14px", color: tokens.colors.neutral[500], maxWidth: 280, margin: 0, lineHeight: 1.5 }}>
              Pick your dinners for the week and we&apos;ll build your grocery list automatically.
            </p>
          </div>
          {/* Profile summary chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            <ProfileChip label={`${staplesCount} staple${staplesCount !== 1 ? "s" : ""}`} />
            <ProfileChip label={`${toolsCount} tool${toolsCount !== 1 ? "s" : ""}`} />
            <ProfileChip label={prefsSet ? "Preferences set" : "Preferences not set"} dim={!prefsSet} />
          </div>
          <GeneratePlanCTA />
        </div>
      )}

      {/* All meals done state */}
      {hasActivePlan && allMealsDone && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", paddingTop: 32, paddingBottom: 32, gap: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: tokens.colors.primary[100],
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={tokens.colors.primary[600]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p style={{ fontSize: "18px", fontWeight: 700, color: tokens.colors.neutral[900], margin: 0 }}>
              This week&apos;s plan is complete!
            </p>
            <p style={{ fontSize: "14px", color: tokens.colors.neutral[500], maxWidth: 260, margin: 0, lineHeight: 1.5 }}>
              Great week. Ready to plan next week?
            </p>
          </div>
          <GeneratePlanCTA label="Generate Next Week" />
        </div>
      )}

      {/* Active plan strip */}
      {hasActivePlan && !allMealsDone && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <HomePlanStrip
            planId={planId!}
            weekStart={typedPlan!.week_start}
            days={days}
            highlights={highlights}
          />
          <a
            href={`/plan/new?fromPlanId=${planId!}`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "transparent",
              border: `1px solid ${tokens.colors.neutral[200]}`,
              borderRadius: tokens.radius.lg,
              padding: "13px",
              textDecoration: "none",
              color: tokens.colors.neutral[500],
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Start new plan
          </a>
        </div>
      )}
    </div>
  );
}

function ProfileChip({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <span style={{
      fontSize: "12px",
      fontWeight: 500,
      color: dim ? tokens.colors.neutral[400] : tokens.colors.neutral[600],
      background: dim ? tokens.colors.neutral[100] : tokens.colors.primary[50],
      border: `1px solid ${dim ? tokens.colors.neutral[200] : tokens.colors.primary[200]}`,
      borderRadius: tokens.radius.pill,
      padding: "3px 10px",
    }}>
      {label}
    </span>
  );
}
