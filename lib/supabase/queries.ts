import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

type Client = SupabaseClient<Database>;

export async function getHouseholdForUser(client: Client, userId: string) {
  const { data, error } = await client
    .from("household_members")
    .select("household_id, role, households(id, name, invite_code)")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}

export async function getHouseholdByInviteCode(
  client: Client,
  inviteCode: string
) {
  const { data, error } = await client
    .from("households")
    .select("id, name, invite_code")
    .eq("invite_code", inviteCode)
    .single();

  if (error) return null;
  return data;
}

export async function createHousehold(
  client: Client,
  name: string,
  userId: string
) {
  const id = crypto.randomUUID();
  const inviteCode = generateInviteCode();

  // Don't use .select() after insert — the SELECT policy requires membership,
  // which doesn't exist yet, so it would return no rows and fail.
  const { error: householdError } = await client
    .from("households")
    .insert({ id, name, invite_code: inviteCode });

  if (householdError) return { household: null, error: householdError };

  const { error: memberError } = await client
    .from("household_members")
    .insert({ household_id: id, user_id: userId, role: "admin" });

  if (memberError) return { household: null, error: memberError };

  return { household: { id, name, invite_code: inviteCode, created_at: new Date().toISOString() }, error: null };
}

export async function joinHousehold(
  client: Client,
  householdId: string,
  userId: string
) {
  const { error } = await client
    .from("household_members")
    .insert({ household_id: householdId, user_id: userId, role: "member" });

  return { error };
}

export async function deleteStapleItems(client: Client, householdId: string) {
  const { error } = await client
    .from("staple_items")
    .delete()
    .eq("household_id", householdId);
  return { error };
}

export async function insertStapleItems(
  client: Client,
  rows: Array<{ household_id: string; name: string; category: string }>
) {
  const { error } = await client.from("staple_items").insert(rows);
  return { error };
}

export async function deleteKitchenTools(client: Client, householdId: string) {
  const { error } = await client
    .from("kitchen_tools")
    .delete()
    .eq("household_id", householdId);
  return { error };
}

export async function insertKitchenTools(
  client: Client,
  rows: Array<{ household_id: string; name: string }>
) {
  const { error } = await client.from("kitchen_tools").insert(rows);
  return { error };
}

export async function upsertHouseholdPreferences(
  client: Client,
  data: {
    household_id: string;
    dietary_goals: string[];
    recipe_style: string[];
    spice_tolerance: "none" | "mild" | "medium" | "hot";
    exclusions: string[];
  }
) {
  const { error } = await client
    .from("household_preferences")
    .upsert(data, { onConflict: "household_id" });
  return { error };
}

export async function getStapleItems(client: Client, householdId: string) {
  const { data, error } = await client
    .from("staple_items")
    .select("*")
    .eq("household_id", householdId)
    .order("name");

  return { data, error };
}

export async function getKitchenTools(client: Client, householdId: string) {
  const { data, error } = await client
    .from("kitchen_tools")
    .select("*")
    .eq("household_id", householdId)
    .order("name");

  return { data, error };
}

export async function getHouseholdPreferences(
  client: Client,
  householdId: string
) {
  const { data, error } = await client
    .from("household_preferences")
    .select("*")
    .eq("household_id", householdId)
    .single();

  return { data, error };
}

export async function archiveMealPlan(client: Client, planId: string) {
  const { error } = await client
    .from("meal_plans")
    .update({ status: "archived" })
    .eq("id", planId);
  return { error };
}

export async function getCurrentMealPlan(client: Client, householdId: string) {
  const { data, error } = await client
    .from("meal_plans")
    .select("*, meal_plan_days(*)")
    .eq("household_id", householdId)
    .neq("status", "archived")
    .order("week_start", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return { data, error };
}

export async function createDraftMealPlan(client: Client, householdId: string) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  const weekStart = monday.toISOString().split("T")[0];

  const { data, error } = await client
    .from("meal_plans")
    .insert({ household_id: householdId, week_start: weekStart, status: "draft" })
    .select("id")
    .single();
  return { data, error };
}

export async function insertOnHandItems(
  client: Client,
  items: { household_id: string; meal_plan_id: string; name: string }[]
) {
  const { error } = await client.from("on_hand_items").insert(items);
  return { error };
}

export async function deleteSingleStapleItem(client: Client, itemId: string) {
  const { error } = await client.from("staple_items").delete().eq("id", itemId);
  return { error };
}

export async function insertSingleStapleItem(
  client: Client,
  row: { household_id: string; name: string; category: string }
) {
  const { data, error } = await client
    .from("staple_items")
    .insert(row)
    .select("id")
    .single();
  return { data, error };
}

export async function deleteSingleKitchenTool(client: Client, toolId: string) {
  const { error } = await client.from("kitchen_tools").delete().eq("id", toolId);
  return { error };
}

export async function insertSingleKitchenTool(
  client: Client,
  row: { household_id: string; name: string }
) {
  const { data, error } = await client
    .from("kitchen_tools")
    .insert(row)
    .select("id")
    .single();
  return { data, error };
}

export async function updateServings(
  client: Client,
  householdId: string,
  servings: number
) {
  const { error } = await client
    .from("household_preferences")
    .update({ servings })
    .eq("household_id", householdId);
  return { error };
}

export async function getMealPlanById(client: Client, planId: string) {
  const { data, error } = await client
    .from("meal_plans")
    .select("id, household_id, week_start, status")
    .eq("id", planId)
    .single();
  return { data, error };
}

export async function insertMealPlanDays(
  client: Client,
  rows: Array<{ meal_plan_id: string; day_index: number; option_a: unknown; option_b: unknown }>
) {
  const { error } = await client.from("meal_plan_days").insert(
    rows.map((r) => ({
      meal_plan_id: r.meal_plan_id,
      day_index: r.day_index,
      option_a: r.option_a as never,
      option_b: r.option_b as never,
      selected_option: null,
    }))
  );
  return { error };
}

export async function getMealPlanWithDays(client: Client, planId: string) {
  const { data, error } = await client
    .from("meal_plans")
    .select("*, meal_plan_days(*)")
    .eq("id", planId)
    .single();
  return { data, error };
}

export async function getOnHandItemsForPlan(client: Client, mealPlanId: string) {
  const { data, error } = await client
    .from("on_hand_items")
    .select("name")
    .eq("meal_plan_id", mealPlanId);
  return { data, error };
}

export async function linkUnlinkedOnHandItems(
  client: Client,
  householdId: string,
  mealPlanId: string
) {
  const { error } = await client
    .from("on_hand_items")
    .update({ meal_plan_id: mealPlanId })
    .eq("household_id", householdId)
    .is("meal_plan_id", null);
  return { error };
}

export async function updateSelectedOption(
  client: Client,
  planId: string,
  dayIndex: number,
  selection: "a" | "b" | "skip" | null
) {
  const { error } = await client
    .from("meal_plan_days")
    .update({ selected_option: selection })
    .eq("meal_plan_id", planId)
    .eq("day_index", dayIndex);
  return { error };
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}
