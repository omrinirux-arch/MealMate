import { tokens } from "@/lib/tokens";

const STEP_LABELS = ["Staples", "Tools", "Preferences"] as const;

export function OnboardingProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div>
      <span
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: 600,
          color: tokens.colors.neutral[500],
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Step {step} of 3
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: i + 1 === step ? 600 : 400,
                color:
                  i + 1 === step
                    ? tokens.colors.primary[600]
                    : tokens.colors.neutral[400],
                display: "block",
              }}
            >
              {label}
            </span>
            <div
              style={{
                height: 4,
                borderRadius: 9999,
                background:
                  i + 1 <= step
                    ? tokens.colors.primary[500]
                    : tokens.colors.neutral[200],
                transition: "all 0.3s ease",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
