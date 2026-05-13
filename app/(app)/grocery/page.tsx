export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getHouseholdForUser, getStapleItems, getOnHandItemsForPlan } from "@/lib/supabase/queries";
import { ingredientMatches, inferAisle } from "@/lib/ingredient-match";
import { tokens } from "@/lib/tokens";
import { GroceryList } from "@/components/ui/GroceryList";
import { GroceryRetryButton } from "@/components/ui/GroceryRetryButton";
import type { GroceryItem, PantryItem } from "@/components/ui/GroceryList";

const VALID_AISLES = ["produce","meat","dairy","bakery","canned","frozen","grains","snacks","misc"];

export default async function GroceryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const member = user ? await getHouseholdForUser(supabase, user.id) : null;
  const householdId = member?.household_id;

  let items: GroceryItem[] = [];
  let listId: string | null = null;
  let pantryItems: PantryItem[] = [];
  let confirmedPlanId: string | null = null;

  if (householdId) {
    const { data: plan } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("household_id", householdId)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (plan) {
      confirmedPlanId = plan.id;
      const { data: list } = await supabase
        .from("grocery_lists")
        .select("id")
        .eq("meal_plan_id", plan.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (list) {
        listId = list.id;
        const { data } = await supabase
          .from("grocery_items")
          .select("id, name, quantity, unit, aisle, is_checked, is_manual, source_recipe_title")
          .eq("grocery_list_id", list.id)
          .order("name", { ascending: true });

        items = (data ?? []) as GroceryItem[];
      }

      // Compute pantry items: staples/on-hand used in selected recipes
      const [staplesRes, onHandRes, planDaysRes] = await Promise.all([
        getStapleItems(supabase, householdId),
        getOnHandItemsForPlan(supabase, plan.id),
        supabase
          .from("meal_plan_days")
          .select("selected_option, option_a, option_b")
          .eq("meal_plan_id", plan.id)
          .in("selected_option", ["a", "b"]),
      ]);

      const selectedRecipes = (planDaysRes.data ?? [])
        .map(d => (d.selected_option === "a" ? d.option_a : d.option_b) as { title?: string; ingredients?: string[] } | null)
        .filter(Boolean) as { title: string; ingredients: string[] }[];

      const knownItems = [
        ...(staplesRes.data ?? []).map(s => {
          const cat = (s.category ?? "").toLowerCase();
          const aisle = VALID_AISLES.includes(cat) ? cat : inferAisle(s.name);
          return { name: s.name, aisle };
        }),
        ...(onHandRes.data ?? []).map(i => ({ name: i.name, aisle: inferAisle(i.name) })),
      ];

      const existingNames = new Set(items.map(i => i.name.toLowerCase()));
      const seenPantry = new Set<string>();

      for (const known of knownItems) {
        const key = known.name.toLowerCase();
        if (seenPantry.has(key) || existingNames.has(key)) continue;
        const usedIn: string[] = [];
        const ingredientStrings: string[] = [];
        for (const r of selectedRecipes) {
          const matchedIng = r.ingredients?.find(ing => ingredientMatches(ing, known.name));
          if (matchedIng) {
            usedIn.push(r.title);
            if (!ingredientStrings.includes(matchedIng)) ingredientStrings.push(matchedIng);
          }
        }
        if (usedIn.length === 0) continue;
        seenPantry.add(key);
        pantryItems.push({ name: known.name, aisle: known.aisle, sourceRecipes: usedIn, ingredientStrings });
      }
    }
  }

  const hasItems = items.length > 0;

  return (
    <div style={{
      background: tokens.colors.neutral[50],
      minHeight: "calc(100vh - 72px)",
      paddingBottom: 96,
    }}>
      {!hasItems ? (
        <>
          {/* Static header for empty state */}
          <div style={{
            padding: "32px 20px 16px",
            borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
            background: tokens.colors.neutral[0],
          }}>
            <p style={{ fontSize: "13px", color: tokens.colors.neutral[500], marginBottom: 4 }}>
              This week
            </p>
            <h1 style={{
              fontSize: "22px",
              fontWeight: 700,
              color: tokens.colors.neutral[900],
              letterSpacing: tokens.typography.letterSpacing.heading,
              margin: 0,
            }}>
              Grocery List
            </h1>
          </div>

          {/* Empty state */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "64px 32px",
            gap: 16,
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: tokens.colors.neutral[100],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke={tokens.colors.neutral[400]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6L18 2H6Z" />
                <path d="M3 6H21" />
                <path d="M16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: "16px", fontWeight: 600, color: tokens.colors.neutral[900], margin: "0 0 6px" }}>
                {confirmedPlanId ? "Couldn't build your grocery list" : "No grocery list yet"}
              </p>
              <p style={{ fontSize: "14px", color: tokens.colors.neutral[500], maxWidth: 280, margin: 0, lineHeight: 1.5 }}>
                {confirmedPlanId
                  ? "Something went wrong generating your shopping list. Tap below to try again."
                  : "Confirm your meal plan to automatically generate your shopping list."}
              </p>
            </div>
            {confirmedPlanId && (
              <GroceryRetryButton planId={confirmedPlanId} householdId={householdId!} />
            )}
          </div>
        </>
      ) : (
        <GroceryList initialItems={items} listId={listId!} pantryItems={pantryItems} />
      )}
    </div>
  );
}
