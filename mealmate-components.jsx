import React, { useState } from "react";

// ═══════════════════════════════════════════════════════════════════
//  MealMate — Component Library
//  Extracted from finalized screen designs. Reusable building blocks
//  for the app, each shown in every relevant state.
// ═══════════════════════════════════════════════════════════════════

// ── DESIGN TOKENS ─────────────────────────────────────────────────
const C = {
  primary:   { 50:"#f4f7f4",100:"#e4ebe4",200:"#c9d8c9",300:"#a3bda3",400:"#7a9e7a",500:"#5a8a5a",600:"#4a7a4a",700:"#3d633d",800:"#334f33",900:"#2a422a" },
  secondary: { 50:"#fdf5f0",100:"#fae8dc",200:"#f4cdb5",300:"#edae88",400:"#e08c5a",500:"#d4723e",600:"#bf5c2e",700:"#9e4a27",800:"#7f3d24" },
  neutral:   { 0:"#ffffff",50:"#faf8f6",100:"#f3f0ec",200:"#e8e3dd",300:"#d4cdc4",400:"#b5aca0",500:"#968b7d",600:"#7a6f63",700:"#615851",800:"#4a4340",900:"#352f2d",950:"#1e1b19" },
  danger:    { 50:"#fdf2f2",100:"#fbe5e5",300:"#e8a3a3",500:"#c75555",600:"#a83f3f",700:"#8a3434" },
};

const shadow = {
  sm: "0 1px 3px rgba(53,47,45,0.07), 0 1px 2px rgba(53,47,45,0.04)",
  md: "0 4px 12px rgba(53,47,45,0.09), 0 2px 4px rgba(53,47,45,0.05)",
  lg: "0 8px 24px rgba(53,47,45,0.12), 0 4px 8px rgba(53,47,45,0.06)",
  cta: "0 6px 20px rgba(74,122,74,0.30), 0 4px 12px rgba(53,47,45,0.08)",
  ctaPressed: "0 1px 3px rgba(53,47,45,0.08)",
};

const radius = { sm: 8, md: 10, lg: 14, xl: 18, pill: 9999 };

const fontStack = "'DM Sans', system-ui, sans-serif";

