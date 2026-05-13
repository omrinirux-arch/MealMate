import { tokens } from "@/lib/tokens";

function SkeletonLine({ width, height = 14 }: { width: string; height?: number }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: 6,
      background: tokens.colors.neutral[200],
    }} />
  );
}

export default function HomeLoading() {
  return (
    <div style={{ padding: "32px 20px 24px", background: tokens.colors.neutral[50], minHeight: "calc(100vh - 72px)" }}>
      <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 8 }}>
        <SkeletonLine width="80px" height={13} />
        <SkeletonLine width="180px" height={26} />
      </div>
      {/* Date strip skeleton */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "hidden" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            flexShrink: 0,
            width: 52, height: 68,
            borderRadius: tokens.radius.lg,
            background: tokens.colors.neutral[200],
          }} />
        ))}
      </div>
      {/* Recipe card skeleton */}
      <div style={{
        background: tokens.colors.neutral[0],
        borderRadius: tokens.radius.xl,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: tokens.shadow.sm,
      }}>
        <div style={{ height: 140, borderRadius: tokens.radius.lg, background: tokens.colors.neutral[100] }} />
        <SkeletonLine width="70%" height={16} />
        <SkeletonLine width="45%" height={12} />
      </div>
    </div>
  );
}
