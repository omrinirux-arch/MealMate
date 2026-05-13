"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function GeneratePlanCTA({ label }: { label?: string } = {}) {
  const router = useRouter();
  return (
    <Button variant="primary" onClick={() => router.push("/plan/new")}>
      {label ?? "Generate this week’s plan"}
    </Button>
  );
}
