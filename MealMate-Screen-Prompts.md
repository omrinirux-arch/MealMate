# MealMate — Screen Design Prompts

Upload both `PRD-MealPlanApp.md` and `mealmate-design-system.jsx` to the conversation before using these prompts. Each prompt is designed for a single message in Claude.

---

## Screen 1: Home Screen — Empty State

I'm designing a meal planning app called MealMate. The attached PRD has the full product spec and the attached JSX file is my design system with all tokens and component patterns.

Using this design system (sage green primary, terracotta accent, DM Sans, warm off-white background, tactile cards with md shadows), create a React artifact for the **home screen in its empty state** — this is what a first-time user sees after completing onboarding but before generating their first meal plan.

It should include:
- A warm, simple greeting (e.g., "Ready to plan your week?")
- A prominent CTA button: "Generate Your First Meal Plan"
- A subtle summary of their setup (e.g., "12 staples · 3 tools · Preferences set") so they know their profile is active
- Bottom navigation with icons for: Home, Grocery List, Settings
- Mobile-first layout (max-width 390px centered)

Show the empty state only — no plan data. The mood should feel calm and inviting, not empty or broken.

---

## Screen 2: Onboarding — Staple Items

Using the attached PRD and design system, create a React artifact for the **staple items onboarding screen** — this is step 1 of 3 in the first-time setup flow.

It should include:
- A progress indicator showing step 1 of 3
- A heading like "What's always in your kitchen?"
- Category groups (oils & vinegars, spices & seasonings, grains & pasta, canned goods, condiments & sauces, freezer staples, dairy & eggs basics) with common suggestions as tappable chips under each category
- A search/text input at the top to add custom items
- Selected items should show as a collected list or summary at the bottom (or as filled/highlighted chips)
- A "Next" button to proceed to step 2
- Mobile-first layout (max-width 390px centered)

Use the design system chips pattern for the selectable items. Make it feel like a quick, guided flow — not a form.

---

## Screen 3: Onboarding — Kitchen Tools

Using the attached PRD and design system, create a React artifact for the **kitchen tools onboarding screen** — this is step 2 of 3 in the first-time setup flow.

It should include:
- A progress indicator showing step 2 of 3
- A heading like "What tools do you cook with?"
- A checklist of common tools: Instant Pot, air fryer, slow cooker, grill, wok, Dutch oven, food processor, stand mixer, sous vide, smoker, sheet pans
- Each tool as a tappable card or checkbox row — selected state should feel satisfying (checkmark + highlight)
- A text input to add custom tools
- A note that basic tools (stovetop, oven, pots/pans, knives) are assumed
- Back and Next buttons
- Mobile-first layout (max-width 390px centered)

Keep it simple — this is the fastest step in onboarding.

---

## Screen 4: Onboarding — Household Preferences

Using the attached PRD and design system, create a React artifact for the **household preferences onboarding screen** — this is step 3 of 3 in the first-time setup flow.

It should include:
- A progress indicator showing step 3 of 3
- Sections for:
  - **Dietary goals** (multi-select chips): Lower cholesterol, Lose weight, Build muscle / high protein, Heart healthy, Low sodium, Balanced / no specific goal
  - **Recipe style** (multi-select chips): Quick and easy (under 30 min), One-pan / one-pot, Meal prep friendly, More involved / weekend project, Kid-friendly / mild flavors
  - **Spice tolerance** (single select): None, Mild (default selected), Medium, Hot
  - **Excluded ingredients** (free-text input): placeholder "e.g., mushrooms, shellfish"
- Back button and a "Finish Setup" CTA button
- Mobile-first layout (max-width 390px centered)

Group the sections clearly with subtle headings. This is the most content-dense onboarding step, so spacing and hierarchy matter — it should still feel calm, not like a medical intake form.

---

## Screen 5: On-Hand Items Input

Using the attached PRD and design system, create a React artifact for the **on-hand items input screen** — this appears after the user taps "Generate This Week's Plan" and before the plan actually generates.

It should include:
- A heading like "Anything on hand you want to use this week?"
- A brief subtitle explaining the purpose (e.g., "We'll prioritize recipes that use these up")
- A simple text input to add items one at a time (e.g., "chicken thighs," "broccoli," "feta")
- Added items displayed as removable chips/tags below the input
- Two CTAs at the bottom: "Skip" (ghost style) and "Generate Plan" (primary style)
- Mobile-first layout (max-width 390px centered)

