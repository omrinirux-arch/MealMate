# Product Requirements Document: MealMate

## Overview

**One-liner:** A meal planning app that eliminates weekly dinner decision fatigue by recommending recipes based on what's already in your kitchen, generating a plan, and producing a ready-to-shop grocery list.

**Who it's for:** A two-adult household with a toddler that cooks dinner 5–6 nights per week from real ingredients. The users are confident home cooks — the problem isn't skill, it's the cognitive overhead of deciding what to make, cross-referencing what's on hand, and building a shopping list.

**What success looks like:** Open the app Sunday morning, generate next week's dinner plan in under 5 minutes, and walk into the store with a clean grocery list. No group texts, no staring into the fridge, no decision paralysis.

---

## Core Concepts

### Kitchen Inventory

The app maintains an understanding of what the user has available, split into two categories:

**Staple Items** — Persistent pantry/fridge/freezer items that carry over week to week until the user updates or removes them. These are ingredients the household always (or usually) has on hand.

Examples: olive oil, soy sauce, garlic, rice, frozen chicken breasts, flour, eggs, butter, common spices.

Staples inform recipe recommendations. The system should favor recipes that maximize usage of existing staples, reducing the number of new items on the grocery list.

**On-Hand Items** — Temporary, week-specific ingredients the user currently has that aren't staples. These are perishable or one-off items like a pack of chicken thighs, a head of broccoli, a block of feta, etc.

On-hand items are added before generating a weekly plan. The recommendation engine prioritizes recipes that use these items first (reducing waste and the grocery list). Unlike staples, on-hand items reset each week — they don't carry over. After a plan is confirmed, any on-hand items not used by selected recipes are cleared.

The user can skip this step entirely if they don't have anything specific to use up.

**Kitchen Tools** — A list of cooking equipment the household owns. This acts as a hard filter: the app will never recommend a recipe that requires a tool the user doesn't have.

Examples: Instant Pot, air fryer, stand mixer, grill, wok, Dutch oven, sheet pans.

Default assumed tools (not listed, always available): stovetop, oven, microwave, basic pots/pans, knives, cutting board.

### Household Preferences

A persistent profile of preferences and constraints that shape all recipe recommendations. Set once, editable anytime.

**Dietary goals** (multi-select):
- Lower cholesterol
- Lose weight
- Build muscle / high protein
- Heart healthy
- Low sodium
- Balanced / no specific goal

**Recipe style** (multi-select):
- Quick and easy (under 30 min)
- One-pan / one-pot
- Meal prep friendly (yields good leftovers)
- More involved / weekend project
- Kid-friendly / mild flavors

**Hard constraints:**
- Mild / no spicy (default ON for this household)
- Allergies or ingredients to exclude (free-text list)

### Default Serving Size

All recipes default to **4 servings** to cover dinner + next-day lunches. This is a global setting, not per-recipe.

---

## Features

### 1. Kitchen Setup (Onboarding + Ongoing)

**First-run experience:**
The app walks the user through an initial setup flow with three steps:

1. **Add staple items** — Searchable input with common suggestions grouped by category (oils & vinegars, spices & seasonings, grains & pasta, canned goods, condiments & sauces, freezer staples, dairy & eggs basics). Users can type to add custom items.
2. **Add kitchen tools** — Checklist of common tools (Instant Pot, air fryer, slow cooker, grill, wok, Dutch oven, food processor, stand mixer, sous vide, smoker, etc.) with the ability to add custom tools.
3. **Set household preferences** — Dietary goals, recipe style preferences, spice tolerance, and any exclusions.

**Ongoing management:**
All three sections (staples, tools, preferences) are accessible from a Settings/Kitchen Profile screen and editable at any time. Changes take effect on the next plan generation.

---

### 2. Weekly Meal Plan Generation

**Trigger:** User taps "Generate This Week's Plan" (or similar CTA).

**Pre-generation step — On-hand items (optional):**
Before the plan generates, the app prompts: "Anything on hand you want to use this week?" The user can quickly add temporary items (e.g., chicken thighs, broccoli, feta) via a simple text input. These items are factored into recipe selection as the top priority — the engine will try to build meals around them. The user can skip this step entirely.

