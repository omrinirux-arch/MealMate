import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

type Client = SupabaseClient<Database>;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 60_000,
  maxRetries: 0,
});

const MODEL = "claude-sonnet-4-6";

const VALID_AISLES = [
  "produce", "meat", "dairy", "bakery",
  "canned", "frozen", "grains", "snacks", "misc",
] as const;
type Aisle = typeof VALID_AISLES[number];

interface GroceryItemRaw {
  name: string;
  quantity: string;
  unit: string;
  aisle: Aisle;
  source_recipe_title: string;
}

function isValidItem(r: unknown): r is Record<string, unknown> {
  if (typeof r !== "object" || r === null) return false;
  const o = r as Record<string, unknown>;
  return typeof o.name === "string" && o.name.trim().length > 0;
}

function normalizeItem(r: Record<string, unknown>): GroceryItemRaw {
  const rawAisle = typeof r.aisle === "string" ? r.aisle : "";
  const aisle: Aisle = (VALID_AISLES as readonly string[]).includes(rawAisle)
    ? (rawAisle as Aisle)
    : "misc";

  return {
    name: String(r.name).trim(),
    quantity: typeof r.quantity === "number"
      ? String(r.quantity)
      : typeof r.quantity === "string" ? r.quantity : "",
    unit: typeof r.unit === "string" ? r.unit : "",
    aisle,
    source_recipe_title: typeof r.source_recipe_title === "string"
      ? r.source_recipe_title
      : "",
  };
}

const SYSTEM_PROMPT = `You are a grocery list assistant. Given recipe ingredients, produce a clean deduplicated shopping list.

Instructions:
1. EXCLUDE any ingredient that fuzzy-matches a staple item or on-hand item (e.g. "boneless chicken breasts" matches "chicken")
2. COMBINE duplicate ingredients across recipes (e.g., "2 cloves garlic" + "3 cloves garlic" → "5 cloves garlic")
3. Categorize each remaining item into exactly one aisle: produce, meat, dairy, bakery, canned, frozen, grains, snacks, misc
4. Return ONLY a valid JSON array — first char "[", last char "]", nothing else

Each object must have exactly these fields:
- "name": ingredient name only, no quantities (e.g. "Chicken Thighs" not "2 lbs chicken thighs")
- "quantity": amount as a string (e.g. "2", "1.5", "3") — empty string "" if unquantified
- "unit": unit of measure (e.g. "lbs", "cloves", "cups") — empty string "" if count-based or unclear
- "aisle": one of: produce, meat, dairy, bakery, canned, frozen, grains, snacks, misc
- "source_recipe_title": recipe name(s) that need this item, comma-separated if multiple`;

export async function generateGroceryList(
  supabase: Client,
  planId: string,
  householdId: string
): Promise<void> {
  try {
    // ── 1. Fetch selected (non-skipped) days ──────────────────────────────
    const { data: days } = await supabase
      .from("meal_plan_days")
      .select("option_a, option_b, selected_option")
      .eq("meal_plan_id", planId)
      .in("selected_option", ["a", "b"]);

    if (!days || days.length === 0) return;

    // ── 2. Extract ingredients per recipe ─────────────────────────────────
    const recipes: Array<{ title: string; ingredients: string[] }> = [];
    for (const day of days) {
      const recipe =
        day.selected_option === "a"
          ? (day.option_a as { title?: string; ingredients?: string[] } | null)
          : (day.option_b as { title?: string; ingredients?: string[] } | null);
      if (recipe?.title && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
        recipes.push({ title: recipe.title, ingredients: recipe.ingredients });
      }
    }
    if (recipes.length === 0) return;

    // ── 3. Fetch staples + on-hand ────────────────────────────────────────
    const [staplesRes, onHandRes] = await Promise.all([
      supabase.from("staple_items").select("name").eq("household_id", householdId),
      supabase.from("on_hand_items").select("name").eq("meal_plan_id", planId),
    ]);

    const staples = (staplesRes.data ?? []).map((s) => s.name);
    const onHand = (onHandRes.data ?? []).map((i) => i.name);

    // ── 4. Build prompt ───────────────────────────────────────────────────
    const ingredientBlock = recipes
      .map((r) => `${r.title}:\n${r.ingredients.map((i) => `  - ${i}`).join("\n")}`)
      .join("\n\n");

    const userMessage = [
      "RECIPE INGREDIENTS:",
      ingredientBlock,
      "",
      `STAPLE ITEMS (always on hand — exclude): ${staples.length > 0 ? staples.join(", ") : "none"}`,
      `ON-HAND ITEMS (available this week — exclude): ${onHand.length > 0 ? onHand.join(", ") : "none"}`,
      "",
      "Generate the shopping list JSON array.",
    ].join("\n");

    // ── 5. Call Claude ────────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return;

    // ── 6. Parse + validate ───────────────────────────────────────────────
    const cleaned = textBlock.text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start === -1 || end === -1 || end <= start) return;

    const raw = JSON.parse(cleaned.slice(start, end + 1)) as unknown[];
    const items = raw
      .filter(isValidItem)
      .map((r) => normalizeItem(r as Record<string, unknown>));

    if (items.length === 0) return;

    // ── 7. Create grocery_lists record ────────────────────────────────────
    const { data: list, error: listErr } = await supabase
      .from("grocery_lists")
      .insert({ household_id: householdId, meal_plan_id: planId })
      .select("id")
      .single();

    if (listErr || !list) {
      console.error("[generateGroceryList] Failed to create grocery_lists:", listErr);
      return;
    }

    // ── 8. Insert grocery_items ───────────────────────────────────────────
    const rows = items.map((item) => ({
      grocery_list_id: list.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      aisle: item.aisle,
      is_checked: false,
      is_manual: false,
      source_recipe_title: item.source_recipe_title || null,
    }));

    const { error: itemsErr } = await supabase.from("grocery_items").insert(rows);
    if (itemsErr) {
      console.error("[generateGroceryList] Failed to insert grocery_items:", itemsErr);
    }
  } catch (err) {
    // Don't rethrow — generation failure must not block plan confirmation
    console.error("[generateGroceryList] Unexpected error:", err);
  }
}
