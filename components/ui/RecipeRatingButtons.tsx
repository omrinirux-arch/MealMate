"use client";

import { useTransition } from "react";
import { tokens } from "@/lib/tokens";

interface Props {
  planId: string;
  recipeTitle: string;
  recipeUrl: string;
  currentRating: "up" | "down" | null;
  rateAction: (formData: FormData) => Promise<void>;
}

export function RecipeRatingButtons({
  planId,
  recipeTitle,
  recipeUrl,
  currentRating,
  rateAction,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function submit(rating: "up" | "down") {
    const fd = new FormData();
    fd.set("planId", planId);
    fd.set("recipeTitle", recipeTitle);
    fd.set("recipeUrl", recipeUrl);
    fd.set("rating", rating);
    startTransition(() => rateAction(fd));
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        paddingTop: 4,
      }}
    >
      <p
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: tokens.colors.neutral[400],
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: 0,
        }}
      >
        How was it?
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit("up")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 20px",
            borderRadius: tokens.radius.pill,
            border: `1.5px solid ${
              currentRating === "up"
                ? tokens.colors.primary[500]
                : tokens.colors.neutral[200]
            }`,
            background:
              currentRating === "up"
                ? tokens.colors.primary[100]
                : tokens.colors.neutral[0],
            color:
              currentRating === "up"
                ? tokens.colors.primary[700]
                : tokens.colors.neutral[500],
            fontSize: "20px",
            fontWeight: 600,
            cursor: isPending ? "default" : "pointer",
            fontFamily: "inherit",
            transition: "all 0.12s",
            opacity: isPending ? 0.6 : 1,
          }}
          aria-label="Thumbs up"
        >
          👍
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit("down")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 20px",
            borderRadius: tokens.radius.pill,
            border: `1.5px solid ${
              currentRating === "down"
                ? tokens.colors.danger[300]
                : tokens.colors.neutral[200]
            }`,
            background:
              currentRating === "down"
                ? tokens.colors.danger[100]
                : tokens.colors.neutral[0],
            color:
              currentRating === "down"
                ? tokens.colors.danger[600]
                : tokens.colors.neutral[500],
            fontSize: "20px",
            fontWeight: 600,
            cursor: isPending ? "default" : "pointer",
            fontFamily: "inherit",
            transition: "all 0.12s",
            opacity: isPending ? 0.6 : 1,
          }}
          aria-label="Thumbs down"
        >
          👎
        </button>
      </div>
    </div>
  );
}