// ── ICONS ─────────────────────────────────────────────────────────
const Ico = {
  Sparkle: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  Plus: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Check: ({ size = 12, color = "#fff" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  ChevronRight: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  ChevronDown: ({ size = 14, color = "currentColor", open = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${open ? 180 : 0}deg)`, transition: "transform 0.2s ease" }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  Refresh: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  ThumbUp: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  ThumbDown: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" /><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  ),
  X: ({ size = 12, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Search: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  Alert: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════
//  PRIMITIVES
// ═══════════════════════════════════════════════════════════════════

// ── Button (Primary CTA) ──────────────────────────────────────────
function ButtonPrimary({ children, icon, state = "default", onClick, fullWidth = true }) {
  const styles = {
    default: { bg: `linear-gradient(160deg, ${C.primary[500]} 0%, ${C.primary[600]} 100%)`, shadow: shadow.cta, transform: "scale(1)" },
    hover:   { bg: `linear-gradient(160deg, ${C.primary[500]} 0%, ${C.primary[700]} 100%)`, shadow: shadow.cta, transform: "scale(1.005)" },
    active:  { bg: C.primary[700], shadow: shadow.ctaPressed, transform: "scale(0.985)" },
    disabled:{ bg: C.neutral[300], shadow: "none", transform: "scale(1)", color: C.neutral[500] },
  };
  const s = styles[state];
  return (
    <button
      onClick={onClick}
      disabled={state === "disabled"}
      style={{
        width: fullWidth ? "100%" : "auto",
        padding: "14px 20px",
        borderRadius: radius.lg,
        background: s.bg,
        color: s.color || "#fff",
        fontFamily: fontStack,
        fontSize: "1rem",
        fontWeight: 600,
        border: "none",
        cursor: state === "disabled" ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: s.shadow,
        transform: s.transform,
        transition: "all 0.15s ease",
        letterSpacing: "-0.01em",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// ── Button (Secondary) ────────────────────────────────────────────
function ButtonSecondary({ children, icon, state = "default", onClick }) {
  const styles = {
    default: { bg: C.neutral[0], border: C.neutral[200], color: C.neutral[800] },
    hover:   { bg: C.neutral[50], border: C.neutral[300], color: C.neutral[900] },
    active:  { bg: C.neutral[100], border: C.neutral[300], color: C.neutral[900] },
    disabled:{ bg: C.neutral[50], border: C.neutral[200], color: C.neutral[400] },
  };
  const s = styles[state];
  return (
    <button
      onClick={onClick}
      disabled={state === "disabled"}
      style={{
        padding: "12px 18px",
        borderRadius: radius.lg,
        background: s.bg,
        color: s.color,
        fontFamily: fontStack,
        fontSize: "0.9375rem",
        fontWeight: 600,
        border: `1px solid ${s.border}`,
        cursor: state === "disabled" ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        boxShadow: state === "default" ? shadow.sm : "none",
        transition: "all 0.15s ease",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// ── Button (Text/Ghost) ───────────────────────────────────────────
function ButtonText({ children, icon, state = "default", onClick, color = C.primary[700] }) {
  const styles = {
    default: { color, opacity: 1 },
    hover:   { color: C.primary[800], opacity: 1, bg: C.primary[50] },
    active:  { color: C.primary[800], opacity: 1, bg: C.primary[100] },
    disabled:{ color: C.neutral[400], opacity: 0.6 },
  };
  const s = styles[state];
  return (
    <button
      onClick={onClick}
      disabled={state === "disabled"}
      style={{
        padding: "6px 8px",
        borderRadius: radius.sm,
        background: s.bg || "transparent",
        color: s.color,
        fontFamily: fontStack,
        fontSize: "0.8125rem",
        fontWeight: 600,
        border: "none",
        cursor: state === "disabled" ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        opacity: s.opacity,
        transition: "all 0.15s ease",
      }}
    >
      {children}
      {icon}
    </button>
  );
}

// ── Chip / Tag (selectable) ───────────────────────────────────────
function Chip({ label, state = "default", onClick }) {
  const styles = {
    default:  { bg: C.neutral[0],     border: C.neutral[300], color: C.neutral[700] },
    hover:    { bg: C.neutral[50],    border: C.neutral[400], color: C.neutral[800] },
    selected: { bg: C.primary[50],    border: C.primary[500], color: C.primary[700] },
    disabled: { bg: C.neutral[50],    border: C.neutral[200], color: C.neutral[400] },
  };
  const s = styles[state];
  return (
    <button
      onClick={onClick}
      disabled={state === "disabled"}
      style={{
        padding: "8px 14px",
        borderRadius: radius.pill,
        background: s.bg,
        color: s.color,
        fontFamily: fontStack,
        fontSize: "0.8125rem",
        fontWeight: 500,
        border: `1.5px solid ${s.border}`,
        cursor: state === "disabled" ? "not-allowed" : "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ── Tag (read-only, e.g. recipe tags) ─────────────────────────────
function Tag({ label, tone = "neutral" }) {
  const tones = {
    neutral:  { bg: C.neutral[100],   color: C.neutral[700] },
    primary:  { bg: C.primary[50],    color: C.primary[700] },
    accent:   { bg: C.secondary[50],  color: C.secondary[700] },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 9px",
      borderRadius: radius.pill,
      background: t.bg,
      color: t.color,
      fontFamily: fontStack,
      fontSize: "0.6875rem",
      fontWeight: 500,
      letterSpacing: "0.01em",
    }}>
      {label}
    </span>
  );
}

// ── Removable Tag (e.g. exclusions list) ──────────────────────────
function RemovableTag({ label, onRemove, state = "default" }) {
  const styles = {
    default: { bg: C.secondary[50],  border: C.secondary[200], color: C.secondary[700] },
    hover:   { bg: C.secondary[100], border: C.secondary[300], color: C.secondary[800] },
  };
  const s = styles[state];
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 6px 5px 11px",
      borderRadius: radius.pill,
      background: s.bg,
      color: s.color,
      fontFamily: fontStack,
      fontSize: "0.8125rem",
      fontWeight: 500,
      border: `1px solid ${s.border}`,
      transition: "all 0.15s ease",
    }}>
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        style={{
          width: 18, height: 18,
          borderRadius: "50%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: s.color,
        }}
      >
        <Ico.X size={11} />
      </button>
    </span>
  );
}

// ── Checkbox ──────────────────────────────────────────────────────
function Checkbox({ state = "default", label, onClick }) {
  const styles = {
    default:        { bg: C.neutral[0],   border: C.neutral[300], showCheck: false },
    hover:          { bg: C.neutral[50],  border: C.primary[400], showCheck: false },
    checked:        { bg: C.primary[600], border: C.primary[600], showCheck: true },
    "checked-hover":{ bg: C.primary[700], border: C.primary[700], showCheck: true },
    disabled:       { bg: C.neutral[100], border: C.neutral[200], showCheck: false },
  };
  const s = styles[state];
  return (
    <label
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        cursor: state === "disabled" ? "not-allowed" : "pointer",
        opacity: state === "disabled" ? 0.5 : 1,
        fontFamily: fontStack,
      }}
    >
      <span style={{
        width: 20, height: 20,
        borderRadius: 6,
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease",
        flexShrink: 0,
      }}>
        {s.showCheck && <Ico.Check size={12} color="#fff" />}
      </span>
      {label && <span style={{ fontSize: "0.9375rem", color: C.neutral[800] }}>{label}</span>}
    </label>
  );
}

// ── Text Input ────────────────────────────────────────────────────
function TextInput({ state = "default", placeholder = "", value = "", icon, helperText, onChange }) {
  const styles = {
    default:  { border: C.neutral[300], bg: C.neutral[0],  helperColor: C.neutral[500] },
    hover:    { border: C.neutral[400], bg: C.neutral[0],  helperColor: C.neutral[500] },
    focus:    { border: C.primary[500], bg: C.neutral[0],  helperColor: C.neutral[500], ring: `0 0 0 3px ${C.primary[100]}` },
    filled:   { border: C.neutral[300], bg: C.neutral[0],  helperColor: C.neutral[500] },
    error:    { border: C.danger[500],  bg: C.danger[50],  helperColor: C.danger[700], ring: `0 0 0 3px ${C.danger[100]}` },
    disabled: { border: C.neutral[200], bg: C.neutral[100], helperColor: C.neutral[400] },
  };
  const s = styles[state];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: radius.md,
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        boxShadow: s.ring || "none",
        transition: "all 0.15s ease",
        opacity: state === "disabled" ? 0.6 : 1,
      }}>
        {icon && <span style={{ color: C.neutral[500], display: "flex" }}>{icon}</span>}
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={state === "disabled"}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            outline: "none",
            fontFamily: fontStack,
            fontSize: "0.9375rem",
            color: C.neutral[900],
            minWidth: 0,
          }}
        />
      </div>
      {helperText && (
        <span style={{
          fontFamily: fontStack,
          fontSize: "0.75rem",
          color: s.helperColor,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}>
          {state === "error" && <Ico.Alert size={12} color={C.danger[600]} />}
          {helperText}
        </span>
      )}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────
function Avatar({ initial = "J", size = 32 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${C.secondary[200]}, ${C.secondary[400]})`,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.42, fontWeight: 600, color: C.secondary[800], fontFamily: fontStack }}>
        {initial}
      </span>
    </div>
  );
}

