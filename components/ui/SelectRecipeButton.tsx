"use client";

import { useTransition } from "react";
import { tokens } from "@/lib/tokens";

interface Props {
  planId: string;
  dayIndex: number;
  option: "a" | "b";
  dayName: string;
  isAlreadySelected: boolean;
  peerIsSelected: boolean;
  selectAction: (formData: FormData) => Promise<void>;
}

export function SelectRecipeButton({
  planId,
  dayIndex,
  option,
  dayName,
  isAlreadySelected,
  peerIsSelected,
  selectAction,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => selectAction(formData));
  }

  if (isAlreadySelected) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "15px",
        borderRadius: tokens.radius.lg,
        background: "#dcf0dc",
        border: "1.5px solid #b2ddb2",
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="8" fill="#2d6e2d" />
          <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: "15px", fontWeight: 600, color: "#2d6e2d" }}>
          Selected for {dayName}
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="dayIndex" value={dayIndex} />
      <input type="hidden" name="option" value={option} />
      <button
        type="submit"
        disabled={isPending}
        style={{
          width: "100%",
          padding: "15px",
          borderRadius: tokens.radius.lg,
          background: isPending
            ? tokens.colors.primary[400]
            : peerIsSelected
              ? tokens.colors.neutral[0]
              : `linear-gradient(160deg, ${tokens.colors.primary[500]} 0%, ${tokens.colors.primary[600]} 100%)`,
          color: peerIsSelected ? tokens.colors.primary[600] : "#fff",
          border: peerIsSelected
            ? `1.5px solid ${tokens.colors.primary[400]}`
            : "none",
          fontSize: "15px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          cursor: isPending ? "not-allowed" : "pointer",
          boxShadow: isPending || peerIsSelected ? "none" : tokens.shadow.cta,
          opacity: isPending ? 0.7 : 1,
          transition: "all 0.12s ease",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {isPending ? (
          <>
            <span style={{
              width: 14, height: 14, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.4)",
              borderTopColor: "#fff",
              animation: "spin 0.7s linear infinite",
              flexShrink: 0,
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Saving…
          </>
        ) : peerIsSelected ? (
          "Select this instead"
        ) : (
          `Select for ${dayName}`
        )}
      </button>
    </form>
  );
}
