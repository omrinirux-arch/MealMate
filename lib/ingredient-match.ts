// Strip leading quantities/units and trailing modifiers from a recipe ingredient
// string to get the core ingredient name for comparison.
// e.g. "2 tablespoons extra virgin olive oil, divided" → "extra virgin olive oil"
function extractCore(ingredient: string): string {
  return ingredient
    // strip parenthetical notes, e.g. "(15 oz, drained)" or "(canned)"
    .replace(/\(.*?\)/g, "")
    // strip leading numbers / fractions
    .replace(/^[\d\s\-\/\.¼½¾⅓⅔⅛⅜⅝⅞]+/, "")
    // strip measurement units
    .replace(
      /^(cups?|tablespoons?|tbsps?|teaspoons?|tsps?|ounces?|oz|pounds?|lbs?|grams?|g|ml|liters?|l|pinch|dash|handful|cloves?|slices?|pieces?|cans?|packages?|pkg|bunches?|heads?|stalks?|sprigs?)\s+/i,
      ""
    )
    // strip size/ripeness/prep descriptors that carry no ingredient identity
    .replace(/^(small|medium|large|extra-?large|xl|ripe|fresh|raw|whole|boneless|skinless|dried|canned|frozen|cooked|chopped|diced|minced|sliced|grated|shredded|crushed)\s+/i, "")
    // strip anything after a comma (e.g. ", divided" or ", peeled")
    .replace(/,.*$/, "")
    .trim()
    .toLowerCase();
}

/**
 * Returns true if `knownItem` (a staple or on-hand ingredient) satisfies
 * `recipeIngredient`. Matches in both directions:
 *  - forward: recipe ingredient string contains the known item name
 *    (e.g. "olive oil" staple matches "2 tbsp olive oil")
 *  - reverse: known item contains the recipe's core name, meaning the user
 *    has a more specific variety that covers the generic requirement
 *    (e.g. "extra virgin olive oil" staple matches recipe "olive oil")
 */
export function ingredientMatches(recipeIngredient: string, knownItem: string): boolean {
  const recipeLower = recipeIngredient.toLowerCase();
  const knownLower = knownItem.toLowerCase();

  // Exact substring match in either direction
  if (recipeLower.includes(knownLower)) return true;

  const recipeCore = extractCore(recipeIngredient);

  // Expand parenthetical qualifiers in the known item before extracting core so
  // variety info like "(black)" in "Canned beans (black)" is preserved rather
  // than stripped, preventing false matches against unrelated types (e.g. garbanzo beans).
  const knownExpanded = knownItem.replace(/\(([^)]+)\)/g, " $1").replace(/\s+/g, " ").trim();
  const knownCore = extractCore(knownExpanded);

  // Recipe core inside known item (known is a more specific variety)
  if (recipeCore.length >= 3 && knownLower.includes(recipeCore)) return true;

  // Word-set comparison — handles word-order differences and specificity:
  // all words in one core must be present in the other.
  if (recipeCore.length >= 3 && knownCore.length >= 3) {
    const rWords = new Set(recipeCore.split(/\s+/).filter(Boolean));
    const kWords = new Set(knownCore.split(/\s+/).filter(Boolean));
    if ([...rWords].every((w) => kWords.has(w))) return true;
    if ([...kWords].every((w) => rWords.has(w))) return true;
  }

  return false;
}

export function inferAisle(name: string): string {
  const n = name.toLowerCase();
  if (/\b(apple|banana|lemon|lime|orange|grapefruit|pepper|bell pepper|tomato|onion|garlic|carrot|celery|potato|sweet potato|lettuce|spinach|arugula|kale|broccoli|cauliflower|cabbage|herb|basil|cilantro|parsley|dill|rosemary|thyme|avocado|cucumber|zucchini|berry|strawberry|blueberry|mushroom|ginger|shallot|scallion|green onion|beet|radish|asparagus|corn|pea|green bean|squash|pumpkin|mango|pineapple|grape|melon|peach|plum|pear)\b/.test(n)) return "produce";
  if (/\b(chicken|beef|pork|turkey|fish|salmon|tuna|shrimp|crab|lobster|lamb|steak|ground beef|ground turkey|sausage|bacon|ham|prosciutto|salami|deli meat|seafood|duck|bison)\b/.test(n)) return "meat";
  if (/\b(milk|cream|half.and.half|butter|cheese|egg|yogurt|sour cream|cottage cheese|mozzarella|cheddar|parmesan|brie|feta|ricotta|gouda|cream cheese|mascarpone|ghee)\b/.test(n)) return "dairy";
  if (/\b(bread|bun|roll|bagel|tortilla|pita|wrap|croissant|muffin|english muffin|naan|flatbread)\b/.test(n)) return "bakery";
  if (/\b(beans|lentil|chickpea|garbanzo|black bean|kidney bean|pinto bean|white bean|tomato paste|tomato sauce|diced tomato|coconut milk|broth|stock|canned|vinegar|balsamic|olive oil|vegetable oil|canola|sesame oil|mustard|ketchup|mayo|mayonnaise|soy sauce|hot sauce|sriracha|oyster sauce|fish sauce|worcestershire|teriyaki|pasta sauce|marinara|salsa|jam|jelly|honey|maple syrup|peanut butter|almond butter|tahini)\b/.test(n)) return "canned";
  if (/\b(frozen|ice cream)\b/.test(n)) return "frozen";
  if (/\b(rice|pasta|spaghetti|penne|fusilli|noodle|flour|oat|quinoa|barley|couscous|cereal|granola|bread crumb|panko|cornmeal|polenta|bulgur|farro|wheat|grain)\b/.test(n)) return "grains";
  if (/\b(chip|cracker|pretzel|popcorn|almond|cashew|walnut|pecan|peanut|pistachio|snack|candy|chocolate|cocoa|cookie)\b/.test(n)) return "snacks";
  return "misc";
}

export function isAnyHighlighted(recipeIngredient: string, knownItems: string[]): boolean {
  return knownItems.some((item) => ingredientMatches(recipeIngredient, item));
}
