import { tokens } from "@/lib/tokens";

function SkeletonLine({ width, height = 14 }: { width: string; height?: number }) {
  return (
    <div style={{ width, height, borderRadius: 6, background: tokens.colors.neutral[200] }} />
  );
}

export default function GroceryLoading() {
  return (
    <div style={{ background: tokens.colors.neutral[50], minHeight: "calc(100vh - 72px)", paddingBottom: 96 }}>
      {/* Header skeleton */}
      <div style={{
        padding: "32px 20px 16px",
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
        background: tokens.colors.neutral[0],
        display: "flex", flexDirection: "column", gap: 8, marginBottom: 8,
      }}>
        <SkeletonLine width="60px" height={12} />
        <SkeletonLine width="140px" height={22} />
        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 9999, background: tokens.colors.neutral[200], marginTop: 4 }} />
      </div>
      {/* Item rows */}
      {["Produce", "Meat", "Dairy"].map((section) => (
        <div key={section} style={{ padding: "16px 20px 0" }}>
          <SkeletonLine width="80px" height={11} />
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 1 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 0",
                borderBottom: `1px solid ${tokens.colors.neutral[100]}`,
              }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: tokens.colors.neutral[200], flexShrink: 0 }} />
                <SkeletonLine width={`${50 + i * 15}%`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
