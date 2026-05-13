// Deterministic gradient + emoji for Claude-generated recipes (no image_url).
// Pass the recipe title and optional tags; always returns the same result for
// the same input so cards never "flicker" between renders.

export interface RecipeVisual {
  emoji: string;
  gradient: string;
}

// ── Keyword rules (checked in order — first match wins) ──────────────────────

const RULES: Array<{ keywords: string[]; emoji: string; gradient: string }> = [
  {
    keywords: ["chicken", "turkey", "poultry", "hen", "drumstick", "wing"],
    emoji: "🍗",
    gradient: "linear-gradient(135deg, #FF9A5C 0%, #E8733A 100%)",
  },
  {
    keywords: ["beef", "steak", "brisket", "burger", "meatball", "ground beef", "sirloin", "ribeye", "flank"],
    emoji: "🥩",
    gradient: "linear-gradient(135deg, #C45C5C 0%, #9A3232 100%)",
  },
  {
    keywords: ["salmon", "tuna", "cod", "tilapia", "halibut", "fish", "snapper", "bass", "mahi", "trout", "swordfish"],
    emoji: "🐟",
    gradient: "linear-gradient(135deg, #5BA4CF 0%, #2E7AB0 100%)",
  },
  {
    keywords: ["shrimp", "prawn", "scallop", "lobster", "crab", "clam", "mussel", "squid", "calamari", "seafood"],
    emoji: "🦐",
    gradient: "linear-gradient(135deg, #FF8B6B 0%, #E05A3A 100%)",
  },
  {
    keywords: ["pork", "bacon", "ham", "ribs", "chorizo", "sausage", "pancetta", "prosciutto"],
    emoji: "🥓",
    gradient: "linear-gradient(135deg, #E89090 0%, #C45C5C 100%)",
  },
  {
    keywords: ["lamb", "mutton"],
    emoji: "🫕",
    gradient: "linear-gradient(135deg, #C4956A 0%, #9A6A42 100%)",
  },
  {
    keywords: ["pasta", "spaghetti", "penne", "fettuccine", "linguine", "noodle", "lasagna", "rigatoni", "gnocchi", "orzo", "carbonara", "bolognese"],
    emoji: "🍝",
    gradient: "linear-gradient(135deg, #E8C56A 0%, #C4933A 100%)",
  },
  {
    keywords: ["taco", "burrito", "enchilada", "quesadilla", "fajita"],
    emoji: "🌮",
    gradient: "linear-gradient(135deg, #F4A442 0%, #E07A1A 100%)",
  },
  {
    keywords: ["curry", "tikka", "masala", "korma", "vindaloo"],
    emoji: "🍛",
    gradient: "linear-gradient(135deg, #F4A84A 0%, #D4761A 100%)",
  },
  {
    keywords: ["soup", "stew", "chili", "chowder", "bisque", "broth", "ramen", "pho", "minestrone", "goulash", "tagine"],
    emoji: "🍲",
    gradient: "linear-gradient(135deg, #C49A5A 0%, #9A6A2A 100%)",
  },
  {
    keywords: ["pizza"],
    emoji: "🍕",
    gradient: "linear-gradient(135deg, #E85A4A 0%, #C43A2A 100%)",
  },
  {
    keywords: ["stir fry", "stir-fry", "fried rice", "pad thai", "bok choy"],
    emoji: "🥢",
    gradient: "linear-gradient(135deg, #8EC48E 0%, #5A9A5A 100%)",
  },
  {
    keywords: ["rice", "risotto", "pilaf", "paella", "biryani"],
    emoji: "🍚",
    gradient: "linear-gradient(135deg, #A8C89A 0%, #7A9E6C 100%)",
  },
  {
    keywords: ["egg", "frittata", "omelette", "omelet", "quiche", "shakshuka"],
    emoji: "🍳",
    gradient: "linear-gradient(135deg, #F4D44A 0%, #E4A81A 100%)",
  },
  {
    keywords: ["tofu", "tempeh", "lentil", "chickpea", "falafel", "veggie", "vegetable", "vegan", "plant-based"],
    emoji: "🥗",
    gradient: "linear-gradient(135deg, #5BA85B 0%, #3A7A3A 100%)",
  },
  {
    keywords: ["salad", "slaw", "bowl"],
    emoji: "🥙",
    gradient: "linear-gradient(135deg, #7AC47A 0%, #4A9A4A 100%)",
  },
  {
    keywords: ["sandwich", "wrap", "pita", "sub", "hoagie"],
    emoji: "🥪",
    gradient: "linear-gradient(135deg, #C4A87A 0%, #9A7A4A 100%)",
  },
];

// ── Fallback gradients (picked by hashing the title) ─────────────────────────

const FALLBACK: string[] = [
  "linear-gradient(135deg, #7AA8C4 0%, #4A7A9A 100%)", // slate blue
  "linear-gradient(135deg, #8AC47A 0%, #5A9A4A 100%)", // sage green
  "linear-gradient(135deg, #C4A87A 0%, #9A7A4A 100%)", // warm tan
  "linear-gradient(135deg, #A87AC4 0%, #7A4A9A 100%)", // soft purple
  "linear-gradient(135deg, #C47A8A 0%, #9A4A5A 100%)", // dusty rose
  "linear-gradient(135deg, #7AC4C4 0%, #4A9A9A 100%)", // teal
];

function hashTitle(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (Math.imul(31, h) + title.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getRecipeVisual(title: string, tags: string[] = []): RecipeVisual {
  const haystack = `${title} ${tags.join(" ")}`.toLowerCase();

  for (const rule of RULES) {
    if (rule.keywords.some((k) => haystack.includes(k))) {
      return { emoji: rule.emoji, gradient: rule.gradient };
    }
  }

  const idx = hashTitle(title) % FALLBACK.length;
  return { emoji: "🍽️", gradient: FALLBACK[idx] };
}
