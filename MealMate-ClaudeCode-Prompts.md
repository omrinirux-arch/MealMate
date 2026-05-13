# MealMate — Claude Code Prompts (Milestones 2–10)

**Before you start:** Milestone 1 (scaffold) should already be complete — Next.js App Router, Tailwind, Supabase auth, household creation, empty home screen with bottom nav, and CLAUDE.md in the project root. Commit that before moving forward.

**How to use these prompts:** Copy and paste one prompt per Claude Code session. Complete the milestone, test against the verification steps at the bottom of each prompt, fix any issues, then commit before moving to the next.

---

## Milestone 2: Kitchen Setup — Staple Items

Read CLAUDE.md for design tokens and conventions.

Build the staple items onboarding screen — step 1 of 3 in the first-time setup flow. This screen is reached after a new user signs up and creates a household.

**What to build:**

1. A progress indicator at the top showing step 1 of 3 (Staples → Tools → Preferences).

2. A search/text input at the top where the user can type to add custom staple items. Pressing enter or tapping "Add" adds the item.

3. Below the input, show pre-populated suggestion chips grouped by these categories:
   - **Oils & Vinegars:** olive oil, vegetable oil, sesame oil, balsamic vinegar, red wine vinegar, apple cider vinegar
   - **Spices & Seasonings:** salt, black pepper, garlic powder, onion powder, paprika, cumin, chili powder, oregano, Italian seasoning, cinnamon, red pepper flakes, bay leaves
   - **Grains & Pasta:** white rice, brown rice, spaghetti, penne, quinoa, oats, bread crumbs
   - **Canned Goods:** canned tomatoes (diced), canned tomatoes (crushed), tomato paste, canned beans (black), canned beans (kidney), chicken broth, coconut milk
   - **Condiments & Sauces:** soy sauce, hot sauce, ketchup, mustard, mayonnaise, Worcestershire sauce, fish sauce, honey, maple syrup
   - **Freezer Staples:** frozen chicken breasts, frozen ground beef, frozen shrimp, frozen vegetables (mixed), frozen corn
   - **Dairy & Eggs Basics:** eggs, butter, milk, heavy cream, parmesan cheese, cheddar cheese, cream cheese

4. Tapping a suggestion chip adds it to the user's staples list. Selected chips should be visually distinct (filled primary green with checkmark). Tapping again removes it.

5. A summary area showing all selected staples (both from suggestions and custom-added) as removable chips.

6. A "Next" button at the bottom to proceed to step 2.

**Database:**

