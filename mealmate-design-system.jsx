import { useState } from "react";

const tokens = {
  colors: {
    // Primary - warm sage green (grounding, organic, not clinical)
    primary: {
      50: "#f4f7f4",
      100: "#e4ebe4",
      200: "#c9d8c9",
      300: "#a3bda3",
      400: "#7a9e7a",
      500: "#5a8a5a",
      600: "#4a7a4a",
      700: "#3d633d",
      800: "#334f33",
      900: "#2a422a",
    },
    // Secondary - warm terracotta (appetizing, earthy accent)
    secondary: {
      50: "#fdf5f0",
      100: "#fae8dc",
      200: "#f4cdb5",
      300: "#edae88",
      400: "#e08c5a",
      500: "#d4723e",
      600: "#bf5c2e",
      700: "#9e4a27",
      800: "#7f3d24",
      900: "#663320",
    },
    // Neutrals - warm gray with a hint of brown
    neutral: {
      0: "#ffffff",
      50: "#faf8f6",
      100: "#f3f0ec",
      200: "#e8e3dd",
      300: "#d4cdc4",
      400: "#b5aca0",
      500: "#968b7d",
      600: "#7a6f63",
      700: "#615851",
      800: "#4a4340",
      900: "#352f2d",
      950: "#1e1b19",
    },
    // Semantic
    success: "#5a8a5a",
    warning: "#d4a03e",
    error: "#c44e4e",
    info: "#5a7a9e",
  },
  typography: {
    fontFamily: {
      heading: "'DM Sans', sans-serif",
      body: "'DM Sans', sans-serif",
    },
    scale: {
      xs: { size: "0.75rem", lineHeight: "1rem", weight: 400 },
      sm: { size: "0.875rem", lineHeight: "1.25rem", weight: 400 },
      base: { size: "1rem", lineHeight: "1.5rem", weight: 400 },
      lg: { size: "1.125rem", lineHeight: "1.75rem", weight: 500 },
      xl: { size: "1.25rem", lineHeight: "1.75rem", weight: 600 },
      "2xl": { size: "1.5rem", lineHeight: "2rem", weight: 600 },
      "3xl": { size: "1.875rem", lineHeight: "2.25rem", weight: 700 },
    },
  },
  spacing: {
    unit: "4px (base unit, 4px grid)",
    scale: {
      1: "4px",
      2: "8px",
      3: "12px",
      4: "16px",
      5: "20px",
      6: "24px",
      8: "32px",
      10: "40px",
      12: "48px",
      16: "64px",
    },
  },
  radius: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "20px",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 3px rgba(53, 47, 45, 0.06), 0 1px 2px rgba(53, 47, 45, 0.04)",
    md: "0 4px 12px rgba(53, 47, 45, 0.08), 0 2px 4px rgba(53, 47, 45, 0.04)",
    lg: "0 8px 24px rgba(53, 47, 45, 0.10), 0 4px 8px rgba(53, 47, 45, 0.05)",
  },
};

function ColorSwatch({ name, hex, dark }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex-shrink-0"
        style={{
          backgroundColor: hex,
          boxShadow: tokens.shadows.sm,
        }}
      />
      <div>
        <div className="text-sm font-medium" style={{ color: tokens.colors.neutral[900] }}>
          {name}
        </div>
        <div className="text-xs" style={{ color: tokens.colors.neutral[500] }}>
          {hex}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2
        className="text-lg font-semibold mb-4 pb-2"
        style={{
          color: tokens.colors.neutral[900],
          borderBottom: `2px solid ${tokens.colors.neutral[200]}`,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function SampleRecipeCard() {
  const [selected, setSelected] = useState(false);
  return (
    <div
      onClick={() => setSelected(!selected)}
      className="cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: tokens.colors.neutral[0],
        borderRadius: tokens.radius.lg,
        boxShadow: selected ? `0 0 0 2px ${tokens.colors.primary[500]}, ${tokens.shadows.md}` : tokens.shadows.md,
        padding: "16px",
        maxWidth: "320px",
        opacity: selected ? 1 : 0.85,
        transform: selected ? "scale(1)" : "scale(0.98)",
        transition: "all 0.2s ease",
      }}
    >
      <div
        className="w-full h-36 rounded-lg mb-3"
        style={{
          backgroundColor: tokens.colors.neutral[200],
          borderRadius: tokens.radius.md,
          backgroundImage: `linear-gradient(135deg, ${tokens.colors.neutral[200]}, ${tokens.colors.neutral[100]})`,
        }}
      />
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold text-base" style={{ color: tokens.colors.neutral[900] }}>
          Honey Garlic Salmon
        </h3>
        {selected && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: tokens.colors.primary[100],
              color: tokens.colors.primary[700],
            }}
          >
            Selected
          </span>
        )}
      </div>
      <p className="text-sm mb-3" style={{ color: tokens.colors.neutral[500] }}>
        25 min · Sheet pan · High protein
      </p>
      <div className="flex flex-wrap gap-1.5">
        {["salmon", "honey", "garlic", "soy sauce", "broccoli"].map((ing, i) => (
          <span
            key={i}
            className="text-xs px-2 py-1 rounded-full"
            style={{
              backgroundColor: i >= 3 ? tokens.colors.primary[50] : tokens.colors.neutral[100],
              color: i >= 3 ? tokens.colors.primary[700] : tokens.colors.neutral[600],
              border: i >= 3 ? `1px solid ${tokens.colors.primary[200]}` : `1px solid ${tokens.colors.neutral[200]}`,
            }}
          >
            {i >= 3 ? "✓ " : ""}
            {ing}
          </span>
        ))}
      </div>
    </div>
  );
}

