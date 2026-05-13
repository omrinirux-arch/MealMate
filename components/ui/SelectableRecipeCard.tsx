"use client";

import { useTransition } from "react";
import { tokens } from "@/lib/tokens";

interface StoredRecipe {
  title: string;
  image_url: string | null;
  prep_time: string;
  cook_time: string;
  ingredients: string[];
  tags?: string[];
}

interface Props {
  recipe: StoredRecipe;
  haveCount: number;
  totalCount: number;
  detailHref: string;
  isSelected: boolean;
  planId: string;
  dayIndex: number;
  option: "a" | "b";
  selectAction: (formData: FormData) => Promise<void>;
}

export function SelectableRecipeCard({
  recipe,
  haveCount,
  totalCount,
  detailHref,
  isSelected,
  planId,
  dayIndex,
  option,
  selectAction,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const timeStr = [
    recipe.prep_time ? `${recipe.prep_time} prep` : null,
    recipe.cook_time ? `${recipe.cook_time} cook` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  function handleCardClick() {
    if (isSelected || isPending) return;
    const formData = new FormData();
    formData.append("planId", planId);
    formData.append("dayIndex", String(dayIndex));
    formData.append("option", option);
    startTransition(() => selectAction(formData));
  }

  return (
    <div
      onClick={handleCardClick}
      style={{
        flex: "1 1 0",
        minWidth: 0,
        position: "relative",
        background: isSelected ? tokens.colors.primary[50] : tokens.colors.neutral[0],
        border: isSelected
          ? `2px solid ${tokens.colors.primary[400]}`
          : `1px solid ${tokens.colors.neutral[200]}`,
        borderRadius: tokens.radius.lg,
        boxShadow: isPending ? "none" : tokens.shadow.sm,
        display: "flex",
        flexDirection: "column",
        cursor: isSelected || isPending ? "default" : "pointer",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.15s ease, border-color 0.15s ease, background 0.15s ease",
      }}
    >
      {/* Recipe image */}
      {recipe.image_url && (
        <div style={{ overflow: "hidden", borderRadius: `${tokens.radius.lg} ${tokens.radius.lg} 0 0` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={recipe.image_url}
            alt={recipe.title}
            style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }}
          />
        </div>
      )}

      {/* Checkmark badge (selected) or spinner badge (pending) */}
      {(isSelected || isPending) && (
        <div style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: isSelected ? tokens.colors.primary[500] : tokens.colors.neutral[300],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}>
          {isSelected ? (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.5)",
              borderTopColor: "#fff",
              display: "block",
              animation: "spin 0.7s linear infinite",
            }} />
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Card content */}
      <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>

        {/* Title */}
        <p style={{
          fontSize: "13px",
          fontWeight: 700,
          color: tokens.colors.neutral[900],
          margin: 0,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          lineHeight: 1.35,
        }}>
          {recipe.title}
        </p>

        {/* Time */}
        {timeStr && (
          <p style={{ fontSize: "11px", color: tokens.colors.neutral[500], margin: 0 }}>
            {timeStr}
          </p>
        )}

        {/* Ingredient match pill */}
        {totalCount > 0 && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: haveCount > 0 ? "#dcf0dc" : tokens.colors.neutral[100],
            borderRadius: 9999,
            padding: "3px 8px",
            alignSelf: "flex-start",
          }}>
            {haveCount > 0 && (
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#2d6e2d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span style={{
              fontSize: "10px",
              fontWeight: 600,
              color: haveCount > 0 ? "#2d6e2d" : tokens.colors.neutral[500],
            }}>
              {haveCount > 0 ? `${haveCount}/${totalCount} on hand` : `${totalCount} ingredients`}
            </span>
          </div>
        )}

        {/* View recipe link — stops propagation so it doesn't trigger selection */}
        <a
          href={detailHref}
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: "11px",
            fontWeight: 600,
            color: tokens.colors.primary[600],
            textDecoration: "none",
            paddingTop: 6,
            borderTop: `1px solid ${tokens.colors.neutral[100]}`,
          }}
        >
          View recipe
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

      </div>
    </div>
  );
}
