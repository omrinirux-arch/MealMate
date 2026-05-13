"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getHouseholdByInviteCode, joinHousehold } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { tokens } from "@/lib/tokens";

export default function JoinHouseholdPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
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

    const household = await getHouseholdByInviteCode(supabase, code.trim().toUpperCase());

    if (!household) {
      setError("Invite code not found. Check the code and try again.");
      setLoading(false);
      return;
    }

    const { error: err } = await joinHousehold(supabase, household.id, user.id);

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push("/home");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1
          className="text-2xl font-bold"
          style={{ letterSpacing: tokens.typography.letterSpacing.heading, color: tokens.colors.neutral[900] }}
        >
          Join a household
        </h1>
        <p className="text-sm" style={{ color: tokens.colors.neutral[500] }}>
          Enter the invite code shared by your household admin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <ErrorBanner message={error} />}

        <TextInput
          label="Invite code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABCD1234"
          required
          autoFocus
          style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "18px" }}
        />

        <Button type="submit" variant="primary" fullWidth disabled={loading || code.trim().length < 6}>
          {loading ? "Joining…" : "Join household"}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => router.push("/household/create")}
          className="text-sm"
          style={{ color: tokens.colors.neutral[500] }}
        >
          No invite code?{" "}
          <span style={{ color: tokens.colors.primary[700] }} className="font-medium">
            Create a new household
          </span>
        </button>
      </div>
    </div>
  );
}