// ── Badge (week badge, count badge) ───────────────────────────────
function Badge({ children, tone = "primary" }) {
  const tones = {
    primary: { bg: C.primary[100], color: C.primary[700] },
    accent:  { bg: C.secondary[100], color: C.secondary[700] },
    neutral: { bg: C.neutral[200], color: C.neutral[700] },
  };
  const t = tones[tone];
  return (
    <span style={{
      fontFamily: fontStack,
      fontSize: "0.6875rem",
      fontWeight: 500,
      background: t.bg,
      color: t.color,
      borderRadius: radius.pill,
      padding: "2px 8px",
      letterSpacing: "0.01em",
    }}>
      {children}
    </span>
  );
}

// ── Stepper Dots (onboarding progress) ────────────────────────────
function StepperDots({ total = 3, current = 1 }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i + 1 === current;
        const isComplete = i + 1 < current;
        return (
          <span key={i} style={{
            width: isActive ? 22 : 6,
            height: 6,
            borderRadius: 3,
            background: isActive ? C.primary[600] : isComplete ? C.primary[300] : C.neutral[300],
            transition: "all 0.25s ease",
          }} />
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  COMPOSITE COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// ── Card (base container) ─────────────────────────────────────────
function Card({ children, padding = 18, elevation = "md" }) {
  return (
    <div style={{
      background: C.neutral[0],
      borderRadius: radius.lg,
      boxShadow: shadow[elevation],
      padding,
      fontFamily: fontStack,
    }}>
      {children}
    </div>
  );
}

// ── Recipe Card (option card on weekly plan) ──────────────────────
function RecipeCard({ title, description, prepTime, tags = [], state = "default", thumbnail = true }) {
  const stateStyles = {
    default:  { bg: C.neutral[0],   border: C.neutral[200], opacity: 1 },
    hover:    { bg: C.neutral[0],   border: C.neutral[300], opacity: 1, shadow: shadow.md },
    selected: { bg: C.primary[50],  border: C.primary[500], opacity: 1 },
    dimmed:   { bg: C.neutral[0],   border: C.neutral[200], opacity: 0.42 },
  };
  const s = stateStyles[state];
  return (
    <div style={{
      display: "flex",
      gap: 12,
      padding: 12,
      borderRadius: radius.lg,
      background: s.bg,
      border: `1.5px solid ${s.border}`,
      boxShadow: s.shadow || shadow.sm,
      opacity: s.opacity,
      cursor: "pointer",
      transition: "all 0.15s ease",
      fontFamily: fontStack,
    }}>
      {thumbnail && (
        <div style={{
          width: 72, height: 72,
          borderRadius: radius.md,
          background: `linear-gradient(135deg, ${C.secondary[100]}, ${C.secondary[200]})`,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
        }}>
          🍲
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <h4 style={{ fontSize: "0.9375rem", fontWeight: 600, color: C.neutral[900], lineHeight: 1.3, letterSpacing: "-0.01em", margin: 0 }}>
            {title}
          </h4>
          {state === "selected" && (
            <span style={{
              width: 18, height: 18, borderRadius: "50%",
              background: C.primary[600],
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Ico.Check size={11} />
            </span>
          )}
        </div>
        <p style={{ fontSize: "0.75rem", color: C.neutral[600], lineHeight: 1.4, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {description}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
          <Tag label={prepTime} tone="neutral" />
          {tags.slice(0, 2).map((t) => <Tag key={t} label={t} tone="primary" />)}
        </div>
      </div>
    </div>
  );
}

// ── Grocery Row ───────────────────────────────────────────────────
function GroceryRow({ name, quantity, source, state = "default", isManual = false, onToggle, onRemove }) {
  const isChecked = state === "checked";
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderRadius: radius.md,
      background: state === "hover" ? C.neutral[50] : "transparent",
      borderBottom: `1px solid ${C.neutral[100]}`,
      cursor: "pointer",
      transition: "all 0.15s ease",
      fontFamily: fontStack,
      opacity: isChecked ? 0.5 : 1,
    }}>
      <Checkbox state={isChecked ? "checked" : "default"} onClick={onToggle} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "0.9375rem",
          fontWeight: 500,
          color: C.neutral[900],
          textDecoration: isChecked ? "line-through" : "none",
          letterSpacing: "-0.005em",
        }}>
          {name} {quantity && <span style={{ color: C.neutral[500], fontWeight: 400 }}>· {quantity}</span>}
        </div>
        {source && (
          <div style={{ fontSize: "0.75rem", color: C.neutral[500], marginTop: 2 }}>
            {isManual ? "Added by you" : `For: ${source}`}
          </div>
        )}
      </div>
      {onRemove && (
        <button onClick={onRemove} aria-label="Remove" style={{ background: "transparent", border: "none", cursor: "pointer", color: C.neutral[400], padding: 4 }}>
          <Ico.X size={14} />
        </button>
      )}
    </div>
  );
}

// ── Day Section (weekly plan day with two options) ────────────────
function DaySection({ day, date, state = "pending" }) {
  const labels = {
    pending:  { label: "Pick one",   color: C.neutral[500], bg: C.neutral[100] },
    selected: { label: "Selected",   color: C.primary[700], bg: C.primary[100] },
    skipped:  { label: "Skipping",   color: C.neutral[600], bg: C.neutral[200] },
  };
  const s = labels[state];
  return (
    <div style={{ fontFamily: fontStack }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: "1.0625rem", fontWeight: 700, color: C.neutral[900], letterSpacing: "-0.02em" }}>{day}</span>
          <span style={{ fontSize: "0.75rem", color: C.neutral[500] }}>{date}</span>
        </div>
        <Badge tone={state === "selected" ? "primary" : "neutral"}>{s.label}</Badge>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <RecipeCard
          title="Sheet Pan Lemon Chicken"
          description="Roasted chicken thighs with potatoes, onions, and herbs."
          prepTime="35 min"
          tags={["one-pan", "high-protein"]}
          state={state === "selected" ? "selected" : "default"}
        />
        <RecipeCard
          title="Coconut Curry Shrimp"
          description="Quick weeknight curry with jasmine rice and snap peas."
          prepTime="25 min"
          tags={["quick", "weeknight"]}
          state={state === "selected" ? "dimmed" : "default"}
        />
      </div>
    </div>
  );
}

// ── Bottom Nav ────────────────────────────────────────────────────
function BottomNav({ active = "home" }) {
  const items = [
    { id: "home", label: "Home", icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><path d="M9 21V12h6v9" /></svg>
    )},
    { id: "list", label: "Grocery", icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" fill={color} stroke="none" /><circle cx="4.5" cy="12" r="1" fill={color} stroke="none" /><circle cx="4.5" cy="18" r="1" fill={color} stroke="none" /></svg>
    )},
    { id: "settings", label: "Kitchen", icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
    )},
  ];
  return (
    <div style={{
      display: "flex",
      background: C.neutral[0],
      borderTop: `1px solid ${C.neutral[200]}`,
      padding: "8px 0 14px",
      borderRadius: `${radius.lg}px ${radius.lg}px 0 0`,
      fontFamily: fontStack,
    }}>
      {items.map((item) => {
        const isActive = item.id === active;
        const color = isActive ? C.primary[600] : C.neutral[400];
        return (
          <button key={item.id} style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            padding: "6px 0",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}>
            {item.icon(color)}
            <span style={{ fontSize: "0.6875rem", fontWeight: isActive ? 600 : 500, color, letterSpacing: "0.01em" }}>
              {item.label}
            </span>
            {isActive && <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.primary[500], marginTop: 1 }} />}
          </button>
        );
      })}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────