function SampleButton({ variant = "primary", children }) {
  const styles = {
    primary: {
      backgroundColor: tokens.colors.primary[600],
      color: "#fff",
      border: "none",
      boxShadow: tokens.shadows.sm,
    },
    secondary: {
      backgroundColor: tokens.colors.neutral[0],
      color: tokens.colors.neutral[800],
      border: `1px solid ${tokens.colors.neutral[300]}`,
    },
    ghost: {
      backgroundColor: "transparent",
      color: tokens.colors.primary[600],
      border: "none",
    },
    accent: {
      backgroundColor: tokens.colors.secondary[500],
      color: "#fff",
      border: "none",
      boxShadow: tokens.shadows.sm,
    },
  };
  return (
    <button
      className="px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 hover:opacity-90"
      style={{
        ...styles[variant],
        borderRadius: tokens.radius.md,
      }}
    >
      {children}
    </button>
  );
}

function SampleGroceryItem({ name, quantity, recipe, checked = false }) {
  const [isChecked, setIsChecked] = useState(checked);
  return (
    <div
      onClick={() => setIsChecked(!isChecked)}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150"
      style={{
        backgroundColor: isChecked ? tokens.colors.neutral[50] : tokens.colors.neutral[0],
        borderBottom: `1px solid ${tokens.colors.neutral[100]}`,
        opacity: isChecked ? 0.5 : 1,
      }}
    >
      <div
        className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all"
        style={{
          backgroundColor: isChecked ? tokens.colors.primary[500] : tokens.colors.neutral[0],
          border: isChecked ? "none" : `2px solid ${tokens.colors.neutral[300]}`,
          borderRadius: tokens.radius.sm,
        }}
      >
        {isChecked && <span className="text-white text-xs">✓</span>}
      </div>
      <div className="flex-1">
        <span
          className="text-sm font-medium"
          style={{
            color: tokens.colors.neutral[900],
            textDecoration: isChecked ? "line-through" : "none",
          }}
        >
          {name}
        </span>
        <span className="text-sm ml-2" style={{ color: tokens.colors.neutral[500] }}>
          {quantity}
        </span>
      </div>
      <span className="text-xs" style={{ color: tokens.colors.neutral[400] }}>
        {recipe}
      </span>
    </div>
  );
}

function SampleChip({ label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-150"
      style={{
        backgroundColor: active ? tokens.colors.primary[600] : tokens.colors.neutral[0],
        color: active ? "#fff" : tokens.colors.neutral[700],
        border: active ? "none" : `1px solid ${tokens.colors.neutral[300]}`,
        boxShadow: active ? tokens.shadows.sm : "none",
      }}
    >
      {label}
    </button>
  );
}

