import { BottomNav } from "@/components/ui/BottomNav";
import { tokens } from "@/lib/tokens";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-full" style={{ background: tokens.colors.neutral[50] }}>
      <main className="flex-1 overflow-y-auto pb-[72px]">{children}</main>
      <BottomNav />
    </div>
  );
}
