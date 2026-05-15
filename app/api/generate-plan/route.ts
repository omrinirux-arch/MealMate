import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { ingredientMatches } from "@/lib/ingredient-match";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 90_000,
  maxRetries: 2,
});

const MODEL_PRIMARY = "claude-haiku-4-5-20251001";
const MODEL_FALLBACK = "claude-sonnet-4-6";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ValidatedRecipe {
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

// ── Claude prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(numDays: number): string {
  const total = numDays * 2;
  return `You are an executive chef and meal planner with 20 years of restaurant experience. You think in flavor first: every recipe you write is designed to be genuinely delicious — not merely nutritious or convenient. You understand how to build depth through technique (searing, deglazing, caramelizing, reducing), how to balance fat, acid, salt, and heat, and how to finish dishes so they taste complete.

Generate exactly ${total} original dinner recipes for a ${numDays}-day meal plan (2 options per day). Return ONLY a valid JSON array of exactly ${total} recipe objects — no markdown fences, no explanation, no preamble.

Each recipe object must have exactly these fields:
{
  "title": string,
  "url": "",
  "image_url": null,
  "prep_time": string,
  "cook_time": string,
  "description": string,
  "ingredients": string[],
  "instructions": string[],
  "tags": string[],
  "servings": number
}

Culinary quality standards (apply to every recipe):
- Build flavor in layers: start aromatics in fat, bloom spices, deglaze with liquid to lift fond, finish with an acid or fresh herb
- Use proper technique language in instructions: "sear until deep golden-brown", "deglaze with wine and scrape up the browned bits", "reduce until slightly thickened", "season to taste and finish with a squeeze of lemon"
- Every recipe must have a clear flavor identity — smoky, bright and citrusy, rich and savory, spicy-sweet, umami-forward, etc.
- Use textural contrast where possible: crispy skin / creamy interior, tender protein / crunchy garnish
- Every recipe must include a finishing touch: citrus squeeze, fresh herbs, good oil drizzle, pat of butter, or toasted seeds

Field requirements:
- title: unique, descriptive dinner name (no two recipes may share a title)
- url: always the empty string ""
- image_url: always null
- prep_time: e.g. "10 min", "20 min"
- cook_time: e.g. "25 min", "1 hr"
- description: one sentence, max 200 characters — write it like a menu blurb that makes someone hungry: name the dominant flavor, the key technique, or the most appealing sensory detail (e.g. "Crispy-skinned salmon over lemony white beans with wilted spinach and a bright caper-herb dressing.")
- ingredients: at least 5 items, each a complete ingredient string like "2 tbsp olive oil" or "1 lb boneless chicken thighs"
- instructions: at least 5 steps as plain strings (no "Step 1:" prefix — the UI numbers them automatically); each step must describe technique, not just actions — include temps, visual cues, timing, and tasting guidance; the final step must include a finishing touch and plating note
- tags: 2–5 short descriptive tags (e.g. "quick", "one-pan", "high-protein")
- servings: integer matching the household serving size

Strict rules:
- All ${total} titles must be unique
- Vary primary proteins across the ${numDays} days — no single protein (chicken, beef, pork, fish, shrimp, tofu, turkey, lamb) may appear more than twice
- The two recipes for the same day must use different proteins AND different cuisines
- Honor ALL exclusions — excluded ingredients must not appear anywhere in any recipe
- Spice tolerance: none → no chili, pepper, hot sauce, jalapeño; mild → minimal heat only; medium → moderate spice ok; hot → full heat allowed
- Dietary goals:
  - heart-healthy → fish, lean poultry, legumes; no fried dishes or heavy cream sauces
  - build-muscle → protein-dense recipes (aim for ≥30g estimated protein per serving)
  - lose-weight → lighter meals (aim for ≤600 cal per serving), no heavy pasta or casseroles
  - lower-cholesterol → avoid red meat and full-fat dairy
  - low-sodium → avoid cured meats, soy sauce, pickled ingredients
- Recipe style:
  - quick → total time (prep + cook) ≤ 30 min
  - one-pan → entire recipe made in one pan, skillet, or sheet pan
  - meal-prep → batch-friendly (stews, casseroles, grain bowls)
  - involved → multi-component dishes with longer cook times
  - kid-friendly → mild, familiar flavors (pasta, tacos, chicken)
- Prioritize using on_hand_items in recipe ingredients where culinarily sensible
- Use staple_items as supporting ingredients wherever appropriate
- Only include recipes using available kitchen_tools (assume stovetop and oven always available)
- Do NOT use any title from recent_recipes
- thumbs_down_recipes: recipes the household disliked — NEVER suggest these titles again, and avoid recipes with a similar flavor profile, cuisine, or primary ingredient
- thumbs_up_recipes: recipes the household loved — favor similar flavor profiles, cuisines, and cooking styles when generating new recipes
- Output must be valid JSON — first character "[", last character "]", nothing else`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildUserMessage(ctx: {
  dietary_goals: string[];
  recipe_style: string[];
  spice_tolerance: string;
  exclusions: string[];
  servings: number;
  staple_items: string[];
  on_hand_items: string[];
  kitchen_tools: string[];
  recent_recipe_titles: string[];
  thumbs_down_titles: string[];
  thumbs_up_titles: string[];
}, numDays: number): string {
  const list = (arr: string[], fallback = "none") =>
    arr.length > 0 ? arr.join(", ") : fallback;

  return [
    "HOUSEHOLD CONTEXT",
    `dietary_goals: ${list(ctx.dietary_goals)}`,
    `recipe_style: ${list(ctx.recipe_style)}`,
    `spice_tolerance: ${ctx.spice_tolerance}`,
    `exclusions (must not appear in any recipe): ${list(ctx.exclusions)}`,
    `servings per recipe: ${ctx.servings}`,
    `staple_items (always available): ${list(ctx.staple_items)}`,
    `on_hand_items (prioritize using these): ${list(ctx.on_hand_items)}`,
    `kitchen_tools available: ${list(ctx.kitchen_tools, "standard kitchen tools")}`,
    `recent_recipes (do not repeat these titles): ${list(ctx.recent_recipe_titles)}`,
    `thumbs_down_recipes (never suggest again, avoid similar): ${list(ctx.thumbs_down_titles)}`,
    `thumbs_up_recipes (loved these, favor similar style/cuisine): ${list(ctx.thumbs_up_titles)}`,
    "",
    `Generate exactly ${numDays * 2} dinner recipes as a JSON array.`,
  ].join("\n");
}

function parseRecipesFromText(text: string): unknown[] {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON array found in Claude response");
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as unknown[];
}

function isValidRecipe(r: unknown): r is Record<string, unknown> {
  if (typeof r !== "object" || r === null) return false;
  const obj = r as Record<string, unknown>;
  return (
    typeof obj.title === "string" && obj.title.trim().length > 0 &&
    Array.isArray(obj.ingredients) && (obj.ingredients as unknown[]).length > 0 &&
    Array.isArray(obj.instructions) && (obj.instructions as unknown[]).length > 0
  );
}

function normalizeRecipe(r: Record<string, unknown>, servings: number): ValidatedRecipe {
  return {
    title: String(r.title).trim(),
    url: "",         // always empty — Claude-generated recipes have no source URL
    image_url: null, // always null — no image for generated recipes
    prep_time: typeof r.prep_time === "string" ? r.prep_time : "",
    cook_time: typeof r.cook_time === "string" ? r.cook_time : "",
    description: typeof r.description === "string" ? r.description.slice(0, 200) : "",
    ingredients: (Array.isArray(r.ingredients) ? r.ingredients as unknown[] : [])
      .filter((i): i is string => typeof i === "string" && i.trim().length > 0),
    instructions: (Array.isArray(r.instructions) ? r.instructions as unknown[] : [])
      .filter((i): i is string => typeof i === "string" && i.trim().length > 0),
    tags: (Array.isArray(r.tags) ? r.tags as unknown[] : [])
      .filter((t): t is string => typeof t === "string")
      .slice(0, 5),
    servings: typeof r.servings === "number" && r.servings > 0 ? r.servings : servings,
  };
}

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function callModel(model: string, systemPrompt: string, userMessage: string): Promise<ValidatedRecipe[]> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text in Claude response");

  const raw = parseRecipesFromText(textBlock.text);
  return raw.filter(isValidRecipe).map((r) => normalizeRecipe(r, 4));
}