function EmptyState({ title, body, ctaLabel }) {
  return (
    <div style={{
      padding: "32px 20px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      fontFamily: fontStack,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: C.neutral[100],
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.neutral[400]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18M8 6V4M16 6V4" />
        </svg>
      </div>
      <h4 style={{ fontSize: "1rem", fontWeight: 600, color: C.neutral[900], margin: 0, letterSpacing: "-0.01em" }}>{title}</h4>
      <p style={{ fontSize: "0.875rem", color: C.neutral[500], margin: 0, lineHeight: 1.5, maxWidth: 280 }}>{body}</p>
      {ctaLabel && (
        <div style={{ marginTop: 6 }}>
          <ButtonSecondary icon={<Ico.Plus size={13} color={C.primary[700]} />}>
            {ctaLabel}
          </ButtonSecondary>
        </div>
      )}
    </div>
  );
}

// ── Inline Error Banner ───────────────────────────────────────────
function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      padding: "12px 14px",
      borderRadius: radius.md,
      background: C.danger[50],
      border: `1px solid ${C.danger[300]}`,
      fontFamily: fontStack,
    }}>
      <span style={{ color: C.danger[600], display: "flex", paddingTop: 1 }}>
        <Ico.Alert size={16} />
      </span>
      <div style={{ flex: 1, fontSize: "0.8125rem", color: C.danger[700], lineHeight: 1.4 }}>
        {message}
      </div>
      {onRetry && (
        <button onClick={onRetry} style={{
          fontFamily: fontStack,
          background: "transparent", border: "none",
          fontSize: "0.8125rem", fontWeight: 600,
          color: C.danger[700], cursor: "pointer",
        }}>
          Retry
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  CATALOG SHELL
// ═══════════════════════════════════════════════════════════════════

function Section({ title, description, children }) {
  return (
    <section style={{ marginBottom: 40, fontFamily: fontStack }}>
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.neutral[200]}` }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.neutral[900], margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
        {description && <p style={{ fontSize: "0.875rem", color: C.neutral[600], margin: "4px 0 0", lineHeight: 1.5 }}>{description}</p>}
      </div>
      {children}
    </section>
  );
}

function StateRow({ label, children }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "120px 1fr",
      alignItems: "center",
      gap: 16,
      padding: "14px 0",
      borderBottom: `1px dashed ${C.neutral[200]}`,
      fontFamily: fontStack,
    }}>
      <span style={{
        fontSize: "0.6875rem",
        fontWeight: 600,
        color: C.neutral[500],
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function TokenSwatch({ name, value, isColor = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: fontStack, minWidth: 180 }}>
      {isColor && (
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: value,
          border: `1px solid ${C.neutral[200]}`,
          flexShrink: 0,
        }} />
      )}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: C.neutral[800] }}>{name}</span>
        <span style={{ fontSize: "0.6875rem", color: C.neutral[500], fontFamily: "ui-monospace, monospace" }}>{value}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ROOT
// ═══════════════════════════════════════════════════════════════════

export default function MealMateComponentLibrary() {
  const [checkbox1, setCheckbox1] = useState(false);
  const [chipState, setChipState] = useState("default");
  const [inputValue, setInputValue] = useState("");

  return (
    <div style={{
      minHeight: "100vh",
      background: C.neutral[100],
      padding: "32px 20px 80px",
      fontFamily: fontStack,
      color: C.neutral[900],
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* HEADER */}
        <header style={{ marginBottom: 40, paddingBottom: 24, borderBottom: `2px solid ${C.neutral[900]}` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>MealMate</h1>
            <span style={{ fontSize: "0.875rem", color: C.neutral[500], fontWeight: 500 }}>Component Library v1</span>
          </div>
          <p style={{ fontSize: "0.9375rem", color: C.neutral[600], margin: 0, maxWidth: 640, lineHeight: 1.55 }}>
            Reusable building blocks extracted from the finalized screen designs. Every component shown with all relevant states.
            Tokens are the source of truth — refer to <code style={{ background: C.neutral[200], padding: "1px 5px", borderRadius: 4, fontSize: "0.8125rem" }}>C</code>, <code style={{ background: C.neutral[200], padding: "1px 5px", borderRadius: 4, fontSize: "0.8125rem" }}>shadow</code>, and <code style={{ background: C.neutral[200], padding: "1px 5px", borderRadius: 4, fontSize: "0.8125rem" }}>radius</code>.
          </p>
        </header>

        {/* TOKENS */}
        <Section title="Design Tokens" description="Foundational values. Always reference these — do not hard-code colors or shadows in components.">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: C.neutral[600], textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Primary (sage)</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(C.primary).map(([k, v]) => <TokenSwatch key={k} name={`primary.${k}`} value={v} />)}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: C.neutral[600], textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Secondary (terracotta)</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(C.secondary).map(([k, v]) => <TokenSwatch key={k} name={`secondary.${k}`} value={v} />)}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: C.neutral[600], textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Neutral (warm)</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(C.neutral).map(([k, v]) => <TokenSwatch key={k} name={`neutral.${k}`} value={v} />)}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: C.neutral[600], textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Radius & Type</h3>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <TokenSwatch name="radius.sm" value="8px" isColor={false} />
                <TokenSwatch name="radius.md" value="10px" isColor={false} />
                <TokenSwatch name="radius.lg" value="14px" isColor={false} />
                <TokenSwatch name="radius.pill" value="9999px" isColor={false} />
                <TokenSwatch name="font" value="DM Sans" isColor={false} />
              </div>
            </div>
          </div>
        </Section>

        {/* BUTTONS */}
        <Section title="Buttons" description="Three variants. Primary CTA uses the gradient + green shadow signature from the home screen.">
          <StateRow label="Primary / Default">
            <ButtonPrimary icon={<Ico.Sparkle size={16} />}>Generate This Week's Plan</ButtonPrimary>
          </StateRow>
          <StateRow label="Primary / Hover">
            <ButtonPrimary icon={<Ico.Sparkle size={16} />} state="hover">Generate This Week's Plan</ButtonPrimary>
          </StateRow>
          <StateRow label="Primary / Active">
            <ButtonPrimary icon={<Ico.Sparkle size={16} />} state="active">Generate This Week's Plan</ButtonPrimary>
          </StateRow>
          <StateRow label="Primary / Disabled">
            <ButtonPrimary icon={<Ico.Sparkle size={16} />} state="disabled">Generate This Week's Plan</ButtonPrimary>
          </StateRow>
          <StateRow label="Secondary / Default">
            <ButtonSecondary icon={<Ico.Plus size={13} color={C.neutral[800]} />}>Add Item</ButtonSecondary>
          </StateRow>
          <StateRow label="Secondary / Hover">
            <ButtonSecondary icon={<Ico.Plus size={13} color={C.neutral[900]} />} state="hover">Add Item</ButtonSecondary>
          </StateRow>
          <StateRow label="Secondary / Active">
            <ButtonSecondary icon={<Ico.Plus size={13} color={C.neutral[900]} />} state="active">Add Item</ButtonSecondary>
          </StateRow>
          <StateRow label="Secondary / Disabled">
            <ButtonSecondary icon={<Ico.Plus size={13} color={C.neutral[400]} />} state="disabled">Add Item</ButtonSecondary>
          </StateRow>
          <StateRow label="Text / Default">
            <ButtonText icon={<Ico.ChevronRight size={12} color={C.primary[700]} />}>Edit</ButtonText>
          </StateRow>
          <StateRow label="Text / Hover">
            <ButtonText icon={<Ico.ChevronRight size={12} color={C.primary[800]} />} state="hover">Edit</ButtonText>
          </StateRow>
          <StateRow label="Text / Disabled">
            <ButtonText icon={<Ico.ChevronRight size={12} color={C.neutral[400]} />} state="disabled">Edit</ButtonText>
          </StateRow>
        </Section>

        {/* CHIPS */}
        <Section title="Chips & Tags" description="Chips are selectable filters (preferences, categories). Tags are read-only metadata.">
          <StateRow label="Chip / Default">
            <Chip label="Quick & easy" />
            <Chip label="One-pot" />
            <Chip label="High-protein" />
          </StateRow>
          <StateRow label="Chip / Hover">
            <Chip label="Quick & easy" state="hover" />
          </StateRow>
          <StateRow label="Chip / Selected">
            <Chip label="Quick & easy" state="selected" />
            <Chip label="Kid-friendly" state="selected" />
          </StateRow>
          <StateRow label="Chip / Disabled">
            <Chip label="Spicy" state="disabled" />
          </StateRow>
          <StateRow label="Tag / Neutral">
            <Tag label="35 min" tone="neutral" />
          </StateRow>
          <StateRow label="Tag / Primary">
            <Tag label="one-pan" tone="primary" />
            <Tag label="high-protein" tone="primary" />
          </StateRow>
          <StateRow label="Tag / Accent">
            <Tag label="weeknight" tone="accent" />
          </StateRow>
          <StateRow label="Removable / Default">
            <RemovableTag label="peanuts" onRemove={() => {}} />
            <RemovableTag label="cilantro" onRemove={() => {}} />
          </StateRow>
          <StateRow label="Removable / Hover">
            <RemovableTag label="peanuts" state="hover" onRemove={() => {}} />
          </StateRow>
        </Section>

        {/* INPUTS */}
        <Section title="Form Inputs" description="Text inputs include leading icon, helper text, and full validation states. Used in onboarding, on-hand items, and exclusions.">
          <StateRow label="Input / Default">
            <div style={{ width: 320 }}>
              <TextInput placeholder="e.g. olive oil" icon={<Ico.Search size={15} />} />
            </div>
          </StateRow>
          <StateRow label="Input / Focus">
            <div style={{ width: 320 }}>
              <TextInput placeholder="e.g. olive oil" icon={<Ico.Search size={15} />} state="focus" value="olive oil" />
            </div>
          </StateRow>
          <StateRow label="Input / Filled">
            <div style={{ width: 320 }}>
              <TextInput placeholder="e.g. olive oil" icon={<Ico.Search size={15} />} state="filled" value="olive oil" helperText="Press enter to add" />
            </div>
          </StateRow>
          <StateRow label="Input / Error">
            <div style={{ width: 320 }}>
              <TextInput placeholder="e.g. olive oil" icon={<Ico.Search size={15} />} state="error" value="" helperText="This field is required" />
            </div>
          </StateRow>
          <StateRow label="Input / Disabled">
            <div style={{ width: 320 }}>
              <TextInput placeholder="Locked" state="disabled" />
            </div>
          </StateRow>
          <StateRow label="Checkbox / Default">
            <Checkbox label="Instant Pot" />
          </StateRow>
          <StateRow label="Checkbox / Hover">
            <Checkbox state="hover" label="Instant Pot" />
          </StateRow>
          <StateRow label="Checkbox / Checked">
            <Checkbox state="checked" label="Instant Pot" />
          </StateRow>
          <StateRow label="Checkbox / Disabled">
            <Checkbox state="disabled" label="Sous vide" />
          </StateRow>
        </Section>

        {/* RECIPE CARDS */}
        <Section title="Recipe Card" description="Core unit of the weekly plan. Two options shown per day; the user taps to select.">
          <StateRow label="Default">
            <div style={{ width: 360 }}>
              <RecipeCard
                title="Sheet Pan Lemon Chicken"
                description="Roasted chicken thighs with potatoes, onions, and herbs. A weeknight workhorse."
                prepTime="35 min"
                tags={["one-pan", "high-protein"]}
              />
            </div>
          </StateRow>
          <StateRow label="Hover">
            <div style={{ width: 360 }}>
              <RecipeCard
                title="Sheet Pan Lemon Chicken"
                description="Roasted chicken thighs with potatoes, onions, and herbs. A weeknight workhorse."
                prepTime="35 min"
                tags={["one-pan", "high-protein"]}
                state="hover"
              />
            </div>
          </StateRow>
          <StateRow label="Selected">
            <div style={{ width: 360 }}>
              <RecipeCard
                title="Sheet Pan Lemon Chicken"
                description="Roasted chicken thighs with potatoes, onions, and herbs."
                prepTime="35 min"
                tags={["one-pan", "high-protein"]}
                state="selected"
              />
            </div>
          </StateRow>
          <StateRow label="Dimmed">
            <div style={{ width: 360 }}>
              <RecipeCard
                title="Coconut Curry Shrimp"
                description="Quick weeknight curry with jasmine rice and snap peas."
                prepTime="25 min"
                tags={["quick", "weeknight"]}
                state="dimmed"
              />
            </div>
          </StateRow>
        </Section>

        {/* DAY SECTION */}
        <Section title="Day Section" description="Wrapper used on the weekly plan screen. One per day, contains two recipe options.">
          <StateRow label="Pending">
            <div style={{ width: 360 }}>
              <DaySection day="Monday" date="Apr 28" state="pending" />
            </div>
          </StateRow>
          <StateRow label="Selected">
            <div style={{ width: 360 }}>
              <DaySection day="Tuesday" date="Apr 29" state="selected" />
            </div>
          </StateRow>
        </Section>

        {/* GROCERY ROW */}
        <Section title="Grocery Row" description="One row per ingredient. Tap to check off; supports manual items and aggregation source.">
          <StateRow label="Default">
            <div style={{ width: 420, background: C.neutral[0], borderRadius: 12, padding: "0 4px" }}>
              <GroceryRow name="Chicken thighs" quantity="2 lbs" source="Sheet Pan Lemon Chicken" />
            </div>
          </StateRow>
          <StateRow label="Hover">
            <div style={{ width: 420, background: C.neutral[0], borderRadius: 12, padding: "0 4px" }}>
              <GroceryRow name="Chicken thighs" quantity="2 lbs" source="Sheet Pan Lemon Chicken" state="hover" />
            </div>
          </StateRow>
          <StateRow label="Checked">
            <div style={{ width: 420, background: C.neutral[0], borderRadius: 12, padding: "0 4px" }}>
              <GroceryRow name="Chicken thighs" quantity="2 lbs" source="Sheet Pan Lemon Chicken" state="checked" />
            </div>
          </StateRow>
          <StateRow label="Manual + Removable">
            <div style={{ width: 420, background: C.neutral[0], borderRadius: 12, padding: "0 4px" }}>
              <GroceryRow name="Paper towels" source="" isManual onRemove={() => {}} />
            </div>
          </StateRow>
        </Section>

        {/* CARDS, BADGES, AVATAR */}
        <Section title="Containers & Identifiers">
          <StateRow label="Card / md elevation">
            <div style={{ width: 320 }}>
              <Card>
                <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: C.neutral[700], textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                  Your Kitchen Profile
                </div>
                <div style={{ fontSize: "0.875rem", color: C.neutral[600] }}>
                  18 staples · 3 tools · Preferences set
                </div>
              </Card>
            </div>
          </StateRow>
          <StateRow label="Card / lg elevation">
            <div style={{ width: 320 }}>
              <Card elevation="lg">
                <div style={{ fontSize: "0.875rem", color: C.neutral[800] }}>Lifted card for modals & emphasis.</div>
              </Card>
            </div>
          </StateRow>
          <StateRow label="Badge">
            <Badge tone="primary">Week of Apr 28</Badge>
            <Badge tone="accent">New</Badge>
            <Badge tone="neutral">Pending</Badge>
          </StateRow>
          <StateRow label="Avatar">
            <Avatar initial="J" />
            <Avatar initial="M" size={40} />
          </StateRow>
          <StateRow label="Stepper / Step 1">
            <StepperDots total={3} current={1} />
          </StateRow>
          <StateRow label="Stepper / Step 2">
            <StepperDots total={3} current={2} />
          </StateRow>
          <StateRow label="Stepper / Step 3">
            <StepperDots total={3} current={3} />
          </StateRow>
        </Section>

        {/* RATING */}
        <Section title="Rating Buttons" description="Binary thumbs up/down used in the post-meal rating prompt.">
          <StateRow label="Default">
            <button style={{ width: 64, height: 64, borderRadius: 16, background: C.neutral[0], border: `1.5px solid ${C.neutral[200]}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.neutral[600], boxShadow: shadow.sm }}>
              <Ico.ThumbUp size={26} />
            </button>
            <button style={{ width: 64, height: 64, borderRadius: 16, background: C.neutral[0], border: `1.5px solid ${C.neutral[200]}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.neutral[600], boxShadow: shadow.sm }}>
              <Ico.ThumbDown size={26} />
            </button>
          </StateRow>
          <StateRow label="Selected (up)">
            <button style={{ width: 64, height: 64, borderRadius: 16, background: C.primary[600], border: `1.5px solid ${C.primary[600]}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: `0 6px 16px ${C.primary[200]}` }}>
              <Ico.ThumbUp size={26} />
            </button>
          </StateRow>
          <StateRow label="Selected (down)">
            <button style={{ width: 64, height: 64, borderRadius: 16, background: C.danger[500], border: `1.5px solid ${C.danger[500]}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: `0 6px 16px ${C.danger[100]}` }}>
              <Ico.ThumbDown size={26} />
            </button>
          </StateRow>
        </Section>

        {/* NAVIGATION */}
        <Section title="Bottom Navigation" description="Persistent across primary screens. Active tab is sage with a small dot indicator.">
          <StateRow label="Active: Home">
            <div style={{ width: 360 }}><BottomNav active="home" /></div>
          </StateRow>
          <StateRow label="Active: Grocery">
            <div style={{ width: 360 }}><BottomNav active="list" /></div>
          </StateRow>
          <StateRow label="Active: Kitchen">
            <div style={{ width: 360 }}><BottomNav active="settings" /></div>
          </StateRow>
        </Section>

        {/* EDGE STATES */}
        <Section title="Edge States" description="Empty and error states. Use these whenever a list, plan, or fetch can be empty or fail.">
          <StateRow label="Empty">
            <div style={{ width: 420, background: C.neutral[0], borderRadius: radius.lg, boxShadow: shadow.sm }}>
              <EmptyState
                title="No grocery list yet"
                body="Confirm your weekly plan and we'll build your list automatically — staples and on-hand items excluded."
                ctaLabel="Add manual item"
              />
            </div>
          </StateRow>
          <StateRow label="Error / Banner">
            <div style={{ width: 420 }}>
              <ErrorBanner
                message="Couldn't generate your plan. Check your connection and try again."
                onRetry={() => {}}
              />
            </div>
          </StateRow>
          <StateRow label="Error / Inline (input)">
            <div style={{ width: 320 }}>
              <TextInput
                placeholder="Add an exclusion"
                state="error"
                value=""
                helperText="Please enter at least one ingredient"
              />
            </div>
          </StateRow>
        </Section>

        {/* USAGE NOTES */}
        <Section title="Implementation Notes" description="For Claude Code as it builds the app from these primitives.">
          <ul style={{ fontFamily: fontStack, fontSize: "0.875rem", color: C.neutral[700], lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
            <li>All components consume the <code style={{ background: C.neutral[200], padding: "1px 5px", borderRadius: 4, fontSize: "0.8125rem" }}>C</code> token object — do not introduce new hex values without updating the palette.</li>
            <li>Border radius is <code style={{ background: C.neutral[200], padding: "1px 5px", borderRadius: 4, fontSize: "0.8125rem" }}>14px</code> for cards/buttons, <code style={{ background: C.neutral[200], padding: "1px 5px", borderRadius: 4, fontSize: "0.8125rem" }}>10px</code> for inputs, <code style={{ background: C.neutral[200], padding: "1px 5px", borderRadius: 4, fontSize: "0.8125rem" }}>9999px</code> for chips/badges. Keep this consistent.</li>
            <li>Primary CTA always uses the <code style={{ background: C.neutral[200], padding: "1px 5px", borderRadius: 4, fontSize: "0.8125rem" }}>primary[500] → primary[600]</code> gradient with the colored shadow. Do not flatten it.</li>
            <li>Hover and active states are visually distinct (lighter bg vs. compressed scale + tighter shadow). Match the patterns shown above.</li>
            <li>Disabled never relies on opacity alone — it changes both background and text color so it's legible-but-clearly-off.</li>
            <li>Touch targets: minimum 44px height for any tap target on mobile (buttons, rows, chips, checkboxes-with-label).</li>
            <li>Typography: DM Sans only. Headings use <code style={{ background: C.neutral[200], padding: "1px 5px", borderRadius: 4, fontSize: "0.8125rem" }}>letterSpacing: -0.02em</code>. Body is the default tracking.</li>
            <li>Replace the emoji thumbnail in <code style={{ background: C.neutral[200], padding: "1px 5px", borderRadius: 4, fontSize: "0.8125rem" }}>RecipeCard</code> with the Allrecipes image when available.</li>
          </ul>
        </Section>

      </div>
    </div>
  );
}
