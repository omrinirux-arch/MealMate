"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createHousehold } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { tokens } from "@/lib/tokens";

export default function CreateHouseholdPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/sign-in");
      return;
    }

    const { household, error: err } = await createHousehold(supabase, name.trim(), user.id);

    if (err || !household) {
      setError(err?.message ?? "Failed to create household");
      setLoading(false);
      return;
    }

    router.push("/onboarding/staples");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1
          className="text-2xl font-bold"
          style={{ letterSpacing: tokens.typography.letterSpacing.heading, color: tokens.colors.neutral[900] }}
        >
          Name your household
        </h1>
        <p className="text-sm" style={{ color: tokens.colors.neutral[500] }}>
          This is how your household will appear in the app. You can invite others after.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <ErrorBanner message={error} />}

        <TextInput
          label="Household name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="The Johnson Family"
          required
          autoFocus
        />

        <Button type="submit" variant="primary" fullWidth disabled={loading || !name.trim()}>
          {loading ? "Creating…" : "Create household"}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => router.push("/household/join")}
          className="text-sm"
          style={{ color: tokens.colors.neutral[500] }}
        >
          Have an invite code?{" "}
          <span style={{ color: tokens.colors.primary[700] }} className="font-medium">
            Join household
          </span>
        </button>
      </div>
    </div>
  );
}