async function callClaude(systemPrompt: string, userMessage: string): Promise<ValidatedRecipe[]> {
  try {
    return await callModel(MODEL_PRIMARY, systemPrompt, userMessage);
  } catch (err) {
    if ((err as { status?: number }).status === 529) {
      console.warn("[generate-plan] Sonnet overloaded, falling back to Haiku");
      return await callModel(MODEL_FALLBACK, systemPrompt, userMessage);
    }
    throw err;
  }
}

// ── Streaming POST handler ────────────────────────────────────────────────────
// Emits NDJSON events:
//   { type: "progress", step: "searching" | "matching" | "topup" }
//   { type: "done", recipes: ValidatedRecipe[], count: number }
//   { type: "error", message: string }

export async function POST(req: NextRequest): Promise<Response> {
  let body: { household_id?: string; days?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ type: "error", message: "Invalid JSON body" }) + "\n",
      { status: 400 }
    );
  }

  const { household_id } = body;
  const numDays = Math.max(1, Math.min(7, Math.round(body.days ?? 7)));

  if (!household_id || typeof household_id !== "string") {
    return new Response(
      JSON.stringify({ type: "error", message: "household_id is required" }) + "\n",
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ type: "error", message: "ANTHROPIC_API_KEY not configured" }) + "\n",
      { status: 500 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: object) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      }

      let heartbeat: ReturnType<typeof setInterval> | undefined;

      try {
        // ── Fetch household context ──────────────────────────────────────────
        const supabase = await createClient();
        const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        const [staplesRes, onHandRes, toolsRes, prefsRes, ratingsRes, recentRes] =
          await Promise.all([
            supabase.from("staple_items").select("name").eq("household_id", household_id),
            supabase
              .from("on_hand_items")
              .select("name")
              .eq("household_id", household_id)
              .is("meal_plan_id", null),
            supabase.from("kitchen_tools").select("name").eq("household_id", household_id),
            supabase
              .from("household_preferences")
              .select("*")
              .eq("household_id", household_id)
              .single(),
            supabase
              .from("recipe_ratings")
              .select("recipe_title, rating")
              .eq("household_id", household_id),
            supabase
              .from("meal_plan_days")
              .select("option_a, option_b, meal_plans!inner(week_start)")
              .gte("meal_plans.week_start", threeWeeksAgo)
              .not("selected_option", "is", null),
          ]);

        const prefs = prefsRes.data;
        const servings = prefs?.servings ?? 4;

        const recentTitles: string[] = [];
        for (const day of (recentRes.data ?? []) as Array<{ option_a: unknown; option_b: unknown }>) {
          const a = day.option_a as { title?: string } | null;
          const b = day.option_b as { title?: string } | null;
          if (a?.title) recentTitles.push(a.title);
          if (b?.title) recentTitles.push(b.title);
        }

        const thumbsDownTitles = (ratingsRes.data ?? [])
          .filter((r) => r.rating === "down")
          .map((r) => r.recipe_title);
        const thumbsUpTitles = (ratingsRes.data ?? [])
          .filter((r) => r.rating === "up")
          .map((r) => r.recipe_title);

        const ctx = {
          dietary_goals: prefs?.dietary_goals ?? [],
          recipe_style: prefs?.recipe_style ?? [],
          spice_tolerance: prefs?.spice_tolerance ?? "medium",
          exclusions: prefs?.exclusions ?? [],
          servings,
          staple_items: (staplesRes.data ?? []).map((s) => s.name),
          on_hand_items: (onHandRes.data ?? []).map((i) => i.name),
          kitchen_tools: (toolsRes.data ?? []).map((t) => t.name),
          recent_recipe_titles: recentTitles,
          thumbs_down_titles: thumbsDownTitles,
          thumbs_up_titles: thumbsUpTitles,
        };

        // ── Step 1: Claude generates all recipes ────────────────────────────
        const systemPrompt = buildSystemPrompt(numDays);
        const targetCount = numDays * 2;
        send({ type: "progress", step: "searching" });

        // Heartbeat keeps the stream alive while Claude generates (prevents proxy/Vercel idle timeout)
        heartbeat = setInterval(() => {
          try { send({ type: "heartbeat" }); } catch { /* stream already closed */ }
        }, 8000);

        let recipes = await callClaude(systemPrompt, buildUserMessage(ctx, numDays)).catch((err) => {
          console.error("[generate-plan] Claude call #1 failed:", err);
          return [] as ValidatedRecipe[];
        });

        // Normalise servings on each recipe now that we have the real value
        recipes = recipes.map((r) => ({ ...r, servings }));

        // Deduplicate by normalized title
        const seenTitles = new Set<string>();
        const deduped: ValidatedRecipe[] = [];
        for (const r of recipes) {
          const key = normalizeTitle(r.title);
          if (seenTitles.has(key)) continue;
          seenTitles.add(key);
          deduped.push(r);
        }
        recipes = deduped;

        send({ type: "progress", step: "matching" });

        // ── Step 2: Top-up if short ──────────────────────────────────────────
        if (recipes.length < targetCount) {
          const needed = targetCount - recipes.length;
          console.warn(`[generate-plan] Got ${recipes.length} valid recipes, requesting ${needed} more`);
          send({ type: "progress", step: "topup" });

          const topUpMessage = [
            buildUserMessage(ctx, numDays),
            "",
            `You already generated these titles — DO NOT repeat them: ${recipes.map((r) => r.title).join(", ")}`,
            `I need exactly ${needed} more unique dinner recipes. Return ONLY a JSON array of ${needed} recipe objects.`,
          ].join("\n");

          const extras = await callClaude(systemPrompt, topUpMessage).catch((err) => {
            console.error("[generate-plan] Claude call #2 failed:", err);
            return [] as ValidatedRecipe[];
          });

          for (const r of extras) {
            if (recipes.length >= targetCount) break;
            const key = normalizeTitle(r.title);
            if (seenTitles.has(key)) continue;
            seenTitles.add(key);
            recipes.push({ ...r, servings });
          }
        }

        clearInterval(heartbeat);

        // ── Step 3: Error out if both calls returned nothing ─────────────────
        if (recipes.length === 0) {
          send({ type: "error", message: "Couldn't generate recipes right now — Claude may be briefly overloaded. Please try again in a moment." });
          controller.close();
          return;
        }

        // ── Step 4: Sort by ingredient match score ───────────────────────────
        const knownIngredients = [
          ...(staplesRes.data ?? []).map((s) => s.name.toLowerCase()),
          ...(onHandRes.data ?? []).map((i) => i.name.toLowerCase()),
        ];
        if (knownIngredients.length > 0) {
          const score = (r: ValidatedRecipe) =>
            r.ingredients.filter((ingr) =>
              knownIngredients.some((k) => ingredientMatches(ingr, k))
            ).length;
          recipes.sort((a, b) => score(b) - score(a));
        }

        send({ type: "done", recipes, count: recipes.length });
        controller.close();
      } catch (err) {
        clearInterval(heartbeat);
        console.error("[generate-plan] Unexpected error:", err);
        send({ type: "error", message: (err as Error).message ?? "Unexpected error" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
