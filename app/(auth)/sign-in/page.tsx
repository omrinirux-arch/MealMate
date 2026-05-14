"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { tokens } from "@/lib/tokens";

type Mode = "signin" | "signup" | "magic";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "magic") {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (err) {
        setError(err.message);
      } else {
        setMagicSent(true);
      }
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      router.push("/household/create");
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    router.push("/");
  }

  if (magicSent) {
    return (
      <div className="text-center space-y-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: tokens.colors.primary[100] }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: tokens.colors.primary[600] }}>
            <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold" style={{ letterSpacing: tokens.typography.letterSpacing.heading, color: tokens.colors.neutral[900] }}>
          Check your email
        </h1>
        <p className="text-sm" style={{ color: tokens.colors.neutral[500] }}>
          We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
        </p>
        <Button variant="ghost" onClick={() => setMagicSent(false)} fullWidth>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Logo / wordmark */}
      <div className="text-center space-y-2">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: `linear-gradient(160deg, ${tokens.colors.primary[500]}, ${tokens.colors.primary[700]})` }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C12 2 8 6 8 10C8 12.2091 9.79086 14 12 14C14.2091 14 16 12.2091 16 10C16 6 12 2 12 2Z" fill="white"/>
            <path d="M5 22C5 17 8 14 12 14C16 14 19 17 19 22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold" style={{ letterSpacing: tokens.typography.letterSpacing.heading, color: tokens.colors.neutral[900] }}>
          MealMate
        </h1>
        <p className="text-sm" style={{ color: tokens.colors.neutral[500] }}>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <ErrorBanner message={error} />}

        <div style={{ marginBottom: 16 }}>
          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        {mode !== "magic" && (
          <div style={{ marginBottom: 24 }}>
            <TextInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              helperText={mode === "signup" ? "At least 8 characters" : undefined}
            />
          </div>
        )}

        <Button type="submit" variant="primary" fullWidth disabled={loading}>
          {loading
            ? "Loading…"
            : mode === "signup"
            ? "Create account"
            : mode === "magic"
            ? "Send magic link"
            : "Sign in"}
        </Button>
      </form>

      <div className="space-y-3 text-center">
        {mode !== "magic" && (
          <button
            type="button"
            onClick={() => { setMode("magic"); setError(null); }}
            className="text-sm transition-colors duration-150"
            style={{ color: tokens.colors.primary[700] }}
          >
            Sign in with magic link instead
          </button>
        )}
        {mode === "magic" && (
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); }}
            className="text-sm transition-colors duration-150"
            style={{ color: tokens.colors.primary[700] }}
          >
            Sign in with password instead
          </button>
        )}
        <div>
          <button
            type="button"
            onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); }}
            className="text-sm"
            style={{ color: tokens.colors.neutral[500] }}
          >
            {mode === "signup" ? "Already have an account? " : "New here? "}
            <span style={{ color: tokens.colors.primary[700] }} className="font-medium">
              {mode === "signup" ? "Sign in" : "Create account"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