This should feel optional and lightweight — not a required step. The user should feel comfortable skipping it entirely.

---

## Screen 6: Weekly Plan View — Selection State

Using the attached PRD and design system, create a React artifact for the **weekly meal plan screen** showing the plan after generation with interactive selection.

It should include:
- A header: "This Week's Plan" with the date range (e.g., "Apr 27 – May 3")
- 7 day sections (Monday–Sunday), each showing:
  - Day label
  - 2 recipe option cards side by side (or stacked on mobile)
  - Each card shows: recipe title, prep + cook time, 2-3 key tags, a brief ingredient preview
  - Tapping a card selects it (highlighted border, full opacity) and dims the other
  - A small refresh/regenerate icon button per day
- Show a mix of states: some days with a selection made, some still unselected
- A sticky bottom bar with "Confirm Plan" button (disabled until all days are selected or skipped)
- A way to mark a day as "Skip" (eating out / leftovers)
- Mobile-first layout (max-width 390px centered), scrollable

This is the most important screen in the app — it needs to feel scannable at a glance. Use the recipe card pattern from the design system. The selected vs. unselected state should be immediately obvious.

---

## Screen 7: Grocery List

Using the attached PRD and design system, create a React artifact for the **grocery list screen** after a plan has been confirmed.

It should include:
- A header: "Grocery List" with a subtle item count (e.g., "18 items")
- Items grouped by store section with section headers: Produce, Meat & seafood, Dairy & eggs, Canned & jarred, Grains/pasta/rice, etc.
- Each item row shows: checkbox, ingredient name, quantity + unit, and a subtle note of which recipe(s) it's for
- Tapping an item checks it off (strikethrough, dimmed, checkbox filled with primary green)
- A floating "+" button or input to manually add items
- An export/share button in the header area (clipboard, text, share sheet)
- Show a mix of checked and unchecked items
- Mobile-first layout (max-width 390px centered)

Use the grocery list item pattern from the design system. This screen needs to work well one-handed in a grocery store — tap targets should be generous.

---

## Screen 8: Recipe Rating Prompt

Using the attached PRD and design system, create a React artifact showing the **recipe rating prompt** — this appears as an inline banner or card on the home screen the day after a planned meal.

It should include:
- A card or banner that feels gentle and non-intrusive (not a blocking modal)
- The recipe name (e.g., "How was the Honey Garlic Salmon?")
- Two large, tappable buttons: thumbs up and thumbs down
- A dismiss/skip option (subtle "Not now" text link)
- If there are multiple unrated recipes, show one at a time
- Mobile-first layout (max-width 390px centered)

This should feel like a friendly nudge, not a chore. Keep it compact — it sits on the home screen alongside other content.

---

## Screen 9: Settings / Kitchen Profile

Using the attached PRD and design system, create a React artifact for the **settings / kitchen profile screen** where users can edit their setup anytime.

It should include:
- Sections for:
  - **Staple Items** — displayed as chips with "×" to remove, plus an input to add more. Grouped by category.
  - **Kitchen Tools** — displayed as a list with checkmarks, toggleable
  - **Household Preferences** — dietary goals, recipe styles, spice tolerance, exclusions (same layout as onboarding but in edit mode)
  - **Serving Size** — showing "4 servings" with ability to adjust
- Each section collapsible or clearly separated with headings
- Back/home navigation
- Mobile-first layout (max-width 390px centered)

This is a reference screen, not a flow — it should feel organized and scannable. The user will come here occasionally to tweak things, not daily.

---

## Screen 10: Home Screen — Active Plan State

Using the attached PRD and design system, create a React artifact for the **home screen with an active confirmed plan** — this is what the user sees most days of the week.

It should include:
- A greeting with context (e.g., "Tonight's dinner")
- Tonight's confirmed recipe as a prominent card: title, image placeholder, prep + cook time, key ingredients, link to full recipe on Allrecipes
- A quick glance at the rest of the week below (compact list of upcoming days + recipe names)
- A "View Grocery List" shortcut button
- Any pending rating prompts (if yesterday's meal hasn't been rated, show the rating card from Screen 8 above the main content)
- Bottom navigation: Home (active), Grocery List, Settings
- Mobile-first layout (max-width 390px centered)

This is the daily landing screen — it should answer "what's for dinner tonight?" at a glance without any tapping.
