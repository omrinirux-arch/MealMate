# MealMate — Milestone 5 Prompts (Broken Into Sub-Steps)

Milestone 5 is the highest-risk milestone. These 4 prompts tackle it piece by piece so you can verify each part before building on it. Complete them in order within the same Claude Code session (or across sessions — either works since the code is committed between steps).

---

## 5A: On-Hand Items Input Screen

Read CLAUDE.md for design tokens and conventions.

Build the on-hand items input screen. This screen appears when the user taps "Generate This Week's Plan" from the home screen — it's an intermediate step before the plan actually generates.

**What to build:**

1. When the user taps the "Generate This Week's Plan" CTA on the home screen, navigate to a new route (e.g., `/plan/new`).

2. This screen shows:
   - Heading: "Anything on hand you want to use this week?"
   - Subtitle: "We'll prioritize recipes that use these up"
   - A text input where the user types an item name and presses enter to add it
   - Added items appear as removable chips below the input — tapping "×" removes them
   - Two buttons at the bottom:
     - "Skip" (ghost style) — proceeds with no on-hand items
     - "Generate Plan" (primary style) — proceeds with the entered items

3. Save on-hand items to the `on_hand_items` table in Supabase:
   - id (auto-generated uuid)
   - household_id (from current user's household)
   - name (the item text)
   - quantity (null for now)
   - meal_plan_id (null for now — will be linked when the plan is created)
   - created_at

4. Both "Skip" and "Generate Plan" should navigate to a placeholder page for now (e.g., `/plan/generating` with a simple "Generating your plan..." message). We'll build the real generation in the next step.

**Do NOT build:** The API call, recipe cards, or plan display. Just the input screen and the database write.

**Verify before moving on:**
- [ ] Tapping "Generate This Week's Plan" on home navigates to the on-hand items screen
- [ ] Items can be typed and added as chips
- [ ] Chips can be removed by tapping "×"
- [ ] "Generate Plan" saves items to `on_hand_items` table in Supabase and navigates to placeholder
- [ ] "Skip" navigates to placeholder without saving any items
- [ ] Screen works at 390px width

---

## 5B: API Route — Recipe Generation (Backend Only)

Read CLAUDE.md for design tokens and conventions.

Build the server-side API route that calls the Anthropic API to find recipes. This is backend only — no UI changes in this step.

**What to build:**

1. Create a Next.js API route at `/api/generate-plan` that accepts a POST request with `{ household_id: string }`.

2. The route should fetch all context from Supabase:
   - Staple items for this household (from `staple_items`)
   - On-hand items with null meal_plan_id for this household (from `on_hand_items`)
   - Kitchen tools (from `kitchen_tools`)
   - Household preferences: dietary_goals, recipe_style_preferences, spice_tolerance, excluded_ingredients, default_servings (from `households`)
   - Thumbs-down recipe URLs (from `recipe_ratings` where rating = 'down' and household_id matches)
   - Thumbs-up recipe URLs (from `recipe_ratings` where rating = 'up' and household_id matches)
   - Recently cooked recipes from last 3 weeks (from `meal_plan_days` joined with `meal_plans` where week_start is within last 21 days, selected_option is not null, and status is 'selected')

3. Call the Anthropic API using the Anthropic SDK (`@anthropic-ai/sdk`). Use model `claude-sonnet-4-20250514`. Enable the web search tool.

4. The system prompt should instruct Claude to:

```
You are a meal planning assistant. Search Allrecipes.com to find dinner recipes for a 7-day meal plan (Monday through Sunday). Return EXACTLY 14 recipes — 2 options per day.

SEARCH INSTRUCTIONS:
- Search Allrecipes.com for recipes matching the criteria below
- Each recipe MUST be a real recipe from Allrecipes.com with a valid URL
- URLs must be in the format: https://www.allrecipes.com/recipe/[number]/[recipe-name]/
- Do NOT invent or hallucinate recipe URLs

RETURN FORMAT:
Return ONLY a valid JSON array with exactly 14 objects. No markdown, no backticks, no explanation — just the JSON array. Each object must have:
{
  "title": "Recipe Name",
  "url": "https://www.allrecipes.com/recipe/.../",
  "image_url": "image URL if found, or null",
  "prep_time": "15 min",
  "cook_time": "30 min",
  "description": "1-2 sentence description",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "tags": ["quick-easy", "one-pot", "high-protein", "meal-prep", "kid-friendly", "heart-healthy", "low-sodium", "weekend-project"],
  "servings": 4
}

RECIPE SELECTION PRIORITIES (follow this order):
1. PRIORITIZE recipes using these ON-HAND ITEMS (use as many as possible): {on_hand_items}
2. MAXIMIZE overlap with these STAPLE ITEMS the household already has: {staple_items}
3. EXCLUDE recipes requiring tools NOT in this list: {kitchen_tools}. These tools are always available: stovetop, oven, microwave, basic pots and pans, knives, cutting board.
4. Match these DIETARY GOALS: {dietary_goals}
5. Match these RECIPE STYLE preferences: {recipe_style_preferences}
6. SPICE TOLERANCE is "{spice_tolerance}" — if "none" or "mild", exclude spicy recipes entirely
7. EXCLUDE these ingredients completely: {excluded_ingredients}
8. NEVER recommend these recipes (rated thumbs-down): {thumbs_down_urls}
9. AVOID these recently cooked recipes (cooked in last 3 weeks): {recent_recipes}
10. FAVOR recipes similar to these (rated thumbs-up): {thumbs_up_urls}
11. ROTATE PROTEINS — do not use the same primary protein more than twice across the 7 days
12. Default serving size: {default_servings}
```

5. Parse the response:
   - Extract the text content from Claude's response
   - Strip any markdown formatting or backticks if present
   - Parse as JSON
   - Validate each recipe has at minimum: title (non-empty string), url (starts with "https://www.allrecipes.com/"), ingredients (non-empty array)
   - If JSON parsing fails, log the raw response and retry ONCE with an additional instruction: "Your previous response was not valid JSON. Return ONLY a raw JSON array, no markdown, no backticks, no explanation."
   - If a recipe fails validation, drop it and log a warning

6. If fewer than 14 valid recipes are returned after validation, make a second API call requesting only the missing count with the instruction: "I need {count} more dinner recipes from Allrecipes.com following the same criteria. Do not repeat any of these recipes: {existing_titles}"

7. Return the validated recipes as JSON: `{ recipes: [...], count: number }`

8. Store the ANTHROPIC_API_KEY in `.env.local` — it should NEVER be accessible client-side. Add it to `.env.local.example` as a placeholder.

**Testing this route:**

After building the route, test it with curl or a simple fetch from the browser console:

```
fetch('/api/generate-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ household_id: 'your-household-id-here' })
}).then(r => r.json()).then(console.log)
```

(You can find your household_id in Supabase Table Editor → households table)

**Do NOT build:** Any UI changes, plan display, or database writes for meal_plans/meal_plan_days. Just the API route that returns recipe data.

**Verify before moving on:**
- [ ] API route exists at `/api/generate-plan`
- [ ] Route fetches all household context from Supabase correctly
- [ ] Anthropic API call uses claude-sonnet-4-20250514 with web search enabled
- [ ] Response is parsed as JSON with validation
- [ ] Each recipe has a valid title, Allrecipes URL, and ingredients array
- [ ] Invalid recipes are dropped with logging
- [ ] Retry logic works if JSON parsing fails
- [ ] ANTHROPIC_API_KEY is server-side only
- [ ] Test the route manually and inspect the returned recipes — are they real Allrecipes recipes? Do the URLs look valid? Are the ingredients reasonable?

---

## 5C: Plan Creation & Display (Wire API to UI)

Read CLAUDE.md for design tokens and conventions.

Wire the API route from 5B into the UI. When the user finishes the on-hand items screen (5A), call the API and display the results as a weekly plan.

**What to build:**

1. When the user taps "Generate Plan" or "Skip" on the on-hand items screen:
   - Show a full-screen loading state on the `/plan/generating` page
   - The loading state should show 7 skeleton day rows with 2 skeleton recipe cards each
   - Include a friendly rotating message that changes every 3-4 seconds:
     - "Searching for recipes..."
     - "Matching your preferences..."
     - "Building your week..."
     - "Almost there..."
   - Call `POST /api/generate-plan` with the household_id

2. When the API returns successfully:
   - Create a new `meal_plans` record in Supabase:
     - household_id
     - week_start: next Monday's date (if today is Monday, use today)
     - status: "draft"
   - Create 7 `meal_plan_days` records:
     - meal_plan_id: the plan just created
     - day_of_week: 0 through 6 (Mon=0, Sun=6)
     - option_a: the first recipe for that day (recipes[0], recipes[2], recipes[4]... as jsonb)
     - option_b: the second recipe for that day (recipes[1], recipes[3], recipes[5]... as jsonb)
     - selected_option: null
     - status: "pending"
   - Link any on-hand items to this meal_plan_id (update `on_hand_items.meal_plan_id`)
   - Navigate to the plan view (e.g., `/plan/[id]`)

3. Plan view displays:
   - Header: "This Week's Plan" with date range (e.g., "May 4 – May 10")
   - 7 day sections (Monday–Sunday)
   - Each day shows 2 recipe cards side by side (or stacked on very narrow screens)
   - Each recipe card shows:
     - Recipe title (1 line, truncate with ellipsis if needed)
     - Prep + cook time (e.g., "15 min prep · 30 min cook")
     - Tags as small pills
     - Key ingredients — show first 5-6 ingredients as chips. Ingredients that match a staple or on-hand item should be highlighted (green background, checkmark prefix). Others are neutral.
   - Both cards are in their default (unselected) state — no selection interaction yet (that's Milestone 6)

4. Error handling:
   - If the API call fails, show: "Something went wrong finding recipes. Check your connection and try again." with a "Retry" button that re-calls the API
   - If the API returns but with fewer than 14 recipes, display what you have and leave empty day slots with a note: "Couldn't find options for this day. Tap refresh to try again." (The refresh button comes in Milestone 6 — for now just show the note)

**Do NOT build:** Recipe selection (tap to select), regenerate per day, skip day, confirm plan, or grocery list. Just display the plan.

**Verify before moving on:**
- [ ] Full flow works: Home → On-hand items → Loading → Plan display
- [ ] Loading state shows skeleton cards and rotating messages
- [ ] meal_plans record is created with status "draft"
- [ ] 7 meal_plan_days records are created with correct recipe data in option_a and option_b
- [ ] On-hand items are linked to the meal_plan_id
- [ ] Recipe cards display title, times, tags, and ingredients
- [ ] Staple/on-hand ingredients are highlighted green on the cards
- [ ] Error state shows with retry button if API fails
- [ ] Plan view works at 390px width

---

## 5D: Prompt Tuning & Edge Case Testing

This is NOT a Claude Code prompt — this is a manual testing step for you to do.

**Test the plan generation 2-3 times and check:**

1. **Are the recipes real?** Open 3-4 of the Allrecipes URLs from the generated plan. Do they load? Are they actual recipes? If you're getting 404s or wrong pages, the URLs are hallucinated — go back to Claude Code and ask it to add URL validation that fetches each URL and checks for a 200 response.

2. **Do the recipes match your constraints?** If you set "mild/no spicy" and you're seeing spicy Thai curry, the prompt needs tightening. If you have an air fryer listed and none of the recipes use it, that's fine (tools are a filter, not a preference). But if a recipe requires a tool you DON'T have, that's a bug.

3. **Are ingredients reasonable?** Look at the ingredient lists on the cards. Do they roughly match what's on the actual Allrecipes page? They don't need to be perfect (the full recipe is on Allrecipes) but they shouldn't be wildly off.

4. **Is protein rotating?** Check across all 14 recipes — you shouldn't see chicken in more than 4 of them (2 days × 2 options).

5. **Are on-hand items being used?** If you added "chicken thighs" as an on-hand item, at least a few recipes should include chicken thighs.

**If anything is off, take it back to Claude Code with a specific prompt like:**

> "The plan generation is returning [specific problem]. Update the Anthropic prompt in /api/generate-plan to [specific fix]. For example, [show a recipe that violated the constraint and explain why it shouldn't have been included]."

**Common fixes you might need:**
- "Recipes have hallucinated URLs" → Add a note to the prompt: "Only return recipes you have confirmed exist on Allrecipes.com via web search. Do not guess or construct URLs."
- "Spicy recipes are slipping through" → Strengthen the spice instruction: "CRITICAL: Spice tolerance is mild. Do NOT include any recipe with spicy, hot, or chili-heavy flavors. This is a hard constraint, not a preference."
- "Ingredients don't match the real recipe" → Add: "For each recipe, include the actual ingredient list from the Allrecipes page. Do not summarize or guess ingredients."
- "Getting fewer than 14 recipes" → The retry logic from 5B should handle this, but if it persists, simplify the constraints in the prompt (sometimes too many constraints cause the model to struggle)

Only move to Milestone 6 when you're getting consistent, high-quality results from 2-3 test generations.
