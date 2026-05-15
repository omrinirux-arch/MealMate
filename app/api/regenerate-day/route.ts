import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 60_000,
  maxRetries: 0,
});

const MODEL = "claude-sonnet-4-6";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecipePair {
  option_a: RegenRecipe;
  option_b: RegenRecipe;
}

interface RegenRecipe {
  title: string;
  url: string;
  image_url: null;
  prep_time: string;
  cook_time: string;
  description: string;
  preferences_match: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  servings: number;
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an executive chef with 20 years of restaurant experience. Generate exactly 2 original, delicious dinner recipes for a single day (option A and option B). Return ONLY a valid JSON array of exactly 2 recipe objects — no markdown, no explanation, no preamble.

Each recipe object must have exactly these fields:
{
  "title": string,
  "url": "",
  "image_url": null,
  "prep_time": string,
  "cook_time": string,
  "description": string,
  "preferences_match": string,
  "ingredients": string[],
  "instructions": string[],
  "tags": string[],
  "servings": number
}

Culinary quality (apply to both recipes):
- Layer flavor: bloom aromatics in fat, deglaze to lift fond, finish with acid or fresh herbs
- Use technique language in steps: "sear until deep golden-brown", "deglaze and scrape up the browned bits", "reduce until slightly thickened", "season and finish with lemon"
- Each recipe must include at least one finishing touch: citrus squeeze, fresh herbs, good oil drizzle, or toasted seeds
- description: one sentence, max 200 characters, written like a menu blurb — name the dominant flavor or key technique (e.g. "Crispy-skinned salmon over lemony white beans with wilted spinach and a bright caper dressing.")
- preferences_match: 1–2 short sentences, max 220 characters, friendly and second-person — explain how THIS specific recipe fits the household's stated preferences. Reference actual dietary_goals, recipe_style, spice_tolerance, exclusions, or on_hand_items by name (e.g. "Hits your heart-healthy goal with omega-3-rich salmon and uses up the lemon you have on hand."). Never invent preferences the household didn't list.
- instructions: at least 5 plain strings (no "Step 1:" prefix — the UI numbers them); include temps, visual doneness cues, and a finishing/plating note in the last step

Rules:
- The 2 recipes must use DIFFERENT proteins AND different cuisines
- Honor all exclusions — excluded ingredients must not appear in any recipe
- Respect spice_tolerance, dietary_goals, and recipe_style constraints
- Prioritize using on_hand_items and staple_items in ingredient lists
- Do NOT use any title from existing_plan_titles
- url always "", image_url always null
- Output must be valid JSON — first character "[", last character "]", nothing else`;

function buildMessage(ctx: {
  dietary_goals: string[];
  recipe_style: string[];
  spice_tolerance: string;
  exclusions: string[];
  servings: number;
  staple_items: string[];
  on_hand_items: string[];
  existing_plan_titles: string[];
}): string {
  const list = (arr: string[], fallback = "none") =>
    arr.length > 0 ? arr.join(", ") : fallback;

  return [
    "HOUSEHOLD CONTEXT",
    `dietary_goals: ${list(ctx.dietary_goals)}`,
    `recipe_style: ${list(ctx.recipe_style)}`,
    `spice_tolerance: ${ctx.spice_tolerance}`,
    `exclusions: ${list(ctx.exclusions)}`,
    `servings per recipe: ${ctx.servings}`,
    `staple_items: ${list(ctx.staple_items)}`,
    `on_hand_items: ${list(ctx.on_hand_items)}`,
    `existing_plan_titles (do not repeat): ${list(ctx.existing_plan_titles)}`,
    "",
    "Generate exactly 2 dinner recipes for a single day as a JSON array.",
  ].join("\n");
}

function parseTwo(text: string): unknown[] {
  const cleaned = text.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON array found");
  return JSON.parse(cleaned.slice(start, end + 1)) as unknown[];
}

function isValid(r: unknown): r is Record<string, unknown> {
  if (typeof r !== "object" || r === null) return false;
  const o = r as Record<string, unknown>;
  return (
    typeof o.title === "string" && o.title.trim().length > 0 &&
    Array.isArray(o.ingredients) && (o.ingredients as unknown[]).length > 0 &&
    Array.isArray(o.instructions) && (o.instructions as unknown[]).length > 0
  );
}

function normalize(r: Record<string, unknown>, servings: number): RegenRecipe {
  return {
    title: String(r.title).trim(),
    url: "",
    image_url: null,
    prep_time: typeof r.prep_time === "string" ? r.prep_time : "",
    cook_time: typeof r.cook_time === "string" ? r.cook_time : "",
    description: typeof r.description === "string" ? r.description.slice(0, 200) : "",
    preferences_match: typeof r.preferences_match === "string" ? r.preferences_match.trim().slice(0, 220) : "",
    ingredients: (Array.isArray(r.ingredients) ? r.ingredients as unknown[] : [])
      .filter((i): i is string => typeof i === "string" && i.trim().length > 0),
    instructions: (Array.isArray(r.instructions) ? r.instructions as unknown[] : [])
      .filter((i): i is string => typeof i === "string" && i.trim().length > 0),
    tags: (Array.isArray(r.tags) ? r.tags as unknown[] : [])
      .filter((t): t is string => typeof t === "string").slice(0, 5),
    servings: typeof r.servings === "number" && r.servings > 0 ? r.servings : servings,
  };
}

const PLACEHOLDER: Omit<RegenRecipe, "servings"> = {
  title: "Simple Weeknight Dinner",
  url: "",
  image_url: null,
  prep_time: "15 min",
  cook_time: "25 min",
  description: "A flexible, easy weeknight dinner.",
  preferences_match: "",
  ingredients: ["protein of choice", "vegetables", "2 tbsp olive oil", "salt", "pepper"],
  instructions: [
    "Season protein with salt and pepper.",
    "Heat olive oil in a pan over medium-high heat.",
    "Cook protein until done, then add vegetables and cook until tender.",
    "Serve warm.",
  ],
  tags: ["simple", "flexible"],
};

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { plan_id?: string; day_index?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { plan_id, day_index } = body;
  if (!plan_id || typeof plan_id !== "string" || typeof day_index !== "number") {
    return NextResponse.json({ error: "plan_id and day_index are required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    const supabase = await createClient();

    // ── 1. Fetch plan + household_id ────────────────────────────────────────
    const { data: plan } = await supabase
      .from("meal_plans")
      .select("household_id")
      .eq("id", plan_id)
      .single();

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    const { household_id } = plan;

    // ── 2. Fetch household context + existing plan titles ───────────────────
    const [staplesRes, onHandRes, prefsRes, daysRes] = await Promise.all([
      supabase.from("staple_items").select("name").eq("household_id", household_id),
      supabase.from("on_hand_items").select("name").eq("household_id", household_id),
      supabase.from("household_preferences").select("*").eq("household_id", household_id).single(),
      supabase.from("meal_plan_days").select("option_a, option_b").eq("meal_plan_id", plan_id),
    ]);

    const prefs = prefsRes.data;
    const servings = prefs?.servings ?? 4;

    // Collect all existing recipe titles in this plan (to avoid repeats)
    const existingTitles: string[] = [];
    for (const day of daysRes.data ?? []) {
      const a = day.option_a as { title?: string } | null;
      const b = day.option_b as { title?: string } | null;
      if (a?.title) existingTitles.push(a.title);
      if (b?.title) existingTitles.push(b.title);
    }

    const ctx = {
      dietary_goals: prefs?.dietary_goals ?? [],
      recipe_style: prefs?.recipe_style ?? [],
      spice_tolerance: prefs?.spice_tolerance ?? "medium",
      exclusions: prefs?.exclusions ?? [],
      servings,
      staple_items: (staplesRes.data ?? []).map((s) => s.name),
      on_hand_items: (onHandRes.data ?? []).map((i) => i.name),
      existing_plan_titles: existingTitles,
    };

    // ── 3. Call Claude for 2 recipes ────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildMessage(ctx) }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No text in Claude response");

    const raw = parseTwo(textBlock.text);
    const valid = raw.filter(isValid).map((r) => normalize(r, servings));

    // Ensure we have at least 2 (pad with placeholders if needed)
    while (valid.length < 2) {
      valid.push({ ...PLACEHOLDER, title: `Simple Dinner ${valid.length + 1}`, servings });
    }

    const pair: RecipePair = { option_a: valid[0], option_b: valid[1] };

    // ── 4. Update meal_plan_days ────────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from("meal_plan_days")
      .update({
        option_a: pair.option_a as never,
        option_b: pair.option_b as never,
        selected_option: null,
      })
      .eq("meal_plan_id", plan_id)
      .eq("day_index", day_index);

    if (updateErr) {
      console.error("[regenerate-day] DB update failed:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, titles: [pair.option_a.title, pair.option_b.title] });
  } catch (err) {
    console.error("[regenerate-day] Unexpected error:", err);
    return NextResponse.json({ error: (err as Error).message ?? "Unexpected error" }, { status: 500 });
  }
}
