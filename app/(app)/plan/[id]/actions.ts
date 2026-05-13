"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateSelectedOption } from "@/lib/supabase/queries";
import { generateGroceryList } from "@/lib/generate-grocery-list";

export async function selectRecipeAction(formData: FormData) {
  const planId = formData.get("planId") as string;
  const dayIndex = parseInt(formData.get("dayIndex") as string, 10);
  const option = formData.get("option") as "a" | "b";

  const supabase = await createClient();
  await updateSelectedOption(supabase, planId, dayIndex, option);

  redirect(`/plan/${planId}`);
}

export async function skipDayAction(formData: FormData) {
  const planId = formData.get("planId") as string;
  const dayIndex = parseInt(formData.get("dayIndex") as string, 10);
  const supabase = await createClient();
  await updateSelectedOption(supabase, planId, dayIndex, "skip");
  redirect(`/plan/${planId}`);
}

export async function unskipDayAction(formData: FormData) {
  const planId = formData.get("planId") as string;
  const dayIndex = parseInt(formData.get("dayIndex") as string, 10);
  const supabase = await createClient();
  await updateSelectedOption(supabase, planId, dayIndex, null);
  redirect(`/plan/${planId}`);
}

export async function rateRecipeAction(formData: FormData) {
  const planId = formData.get("planId") as string;
  const recipeTitle = formData.get("recipeTitle") as string;
  const recipeUrl = formData.get("recipeUrl") as string;
  const rating = formData.get("rating") as "up" | "down";

  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("household_id")
    .eq("id", planId)
    .single();

  if (!plan?.household_id) return;

  // Check if a rating already exists for this recipe in this plan
  const { data: existing } = await supabase
    .from("recipe_ratings")
    .select("id, rating")
    .eq("household_id", plan.household_id)
    .eq("meal_plan_id", planId)
    .eq("recipe_title", recipeTitle)
    .single();

  if (existing) {
    // Toggle off if same rating clicked again
    const newRating = existing.rating === rating ? null : rating;
    await supabase
      .from("recipe_ratings")
      .update({ rating: newRating })
      .eq("id", existing.id);
  } else {
    await supabase.from("recipe_ratings").insert({
      household_id: plan.household_id,
      meal_plan_id: planId,
      recipe_url: recipeUrl ?? "",
      recipe_title: recipeTitle,
      rating,
      cooked_at: new Date().toISOString(),
    });
  }
}

export async function confirmPlanAction(formData: FormData) {
  const planId = formData.get("planId") as string;

  const supabase = await createClient();

  // Get household_id before confirming
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("household_id")
    .eq("id", planId)
    .single();

  // Confirm the plan
  await supabase
    .from("meal_plans")
    .update({ status: "confirmed" })
    .eq("id", planId);

  // Generate grocery list (errors are caught internally — won't block redirect)
  if (plan?.household_id) {
    await generateGroceryList(supabase, planId, plan.household_id);
  }

  redirect("/grocery");
}