Write to the `staple_items` table in Supabase:
- id (uuid, auto-generated)
- household_id (FK — get from the logged-in user's household)
- name (text)
- category (enum: oils, spices, grains, canned, condiments, frozen, dairy_basics, other). For custom items, default to "other."
- created_at (timestamp)

Insert staples on "Next" — not on every tap. Batch the insert when the user advances to step 2.

**Do NOT build:** Steps 2 or 3 of onboarding, the settings screen, or any navigation beyond "Next." Just this one screen.

**Verify before committing:**
- [ ] Progress indicator shows step 1 of 3
- [ ] All 7 category groups render with correct suggestion chips
- [ ] Tapping a chip toggles it selected/deselected with visual feedback
- [ ] Custom items can be typed and added via the search input
- [ ] Selected items persist when scrolling through categories
- [ ] Tapping "Next" writes all selected staples to Supabase `staple_items` table with correct household_id and category
- [ ] The screen is mobile-first (works well at 390px width)

---

## Milestone 3: Kitchen Setup — Tools & Preferences

Read CLAUDE.md for design tokens and conventions.

Build the remaining two onboarding screens: kitchen tools (step 2 of 3) and household preferences (step 3 of 3). Wire them together with the staple items screen from Milestone 2 into a complete onboarding flow.

**Screen: Kitchen Tools (Step 2 of 3)**

1. Progress indicator showing step 2 of 3.

2. A checklist of common kitchen tools. Each tool is a tappable row or card — tapping toggles a checkmark. Tools to include:
   - Instant Pot
   - Air fryer
   - Slow cooker
   - Grill (outdoor)
   - Wok
   - Dutch oven
   - Food processor
   - Stand mixer
   - Sous vide
   - Smoker
   - Cast iron skillet
   - Sheet pans

3. A text input to add custom tools not on the list.

4. A small note at the bottom: "Basic tools are always assumed: stovetop, oven, microwave, pots & pans, knives, cutting board."

5. Back button (returns to staples) and "Next" button (proceeds to preferences).

**Database:** Write to `kitchen_tools` table:
- id (uuid), household_id (FK), name (text), created_at
- Batch insert on "Next."

**Screen: Household Preferences (Step 3 of 3)**

1. Progress indicator showing step 3 of 3.

2. **Dietary goals** — multi-select chips:
   - Lower cholesterol
   - Lose weight
   - Build muscle / high protein
   - Heart healthy
   - Low sodium
   - Balanced / no specific goal

3. **Recipe style** — multi-select chips:
   - Quick and easy (under 30 min)
   - One-pan / one-pot
   - Meal prep friendly
   - More involved / weekend project
   - Kid-friendly / mild flavors

4. **Spice tolerance** — single-select (radio-style chips):
   - None
   - Mild (DEFAULT — pre-selected)
   - Medium
   - Hot

5. **Excluded ingredients** — free-text tag input. Type an ingredient, press enter to add as a removable chip. Placeholder: "e.g., mushrooms, shellfish"

6. Back button and "Finish Setup" CTA button.

**Database:** On "Finish Setup," update the `households` table for the current household:
- spice_tolerance (enum value)
- dietary_goals (text array of selected goals)
- recipe_style_preferences (text array of selected styles)
- excluded_ingredients (text array)

After saving, redirect the user to the home screen with the empty state CTA: "Generate Your First Meal Plan."

**Wire up the full onboarding flow:**
- After auth + household creation → Staples (step 1) → Tools (step 2) → Preferences (step 3) → Home screen
- Back buttons should preserve selections on previous steps (don't lose data navigating backward)
- Only users who haven't completed onboarding should see this flow. Set a flag (e.g., `onboarding_complete` on the household or user record) and check it on login.

**Verify before committing:**
- [ ] Full 3-step flow works end-to-end: Staples → Tools → Preferences → Home
- [ ] Progress indicator updates correctly on each step
- [ ] Back navigation preserves previous selections
- [ ] Kitchen tools save correctly to `kitchen_tools` table
- [ ] Preferences save correctly to `households` table
- [ ] Spice tolerance defaults to "Mild" and only allows single selection
- [ ] Excluded ingredients work as a tag input (add/remove)
- [ ] "Finish Setup" redirects to home screen with empty state
- [ ] Returning users who completed onboarding skip straight to home
- [ ] All screens work at 390px width

---

## Milestone 4: Settings / Kitchen Profile Screen

Read CLAUDE.md for design tokens and conventions.

Build the Settings / Kitchen Profile screen accessible from the Settings tab in the bottom navigation. This screen lets users edit everything they set during onboarding at any time.

**What to build:**

1. A scrollable screen with three collapsible sections, all expanded by default:

2. **Staple Items section:**
   - Display all saved staples as removable chips, grouped by category (same categories as onboarding)
   - Each chip has an "×" to remove it (deletes from `staple_items` table)
   - A search/text input at the top of the section to add new staples (same behavior as onboarding — type to search suggestions or add custom)
   - Adding a staple inserts immediately to Supabase (no "Save" button needed — this is an edit screen, not a form)

3. **Kitchen Tools section:**
   - Display all saved tools as a toggleable checklist (same list as onboarding)
   - Checked items are tools the user has. Unchecking removes from `kitchen_tools` table. Checking adds.
   - Custom tools input at the bottom
   - Changes save immediately on toggle

4. **Household Preferences section:**
   - Dietary goals as multi-select chips (current selections pre-filled)
   - Recipe style as multi-select chips (current selections pre-filled)
   - Spice tolerance as single-select chips (current selection pre-filled)
   - Excluded ingredients as tag input (current exclusions pre-filled as removable chips)
   - A "Save Preferences" button at the bottom of this section (since multiple fields update together, batch this write to `households` table)

5. **Serving Size:** Display current setting (default 4) with a simple number stepper (- / + buttons). Save immediately on change to `households.default_servings`.

**Important implementation details:**
- Fetch all data on mount: staple_items, kitchen_tools, and households (for preferences + serving size)
- Staple and tool changes are real-time (write on interaction). Preference changes are batched (write on "Save Preferences").
- Deletions should have a brief confirmation or undo — it's too easy to accidentally tap "×" on a staple you didn't mean to remove

**Verify before committing:**
- [ ] Settings screen loads with all existing data pre-populated
- [ ] Staples can be added and removed, changes persist in Supabase immediately
- [ ] Tools can be toggled, changes persist immediately
- [ ] Preferences load with current selections, changes save on "Save Preferences"
- [ ] Spice tolerance allows only single selection
- [ ] Excluded ingredients can be added and removed
- [ ] Serving size stepper works and saves immediately
- [ ] Accidental staple deletion has undo or confirmation
- [ ] Bottom navigation shows Settings as the active tab
- [ ] Screen works at 390px width

---

## Milestone 5: Meal Plan Generation — API Integration ⚠️ Highest Risk

Read CLAUDE.md for design tokens and conventions.

This is the core feature of the app. Build the on-hand items input, the recipe generation pipeline, and the meal plan display.

**Part 1: On-Hand Items Input Screen (`/plan/new`)**

When the user taps "Generate This Week's Plan" from the home screen, show an intermediate screen before generating:

1. Heading: "Anything on hand you want to use this week?"
2. Subtitle: "We'll prioritize recipes that use these up"
3. A tag-style text input — type an item, press Enter to add it as a removable chip. Backspace with empty input removes the last chip. An inline "+ Add" button appears while typing.
4. Two buttons at the bottom:
   - "Skip" (ghost button) — skips directly to plan generation with no on-hand items
   - "Generate Plan" (primary button with sparkle icon) — proceeds to generation with the entered items

5. Save on-hand items to the `on_hand_items` table:
   - id, household_id, name, meal_plan_id (linked after plan creation), created_at

6. **Regenerate flow:** When accessed via `/plan/new?fromPlanId=<id>` (from the Regenerate button on an existing plan), pre-populate the items state with on-hand items from that previous plan (query `on_hand_items` filtered by `meal_plan_id`). Show a "← Back" button in the header so the user can cancel and return to their existing plan. The page uses `useSearchParams` and must be wrapped in `<Suspense>`.

**Part 2: API Route for Recipe Generation (`/api/generate-plan`)**

Create a Next.js API route using **Claude-native recipe generation** — no third-party recipe APIs. Claude generates all 14 original dinner recipes in a single call.

**Recipe generation pipeline:**

1. Fetch all household context from Supabase in parallel:
   - `staple_items` — always-available pantry items
   - `on_hand_items` where `meal_plan_id IS NULL` — items entered this session
   - `kitchen_tools` — available equipment
   - `household_preferences` — dietary goals, recipe style, spice tolerance, exclusions, servings
   - `recipe_ratings` — thumbs up/down history
   - `meal_plan_days` joined with `meal_plans` for last 3 weeks (to avoid repeating recent titles)

2. Build a structured user message serializing all household context: dietary goals, recipe style, spice tolerance, exclusions, servings per recipe, staple items, on-hand items, kitchen tools, and recent recipe titles to avoid.

3. Call Claude (`claude-sonnet-4-6`) with a detailed system prompt that instructs it to generate exactly 14 original dinner recipes as a raw JSON array (no markdown, no explanation). Key rules:
   - All 14 titles must be unique
   - No single protein more than twice across 7 days
   - Each same-day pair (indices 0&1, 2&3, etc.) must differ in protein AND cuisine
   - Honor all exclusions strictly — excluded ingredients must not appear anywhere
   - Respect spice tolerance, dietary goals, and recipe style constraints
   - Prioritize using on-hand items and staples in ingredient lists
   - Do not repeat any title from recent_recipes
   - `url` always `""`, `image_url` always `null`
   - `max_tokens: 8000`, Anthropic client timeout `90_000ms`

4. Validate, deduplicate by normalized title (lowercase, alphanumeric only), and normalize each recipe. Force `url: ""` and `image_url: null` regardless of Claude output.

5. If fewer than 14 valid recipes, make a second Claude call requesting exactly the missing count, passing already-generated titles to avoid repeats.

6. Pad to exactly 14 with a generic placeholder recipe if still short after the second call.

7. Sort all 14 by ingredient match score (how many ingredients overlap with staples + on-hand items).

8. Emit NDJSON progress events to the client: `searching` → `matching` → optionally `topup` → `done`.

**Ingredient matching (`lib/ingredient-match.ts`):** Bidirectional matching so "extra virgin olive oil" satisfies "olive oil" and vice versa. Strip quantities, units, and size/descriptor words ("medium", "large", "fresh", "boneless", "skinless", "dried", etc.) from the start of ingredient strings before comparing. Check both directions so "1 medium onion" correctly matches "white onion".

**Part 3: Meal Plan Display**

After generation:
- Header: "This Week's Plan" with date range (e.g., "May 4 – May 10")
- 7 day sections (Monday–Sunday), each showing 2 recipe cards side by side
- Each recipe card shows: title, prep + cook time, ingredient match pill (e.g., "4 / 12 on hand" in green)
- Loading state with animated progress messages while generation streams in

**Do NOT build in this milestone:** Recipe detail pages, selection/editing interactions, confirm button, grocery list. Those are Milestones 6 and 7.

**Verify before committing:**
- [ ] Tapping "Generate" from home shows the on-hand items screen
- [ ] On-hand items can be added as chips (Enter key or "+ Add" button), removed, or skipped
- [ ] API route generates 14 unique original recipes via Claude
- [ ] No two recipes on the same day share a protein or cuisine
- [ ] Exclusions never appear in any recipe's ingredients
- [ ] Recipes stored in `meal_plan_days` as jsonb (option_a, option_b)
- [ ] Plan displays 7 days × 2 cards with correct data
- [ ] Ingredient match pill shows correct count using bidirectional matching ("1 medium onion" matches "white onion")
- [ ] Streaming progress shows during generation
- [ ] `ANTHROPIC_API_KEY` is server-side only
- [ ] Error state shows if generation fails
- [ ] Regenerate flow pre-populates previous on-hand items with a back button
- [ ] Works at 390px width

---

## Milestone 6: Recipe Detail Pages & Plan Selection UX

Read CLAUDE.md for design tokens and conventions.

Add recipe detail pages and the full plan selection experience to the weekly plan view built in Milestone 5.

**Part 1: Recipe Detail Pages**

Tapping "View recipe" on a card navigates to a detail page at `/plan/[id]/recipe/[dayIndex]/[option]` (e.g., `/plan/abc123/recipe/0/a`). This is a Server Component page that loads the recipe from the existing `meal_plan_days` jsonb.

The detail page shows:
- Recipe title, prep + cook time, serving count
- Ingredient match pill ("4 / 12 on hand" in green)
- **Ingredients section** split into two groups:
  - "You have" — ingredients matching staples or on-hand items, each with a green checkmark. Use bidirectional matching from `lib/ingredient-match.ts`.
  - "You need" — remaining ingredients
- Instructions as a numbered step list
- **Sticky CTA bar** at `position: sticky; bottom: 72px` (sits above the fixed 72px bottom nav — never use `bottom: 0` or the bar will hide behind the nav). The bar contains a `SelectRecipeButton` client component.

The `SelectRecipeButton` has three visual states (all inline styles, tokens only):
- **Default** — full-width primary gradient button: "Select for [DayName]"
- **Already selected** — green confirmed state (non-interactive)
- **Peer selected** — outlined secondary button: "Select this instead"

Use `useTransition` for pending state. On submit, call a Server Action (`selectRecipeAction`) that writes `selected_option` to `meal_plan_days` and redirects back to `/plan/[id]`.

Add enough `paddingBottom` to the content area so the sticky bar doesn't overlap the last ingredient.

**Part 2: Plan View — Card-Level Selection UX (`SelectableRecipeCard`)**

Replace static recipe cards with a `SelectableRecipeCard` client component. Each card has two interaction surfaces:

1. **Tap anywhere on the card** → selects that recipe for the day (calls `selectRecipeAction` via `useTransition`, no navigation)
2. **"View recipe →" text link at the bottom of the card** → navigates to the detail page (`e.stopPropagation()` to prevent card selection)

Visual states:
- **Selected:** green border (`2px solid primary[400]`), tinted background (`primary[50]`), checkmark badge (22px circle, top-right corner)
- **Pending (tap in-flight):** spinner badge in top-right corner instead of checkmark
- **Unselected:** default card appearance (no dimming)

Selection state is read server-side from `meal_plan_days.selected_option` on every page load (`force-dynamic`).

**Part 3: Per-Day Actions (`DayActions` component)**

Each day header row is a flex row: day name + date on the left, `DayActions` client component on the right. The component renders two small inline controls:

1. **"Skip day" / "Undo skip" text button** — calls `skipDayAction` (sets `selected_option` to `"skip"`) or `unskipDayAction` (sets `selected_option` to `null`). When a day is skipped:
   - A "Skipped" pill appears next to the date label
   - The two recipe cards dim to 45% opacity (they stay visible so the user can still select one if they change their mind)
   - The button label changes to "Undo skip"
2. **Refresh icon button** — client-side `fetch("/api/regenerate-day", { method: "POST", body: { plan_id, day_index } })`, shows an inline spinner while in-flight, then calls `router.refresh()` to reload the page with the new recipes. Avoids all existing recipe titles in the plan.

Both actions use `useTransition` (skip) or local `useState` (regenerate) for pending state. Buttons are disabled while either is pending.

**`/api/regenerate-day` POST route:**
- Accepts `{ plan_id, day_index }`
- Fetches household context (prefs, staples, on-hand items) + all existing recipe titles in the plan
- Calls Claude (`claude-sonnet-4-6`, `max_tokens: 2500`) for exactly 2 recipes, passing existing titles as "do not repeat"
- Validates, normalizes, pads to 2 if needed
- Updates `meal_plan_days.option_a`, `option_b`, and resets `selected_option` to `null`
- Returns `{ ok: true, titles: [...] }`

**Server actions in `app/(app)/plan/[id]/actions.ts`:**
```ts
skipDayAction(formData)   // sets selected_option = "skip", redirect /plan/[id]
unskipDayAction(formData) // sets selected_option = null,   redirect /plan/[id]
```
`updateSelectedOption` in `lib/supabase/queries.ts` accepts `"a" | "b" | "skip" | null`.

**Part 4: Plan Actions Bar (`PlanActions` component)**

A sticky client component at `position: sticky; bottom: 72px; z-index: 10` (above the fixed 72px bottom nav). Add `padding: "0 20px 180px"` to the day sections container so the last day isn't hidden behind the bar.

The bar contains:
- A progress hint ("Select or skip N more days to continue") shown until all 7 days are resolved
- **"Accept plan" button** — enabled once all 7 days are resolved (recipe selected OR skipped). Calls `confirmPlanAction` Server Action which updates `meal_plans.status` to `"confirmed"` and redirects to `/grocery`.
- **"Regenerate plan" button** — always enabled. Navigates to `/plan/new?fromPlanId=${planId}` so the user can review/edit on-hand items before regenerating the full week.

Both buttons use `useTransition` for pending/loading state.

**Part 5: Confirm the Plan (Server Action)**

`confirmPlanAction` in `app/(app)/plan/[id]/actions.ts`:
- Receives `planId` from FormData
- Updates `meal_plans.status` to `"confirmed"`
- Redirects to `/grocery`

`selectedCount` (passed to `PlanActions`) counts days where `selected_option` is `"a"`, `"b"`, OR `"skip"` — skipped days count as resolved.

**Verify before committing:**
- [ ] Tapping a card (outside "View recipe") selects it with checkmark badge and green border
- [ ] Tapping "View recipe →" navigates to the detail page without selecting the card
- [ ] Selecting a card shows a spinner badge while the server action is in-flight
- [ ] Selecting the peer card moves the selection to the new card
- [ ] Detail page sticky CTA is at `bottom: 72` and never hidden behind the bottom nav
- [ ] "Skip day" marks the day, dims the cards, shows "Skipped" pill and "Undo skip" button
- [ ] "Undo skip" restores the day to unresolved state
- [ ] Regenerate icon fetches new recipes for that day only, shows inline spinner, refreshes
- [ ] Regenerated recipes don't repeat any title already in the plan
- [ ] "Accept plan" requires all 7 days resolved (selected OR skipped)
- [ ] Skipped days count toward the 7/7 total for enabling "Accept plan"
- [ ] Progress hint reads "Select or skip N more days"
- [ ] Accepting the plan updates `meal_plans.status` to "confirmed" and redirects to `/grocery`
- [ ] "Regenerate plan" navigates to `/plan/new?fromPlanId=<id>`
- [ ] `PlanActions` bar is at `bottom: 72` and always visible while scrolling
- [ ] All interactions work at 390px width

---

## Milestone 7: Grocery List Generation

Read CLAUDE.md for design tokens and conventions.

Auto-generate a grocery list when a meal plan is confirmed (triggered at the end of Milestone 6's confirm flow).

**What to build:**

1. **Grocery list generation logic** — Create a server-side function (or API route, e.g., `/api/generate-grocery-list`) that:
   - Takes a confirmed meal_plan_id
   - Fetches all `meal_plan_days` where status is "selected" (not "skipped")
   - Extracts the ingredients array from each selected recipe's jsonb (option_a or option_b based on selected_option)
   - Fetches the household's staple items and on-hand items
   - Calls the Anthropic API (claude-sonnet-4-20250514) with a prompt that instructs Claude to:
     a. Take all ingredients from the selected recipes
     b. Remove any items that match the user's staples: [list staples]
     c. Remove any items that match the user's on-hand items: [list on-hand items]
     d. Combine duplicate ingredients across recipes (e.g., two recipes needing onions → "Onions, 3 medium" with both recipe names listed)
     e. Scale all quantities to the household's serving size (default 4)
     f. Categorize each item into a store section: produce, meat, dairy, bakery, canned, frozen, grains, snacks, misc
     g. Return a JSON array where each item has: name, quantity (number), unit (string), aisle_category (enum), source_recipes (array of recipe titles)
   - Parse the response and write to Supabase:
     - Create a `grocery_lists` record linked to the meal_plan_id
     - Create `grocery_items` records for each item (is_manual: false, checked: false)

2. **Grocery list display screen** — accessible via the "Grocery List" tab in bottom navigation:
   - Header: "Grocery List" with item count (e.g., "18 items")
   - Items grouped by aisle_category with section headers: Produce, Meat & Seafood, Dairy & Eggs, Bakery, Canned & Jarred, Frozen, Grains/Pasta/Rice, Snacks & Other, Miscellaneous
   - Each item row shows:
     - Checkbox (unchecked)
     - Ingredient name (medium weight text)
     - Quantity + unit (secondary text)
     - Source recipes (subtle, right-aligned — e.g., "Salmon · Stir Fry")
   - Empty state if no confirmed plan exists: "No grocery list yet. Confirm your meal plan to generate a shopping list."

3. **Wire it into the confirm flow:** After `meal_plans.status` is set to "confirmed" in Milestone 6, automatically trigger grocery list generation, then redirect to the grocery list screen.

**Important:** Use the Anthropic API for ingredient deduplication and categorization rather than trying to build string-matching logic. The API handles fuzzy matching ("chicken breast" vs "boneless skinless chicken breasts") and smart categorization much better than rule-based code.

**Verify before committing:**
- [ ] Confirming a plan triggers grocery list generation automatically
- [ ] Staple items are correctly excluded from the list
- [ ] On-hand items are correctly excluded from the list
- [ ] Duplicate ingredients across recipes are combined with correct quantities
- [ ] Items are categorized into correct store sections
- [ ] Source recipes are listed for each item
- [ ] Grocery list screen displays items grouped by section
- [ ] Empty state shows when no plan is confirmed
- [ ] Grocery List tab in nav navigates to this screen
- [ ] Works at 390px width

---

## Milestone 8: Grocery List Interactions

Read CLAUDE.md for design tokens and conventions.

Add interactive functionality to the grocery list screen built in Milestone 7.

**What to build:**

1. **Check off items:** Tapping an item row or its checkbox marks it as purchased.
   - Checkbox fills with primary green + checkmark
   - Item name gets strikethrough
   - Row dims (reduced opacity)
   - Checked items stay in place (don't move to the bottom — this is disorienting while shopping)
   - Update `grocery_items.checked` to true in Supabase on tap
   - Tapping again unchecks it

2. **Manually add items:** A floating "+" button (or a persistent input row at the top) that lets users add non-recipe items.
   - Input with placeholder: "Add an item (paper towels, snacks...)"
   - Pressing enter creates a new `grocery_items` record with:
     - is_manual: true
     - aisle_category: "misc" (default)
     - source_recipes: empty array
     - checked: false
   - Manual items appear in the Miscellaneous section (or let the user pick a section — keep it simple for v1, default to misc)

3. **Remove items:** Swipe-to-delete or a subtle "×" button on each row.
   - Deletes the `grocery_items` record from Supabase
   - Brief undo toast: "Removed [item name]. Undo?" that persists for 3 seconds

4. **Export/share options:** A share icon button in the header that opens an action sheet with:
   - **Copy to clipboard** — generates a plain text version of the list grouped by section:
     ```
     PRODUCE
     □ Broccoli, 2 heads
     □ Onions, 3 medium
     
     MEAT & SEAFOOD
     □ Salmon fillets, 4 (6oz)
     ```
     Checked items are excluded from the export.
   - **Share** — uses the Web Share API (`navigator.share`) to send the same plain text to any app (Messages, Notes, etc.). Fall back to clipboard copy if Web Share isn't available.

5. **Progress indicator:** A subtle progress bar or fraction at the top (e.g., "7 of 18 items" or a thin progress bar) showing how many items are checked vs. total.

**Verify before committing:**
- [ ] Tapping items checks them off with strikethrough + dim + filled checkbox
- [ ] Tapping again unchecks
- [ ] Check state persists in Supabase (refresh the page — items stay checked)
- [ ] Manual items can be added and appear in the list
- [ ] Items can be removed with an undo option
- [ ] "Copy to clipboard" generates correct plain text (unchecked items only)
- [ ] Share button works (Web Share API or fallback)
- [ ] Progress indicator updates as items are checked
- [ ] All interactions work one-handed on mobile (generous tap targets, no precision required)
- [ ] Works at 390px width

---

## Milestone 9: Recipe Rating

Read CLAUDE.md for design tokens and conventions.

Build the post-meal rating system that feeds back into future plan generation.

**What to build:**

1. **Determine which recipes need rating:** Query `meal_plan_days` joined with `meal_plans` to find:
   - Recipes where status is "selected" (not skipped)
   - The planned day has passed (e.g., if today is Wednesday, Monday and Tuesday meals are eligible)
   - No `recipe_ratings` record exists for this recipe_url + household_id combination
   - Limit to the current week's confirmed plan

2. **Rating prompt on the home screen:** When unrated recipes exist, show an inline card above the main home screen content (not a modal, not a blocking popup):
   - "How was the [Recipe Title]?"
   - Two large tappable buttons: 👍 (thumbs up) and 👎 (thumbs down)
   - A subtle "Not now" text link to dismiss
   - Show only ONE recipe at a time. If multiple are unrated, show the oldest first. After rating, the next one slides in (or the card disappears if none remain).

3. **On thumbs up:**
   - Create a `recipe_ratings` record: household_id, recipe_url, recipe_title, rating: "up", cooked_date (the planned date)
   - Brief confirmation: "Saved! We'll suggest similar recipes." (fade out after 2 seconds)

4. **On thumbs down:**
   - Create a `recipe_ratings` record: household_id, recipe_url, recipe_title, rating: "down", cooked_date
   - Brief confirmation: "Got it — we won't suggest this again."

5. **On "Not now":**
   - Dismiss the card for this session. Show it again next time the user opens the app.
   - Do NOT create a rating record — the recipe remains neutral.

6. **Wire ratings into plan generation:** Update the Anthropic API prompt in `/api/generate-plan` (Milestone 5) to include:
   - Thumbs-down recipe URLs with instruction: "NEVER recommend these recipes"
   - Thumbs-up recipe URLs with instruction: "Favor recipes similar to these, but don't repeat them within 3 weeks"
   - This data should already be fetched in the API route from Milestone 5, but verify it's actually being included in the prompt.

**Verify before committing:**
- [ ] Rating prompt appears on home screen for past meals that haven't been rated
- [ ] Only one recipe shows at a time, oldest first
- [ ] Thumbs up creates a rating record with rating "up"
- [ ] Thumbs down creates a rating record with rating "down"
- [ ] Confirmation message shows briefly after rating
- [ ] "Not now" dismisses for the current session only
- [ ] Rating prompt doesn't appear for skipped days
- [ ] Rating prompt doesn't appear for future days
- [ ] Thumbs-down recipes are excluded from future plan generation
- [ ] Thumbs-up recipes are favored in future plan generation
- [ ] The card feels non-intrusive — not blocking other content
- [ ] Works at 390px width

---

## Milestone 10: PWA & Polish

Read CLAUDE.md for design tokens and conventions.

This is the final milestone. Make the app installable and handle all the edge cases that make it feel complete.

**Before starting:** Verify that the recipe ratings UI from Milestone 9 is complete (thumbs up/down in the plan view or recipe detail page, writing to `recipe_ratings`). If not, build Part 7 of this milestone first.

**Part 1: PWA Setup**

1. Create a `manifest.json` with:
   - App name: "MealMate"
   - Short name: "MealMate"
   - Theme color and background color matching the design system (primary-600 for theme, neutral-50 for background)
   - Display: "standalone"
   - Icons at required sizes (192x192, 512x512) — generate simple icons using the app's primary color with an "M" or a fork/knife icon
   - Start URL: "/"

2. Set up a service worker using next-pwa or Workbox that caches:
   - The app shell (all pages/routes)
   - The current week's confirmed meal plan data
   - The current grocery list data
   - Static assets (CSS, JS, fonts)
   - Cache strategy: network-first for API calls, cache-first for static assets
   - Recipe detail hero images use plain `<img>` tags pointing to external URLs — add these domains to the cache allowlist or show a placeholder `<img>` fallback when offline

3. Add the manifest link and meta tags to the root layout for iOS and Android install support.

**Part 2: Loading States**

The plan generation streaming loading state (searching → matching → topup) and the grocery list progress bar already exist — do not rebuild them. Add the remaining loading states:

- **Plan confirmation** (triggers grocery list creation server-side): Show a "Building your grocery list..." full-screen message before the redirect to `/grocery`. This replaces the abrupt navigation that currently happens after "Confirm Plan."
- **Day regeneration** (5-10 seconds): Skeleton cards on that specific day only, rest of plan stays visible — verify this is working; if not, build it.
- **Settings saves:** Subtle inline confirmation (checkmark that fades) — no full-screen loader
- **Initial data fetch on any screen:** Skeleton/shimmer matching the content layout

**Part 3: Empty States**

Add or verify empty states for every screen that can be empty:

- **Home (no plan):** "Ready to plan your week?" with CTA "Generate This Week's Plan" and a summary of their profile ("12 staples · 3 tools · Preferences set")
- **Home (plan confirmed, all meals cooked):** "This week's plan is complete! Generate next week?" with CTA
- **Grocery list (no plan confirmed):** Already exists — verify the copy and styling match the design system.
- **Grocery list (all items checked):** "All done! 🎉" with subtle confetti or a checkmark illustration
- **Settings (no staples/tools):** "No staples added yet. Tap + to add items you always have on hand."
- **Plan view (0 days resolved):** `PlanActions` bar should show "Select or skip all planned days to continue" when `selectedCount = 0`.

**Part 4: Error Handling**

Handle failures gracefully:
- **API call fails (plan generation):** "Something went wrong finding recipes. Check your connection and try again." with a "Retry" button. Do NOT leave the user on a blank screen.
- **Grocery list creation fails** (Supabase error during `grocery_items` batch insert after plan confirmation): Show a "Couldn't build your grocery list. Tap to retry." message on the `/grocery` page with a retry button that re-runs the insert. Note: grocery list uses `ingredientMatches()` locally — there is no Anthropic API call here to fail.
- **Supabase write fails:** Toast notification: "Couldn't save. Trying again..." with automatic retry (1 attempt)
- **Network offline:** If cached data exists, show it with a banner: "You're offline. Some features need a connection." If no cached data, show: "You're offline. Connect to the internet to use MealMate."

**Part 5: Responsive Polish**

- Test every screen at 390px, 414px (iPhone), and 768px (tablet)
- Recipe cards: side-by-side at 390px+ (each ~170px), stacked if viewport is narrower
- Grocery list: full-width rows, generous tap targets (minimum 44px height)
- Bottom nav: fixed, doesn't overlap scrollable content (add bottom padding to page content)
- All text truncates gracefully (no overflow, ellipsis on long recipe titles)
- Buttons and interactive elements have minimum 44px tap targets

**Part 6: Small UX Details**

- Confirm plan has a "Are you sure?" confirmation if the user tries to navigate away with a draft plan
- Grocery list checked items count updates in the bottom nav badge (e.g., "3/18") — check whether the bottom nav component supports badges; add if not
- **Week boundary notice:** The generating page stops at Sunday when the requested day count would extend past it (e.g., asking for 7 days starting Wednesday gives 5 days). After generation, if `meal_plan_days` count is less than the requested `days` param, show a subtle notice on the plan view: "Planned [N] days through Sunday." Do not silently give the user fewer days than expected.
- Smooth transitions between states (selection, checking, dismissing)

**Part 7: Recipe Ratings UI** _(build this first if Milestone 9 was not completed)_

Add thumbs up / thumbs down rating UI so users can rate recipes after cooking them.

1. **Where to show it:** An inline card on the home screen (not a modal) for each unrated recipe from past days in the current confirmed plan. Show only ONE recipe at a time — oldest unrated first. Query: `meal_plan_days` joined with `meal_plans` where status is confirmed, `selected_option` is `a` or `b` (not skip), `day_index` is before today's day, and no matching row in `recipe_ratings` for this household.

2. **Card contents:**
   - "How was [Recipe Title]?"
   - Two large tap targets: 👍 and 👎
   - "Not now" text link to dismiss for this session (no DB write)

3. **On 👍:** Insert into `recipe_ratings` (household_id, recipe_url, recipe_title, rating: `"up"`, rated_at). Show "Saved! We'll suggest similar recipes." and fade out.

4. **On 👎:** Insert into `recipe_ratings` (rating: `"down"`). Show "Got it — we won't suggest this again." and fade out.

5. The generate-plan API route already reads thumbs-down URLs to exclude and thumbs-up URLs to favor — no changes needed there.

**Verify before committing:**
- [ ] App can be installed on iOS (Add to Home Screen) and Android (Install prompt)
- [ ] App opens in standalone mode (no browser chrome)
- [ ] Current plan and grocery list are available offline
- [ ] Recipe detail hero images have an offline fallback (no broken image icons)
- [ ] "Building your grocery list..." loading state shows after confirming a plan
- [ ] Day regeneration shows skeleton cards in-place (rest of plan stays visible)
- [ ] Every screen has an appropriate empty state
- [ ] `PlanActions` bar shows correct message when 0 days are resolved
- [ ] API failures (plan generation) show error message with retry
- [ ] Grocery list creation failure shows retry option on `/grocery`
- [ ] Offline state shows appropriate messaging
- [ ] Week boundary notice appears when planned days < requested days
- [ ] All screens work at 390px, 414px, and 768px
- [ ] No text overflow or layout breaking on any screen
- [ ] Tap targets are minimum 44px everywhere
- [ ] Bottom nav doesn't overlap content
- [ ] Recipe ratings card appears on home screen for past unrated meals
- [ ] Thumbs up/down writes to `recipe_ratings` table correctly
- [ ] "Not now" dismisses for the session only (no DB write)
- [ ] Overall app feels polished and complete