**How it works:**

The app uses the Anthropic API to search for and recommend dinner recipes from Allrecipes.com. The API call includes:

- The user's staple items (to maximize ingredient overlap)
- On-hand items for this week (highest priority — build recipes around these first)
- Kitchen tools (as a hard filter — exclude recipes requiring tools they don't have)
- Household preferences (dietary goals, recipe style, spice tolerance, exclusions)
- Meal history + ratings (avoid recently cooked meals, favor thumbs-up recipes, exclude thumbs-down recipes)
- Default serving size (4)

**Output:** A 7-day dinner plan (Monday–Sunday) with **2 recipe options per day**. Each recipe card shows:

- Recipe title
- Thumbnail image (if available from Allrecipes)
- Prep + cook time
- Brief description (1–2 sentences)
- Key ingredients (highlighting which ones the user already has as staples or on-hand items)
- Link to the full recipe on Allrecipes.com
- Tags (quick & easy, one-pot, high-protein, etc.)

**Plan logic priorities (in order):**

1. Prioritize recipes that use on-hand items the user wants to use up this week
2. Maximize usage of staple items already in the kitchen
3. Respect hard constraints (tools, allergies, spice tolerance)
4. Align with dietary goals and recipe style preferences
5. Rotate proteins across the week (avoid chicken 5 nights in a row)
6. Avoid recipes cooked in the last 2–3 weeks
7. Favor recipes previously rated thumbs-up (or similar to them)
8. Never recommend recipes rated thumbs-down

---

### 3. Plan Editing

Once a plan is generated, the user can interact with it before confirming:

**Select a recipe:** For each day, tap one of the two options to confirm it as the planned dinner. The selected recipe is highlighted; the other dims.

**Regenerate per day:** If neither option appeals, a "Refresh" button on that day fetches 2 new options (following the same recommendation logic).

**Confirm the plan:** Once the user is satisfied, they confirm the full week. This action:
- Locks in the selected recipes
- Triggers grocery list generation
- Adds confirmed recipes to meal history

Unselected days (where the user didn't pick either option) should prompt the user to choose or skip (e.g., "eating out" / "leftovers" / "skip").

---

### 4. Grocery List

**Auto-generated** from the confirmed weekly plan. The list includes only ingredients the user needs to buy — staple items and on-hand items are excluded.

**Grouped by store section:**
- Produce
- Meat & seafood
- Dairy & eggs
- Bakery
- Canned & jarred
- Frozen
- Grains, pasta & rice
- Snacks & other
- Miscellaneous

**Each item shows:**
- Ingredient name
- Quantity + unit (scaled to 4 servings, aggregated across recipes — e.g., if two recipes need onions, combine into one line)
- Which recipe(s) it's for (subtle secondary text)
- Checkbox to mark as purchased

**Interactions:**
- Tap to check off while shopping
- Manually add items (for non-recipe things — paper towels, snacks, etc.)
- Remove items (maybe you already have something the app didn't know about)

**Export options:**
- Copy to clipboard (plain text)
- Share via text message
- Share to other apps (iOS/Android share sheet)

---

### 5. Recipe Rating

After a recipe has been cooked (based on the planned date passing, or triggered manually), the app prompts the user to rate it.

**Rating:** Binary thumbs up / thumbs down.

- **Thumbs up:** Recipe is added to the "liked" pool. The recommendation engine will suggest it again in the future (with appropriate spacing) and will favor similar recipes.
- **Thumbs down:** Recipe is excluded from all future recommendations.

**Rating prompt:** A gentle, non-intrusive nudge — either a banner on the home screen the day after, or an inline prompt when the user next opens the app. Not a blocking modal.

If the user skips the rating, the recipe is treated as neutral (can be recommended again, but not prioritized).

---

### 6. Meal History (v1.1 — Post-Launch)

A browsable log of past meals. Not critical for v1, but the data structure should support it from day one.

**Future features:**
- View by week, month, or all-time
- Filter by protein, rating, tags
- "Cook again" shortcut (adds to next week's plan)
- Search past meals

---

## Technical Architecture

### Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js (App Router) | PWA-capable, good mobile experience, server-side API routes for Anthropic calls |
| Styling | Tailwind CSS | Rapid iteration, design token friendly |
| Database | Supabase (Postgres) | Auth, real-time sync (both household members see same plan), generous free tier |
| AI/Recipes | Anthropic API (Claude) with web search | Searches Allrecipes.com for recipes matching user criteria, returns structured recipe data + source links |
| Deployment | Vercel | Free tier sufficient, seamless Next.js integration |
| Install | PWA | Installable on home screen, no app store needed |

### Data Model

**users**
- id (uuid, PK)
- email
- household_id (FK → households)
- created_at

**households**
- id (uuid, PK)
- name
- default_servings (int, default 4)
- spice_tolerance (enum: none, mild, medium, hot — default mild)
- dietary_goals (text[] — array of selected goals)
- recipe_style_preferences (text[] — array of selected styles)
- excluded_ingredients (text[] — free-text exclusions)
- created_at

**staple_items**
- id (uuid, PK)
- household_id (FK)
- name (text)
- category (enum: oils, spices, grains, canned, condiments, frozen, dairy_basics, other)
- created_at

**kitchen_tools**
- id (uuid, PK)
- household_id (FK)
- name (text)
- created_at

**on_hand_items**
- id (uuid, PK)
- household_id (FK)
- name (text)
- quantity (text, optional — e.g., "2 lbs", "1 bunch")
- meal_plan_id (FK, nullable — ties item to the plan it was added for; cleared when plan is confirmed)
- created_at

**meal_plans**
- id (uuid, PK)
- household_id (FK)
- week_start (date — Monday of the plan week)
- status (enum: draft, confirmed)
- created_at

**meal_plan_days**
- id (uuid, PK)
- meal_plan_id (FK)
- day_of_week (int, 0=Mon … 6=Sun)
- option_a (jsonb — recipe object: title, url, image, prep_time, cook_time, description, ingredients, tags)
- option_b (jsonb — recipe object)
- selected_option (enum: a, b, skip, null)
- status (enum: pending, selected, skipped)

**recipe_ratings**
- id (uuid, PK)
- household_id (FK)
- recipe_url (text — Allrecipes URL as unique identifier)
- recipe_title (text)
- rating (enum: up, down)
- cooked_date (date)
- created_at

**grocery_lists**
- id (uuid, PK)
- meal_plan_id (FK)
- created_at

**grocery_items**
- id (uuid, PK)
- grocery_list_id (FK)
- name (text)
- quantity (numeric)
- unit (text)
- aisle_category (enum: produce, meat, dairy, bakery, canned, frozen, grains, snacks, misc)
- source_recipes (text[] — which recipe(s) need this item)
- is_manual (bool — user-added, not from recipe)
- checked (bool, default false)

---

## User Flows

### Flow 1: First-Time Setup
1. Sign up / log in
2. Create or join household
3. Add staple items (guided, with suggestions)
4. Add kitchen tools (checklist)
5. Set household preferences (dietary goals, recipe style, spice, exclusions)
6. Land on home screen → CTA: "Generate Your First Meal Plan"

### Flow 2: Weekly Plan Generation
1. Tap "Generate This Week's Plan"
2. Optional prompt: "Anything on hand you want to use this week?" — user adds temporary items (chicken thighs, broccoli, etc.) or skips
3. App calls Anthropic API with all household context (staples, on-hand items, tools, preferences, history)
4. Plan appears: 7 days × 2 options each
5. User reviews, selects preferred option per day (or regenerates)
6. User confirms plan
7. Grocery list auto-generates (excluding staples and on-hand items)
8. Selected recipes added to meal history; unused on-hand items cleared

### Flow 3: Shopping
1. Open grocery list
2. Check off items while shopping
3. Optionally add manual items
4. Optionally export/share list

### Flow 4: Post-Meal Rating
1. After planned cook date, app shows gentle rating prompt
2. User taps thumbs up or thumbs down (or dismisses)
3. Rating stored, informs future recommendations

---

## Build Milestones

Each milestone is scoped to a single Claude Code session and results in something testable.

### Milestone 1: Project Scaffold
Next.js (App Router) + Tailwind + Supabase setup. Auth (email login), household creation, environment variables, CLAUDE.md with design spec and conventions. **Testable:** user can sign up, log in, and land on an empty home screen.

### Milestone 2: Kitchen Setup — Staple Items
Searchable input with category-grouped suggestions, add/remove staples, persist to Supabase. **Testable:** user can add staples during onboarding and see them saved in their profile.

### Milestone 3: Kitchen Setup — Tools & Preferences
Kitchen tools checklist, household preferences (dietary goals, recipe styles, spice tolerance, exclusions), default serving size. **Testable:** user can complete full onboarding flow end-to-end.

### Milestone 4: Settings / Kitchen Profile Screen
Editable view of staples, tools, and preferences outside of onboarding. **Testable:** user can update any setting and changes persist.

### Milestone 5: Meal Plan Generation — API Integration ⚠️ Highest Risk
On-hand items input (optional pre-generation step), Anthropic API call with web search to find Allrecipes recipes, return 7 days × 2 options as structured data, display recipe cards. **Testable:** user can add on-hand items, tap generate, and see 14 recipe cards with titles, times, ingredients, and Allrecipes links.

### Milestone 6: Plan Editing & Confirmation
Select one option per day (highlight/dim), regenerate per day, skip days, confirm plan. **Testable:** user can curate their week and lock it in.

### Milestone 7: Grocery List Generation
Auto-generate from confirmed plan, exclude staples and on-hand items, aggregate quantities, group by store section. **Testable:** confirming a plan produces a correct, de-duped grocery list.

### Milestone 8: Grocery List Interactions
Check-off items, manually add items, remove items, export (clipboard, text message, share sheet). **Testable:** user can shop from the list and share it.

### Milestone 9: Recipe Rating
Post-cook rating prompt (thumbs up/down), store ratings, wire ratings into plan generation logic (exclude thumbs-down, favor thumbs-up, avoid recent meals). **Testable:** rating a recipe changes future recommendations.

### Milestone 10: PWA & Polish
Service worker, manifest, installable on home screen. Loading states, empty states, error handling, responsive tweaks. **Testable:** app installs on phone and handles edge cases gracefully.

---

## Risk Assessment

**1. Anthropic API recipe quality is unpredictable.** Web search to find Allrecipes recipes matching a complex set of constraints (staples, on-hand items, tools, dietary goals, spice tolerance, history) may return non-existent recipes, hallucinated URLs, or poor matches. *Mitigation:* Store full recipe data in jsonb at generation time so the plan survives broken URLs. Build a verification step that checks returned URLs are real Allrecipes pages. Treat Milestone 5 as the highest-risk milestone and budget extra iteration time.

**2. On-hand items matching is fuzzy.** A user types "chicken" — does that match a recipe calling for "boneless skinless chicken thighs"? Ingredient matching between free-text input and recipe ingredient lists is inherently imprecise. *Mitigation:* Let the Anthropic API handle semantic matching rather than doing string comparison. When generating the grocery list, send staples + on-hand items alongside recipe ingredients and have the API determine what needs to be purchased.

**3. Scope creep into recipe browsing/discovery.** Once plan generation works, the urge to add "show me more like this," search, filtering, and favorites will be strong — but that's a different product. *Mitigation:* The Out of Scope section is the shield. The meal history data structure is already there for v1.1.

---

## Out of Scope for v1

- Breakfast and lunch planning
- Nutrition/macro tracking
- Recipe creation or manual entry (all recipes sourced from Allrecipes)
- Multiple recipe sources (Allrecipes only for v1)
- Browsable meal history UI (data captured, UI deferred)
- Social features (sharing plans with friends/family outside household)
- Integration with grocery delivery services
- Barcode scanning for pantry management
- Cost estimation or budgeting

---

## Open Questions

1. **Household invites:** How does the second household member join? Email invite link? Shared code? (Recommend: simple invite link via Supabase auth)
2. **Offline support:** How much PWA offline functionality is needed? (Recommend: cache the current week's plan and grocery list for offline viewing; generation requires connectivity)
3. **Recipe data freshness:** Allrecipes URLs can change or recipes can be removed. How do we handle broken links? (Recommend: store full recipe data in jsonb at generation time so the plan survives even if the source URL breaks; link is a convenience, not a dependency)