export default function MealMateDesignSystem() {
  const [activeChips, setActiveChips] = useState(new Set(["Quick & easy", "High protein"]));

  const toggleChip = (label) => {
    setActiveChips((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  return (
    <div
      className="min-h-screen p-6 md:p-10"
      style={{
        backgroundColor: tokens.colors.neutral[50],
        fontFamily: tokens.typography.fontFamily.body,
        color: tokens.colors.neutral[900],
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: tokens.colors.neutral[900] }}
          >
            MealMate
          </h1>
          <p className="text-base" style={{ color: tokens.colors.neutral[500] }}>
            Design System — Tokens, Components & Patterns
          </p>
        </div>

        {/* Colors */}
        <Section title="Color Palette">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: tokens.colors.neutral[600] }}>
                Primary — Sage Green
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[50, 100, 200, 400, 500, 600, 700, 800, 900].map((n) => (
                  <ColorSwatch key={n} name={`P-${n}`} hex={tokens.colors.primary[n]} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: tokens.colors.neutral[600] }}>
                Secondary — Terracotta
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[50, 100, 200, 400, 500, 600, 700, 800, 900].map((n) => (
                  <ColorSwatch key={n} name={`S-${n}`} hex={tokens.colors.secondary[n]} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: tokens.colors.neutral[600] }}>
                Neutrals — Warm Gray
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[0, 50, 100, 200, 300, 400, 500, 600, 700, 900].map((n) => (
                  <ColorSwatch key={n} name={`N-${n}`} hex={tokens.colors.neutral[n]} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: tokens.colors.neutral[600] }}>
                Semantic
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ColorSwatch name="Success" hex={tokens.colors.success} />
                <ColorSwatch name="Warning" hex={tokens.colors.warning} />
                <ColorSwatch name="Error" hex={tokens.colors.error} />
                <ColorSwatch name="Info" hex={tokens.colors.info} />
              </div>
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-4">
            {Object.entries(tokens.typography.scale).map(([name, { size, lineHeight, weight }]) => (
              <div key={name} className="flex items-baseline gap-4">
                <span
                  className="w-10 text-xs text-right flex-shrink-0"
                  style={{ color: tokens.colors.neutral[400] }}
                >
                  {name}
                </span>
                <span style={{ fontSize: size, lineHeight, fontWeight: weight, color: tokens.colors.neutral[900] }}>
                  The quick brown fox
                </span>
                <span className="text-xs" style={{ color: tokens.colors.neutral[400] }}>
                  {size} / {weight}
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm mt-4" style={{ color: tokens.colors.neutral[500] }}>
            Font: DM Sans — clean, modern, warm. Used for both headings and body.
          </p>
        </Section>

        {/* Spacing & Radius */}
        <Section title="Spacing & Radius">
          <div className="flex items-end gap-2 mb-6">
            {[1, 2, 3, 4, 6, 8, 10, 12].map((n) => (
              <div key={n} className="flex flex-col items-center gap-1">
                <div
                  style={{
                    width: `${n * 4}px`,
                    height: `${n * 4}px`,
                    backgroundColor: tokens.colors.primary[300],
                    borderRadius: "2px",
                  }}
                />
                <span className="text-xs" style={{ color: tokens.colors.neutral[400] }}>
                  {n * 4}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            {Object.entries(tokens.radius).filter(([k]) => k !== "full").map(([name, val]) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div
                  className="w-12 h-12"
                  style={{
                    border: `2px solid ${tokens.colors.neutral[300]}`,
                    borderRadius: val,
                  }}
                />
                <span className="text-xs" style={{ color: tokens.colors.neutral[400] }}>
                  {name} · {val}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Shadows */}
        <Section title="Elevation (Shadows)">
          <div className="flex gap-6">
            {Object.entries(tokens.shadows).map(([name, val]) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div
                  className="w-20 h-20 rounded-xl"
                  style={{
                    backgroundColor: tokens.colors.neutral[0],
                    boxShadow: val,
                    borderRadius: tokens.radius.lg,
                  }}
                />
                <span className="text-xs" style={{ color: tokens.colors.neutral[400] }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <SampleButton variant="primary">Generate Plan</SampleButton>
            <SampleButton variant="accent">Confirm Week</SampleButton>
            <SampleButton variant="secondary">Regenerate</SampleButton>
            <SampleButton variant="ghost">Skip Day</SampleButton>
          </div>
        </Section>

        {/* Chips / Preference Toggles */}
        <Section title="Preference Chips">
          <div className="flex flex-wrap gap-2">
            {["Quick & easy", "One-pot", "High protein", "Kid-friendly", "Meal prep"].map((label) => (
              <SampleChip
                key={label}
                label={label}
                active={activeChips.has(label)}
                onClick={() => toggleChip(label)}
              />
            ))}
          </div>
        </Section>

        {/* Recipe Card */}
        <Section title="Recipe Card">
          <p className="text-sm mb-4" style={{ color: tokens.colors.neutral[500] }}>
            Tap to select. Green-highlighted ingredients are ones you already have.
          </p>
          <SampleRecipeCard />
        </Section>

        {/* Grocery Item */}
        <Section title="Grocery List Item">
          <div
            className="rounded-xl overflow-hidden"
            style={{
              boxShadow: tokens.shadows.sm,
              backgroundColor: tokens.colors.neutral[0],
            }}
          >
            <SampleGroceryItem name="Salmon fillets" quantity="4 × 6oz" recipe="Honey Garlic Salmon" />
            <SampleGroceryItem name="Broccoli" quantity="2 heads" recipe="Honey Garlic Salmon" />
            <SampleGroceryItem name="Jasmine rice" quantity="2 cups" recipe="Salmon · Stir Fry" checked />
          </div>
        </Section>

        {/* Token Summary */}
        <Section title="Token Reference">
          <div
            className="rounded-xl p-5 text-sm space-y-3"
            style={{
              backgroundColor: tokens.colors.neutral[100],
              fontFamily: "monospace",
              color: tokens.colors.neutral[700],
            }}
          >
            <div><strong>Font:</strong> DM Sans (heading + body)</div>
            <div><strong>Grid:</strong> 4px base unit</div>
            <div><strong>Primary:</strong> Sage green — #5a8a5a (P-500)</div>
            <div><strong>Secondary:</strong> Terracotta — #d4723e (S-500)</div>
            <div><strong>Background:</strong> Warm off-white — #faf8f6 (N-50)</div>
            <div><strong>Card bg:</strong> White — #ffffff (N-0)</div>
            <div><strong>Text primary:</strong> #352f2d (N-900)</div>
            <div><strong>Text secondary:</strong> #968b7d (N-500)</div>
            <div><strong>Borders:</strong> #d4cdc4 (N-300)</div>
            <div><strong>Card radius:</strong> 14px (lg)</div>
            <div><strong>Card shadow:</strong> md elevation</div>
            <div><strong>Button radius:</strong> 10px (md)</div>
          </div>
        </Section>
      </div>
    </div>
  );
}
