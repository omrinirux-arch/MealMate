import { tokens } from "@/lib/tokens";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-full flex flex-col items-center justify-center py-12"
      style={{ paddingLeft: 16, paddingRight: 16 }}
      style={{ background: tokens.colors.neutral[50] }}
    >
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
