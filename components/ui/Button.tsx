"use client";

import { tokens } from "@/lib/tokens";

type Variant = "primary" | "secondary" | "ghost" | "accent";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth = false,
  children,
  className = "",
  disabled,
  style,
  ...props
}: ButtonProps) {
  const base = `inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer select-none min-h-[44px] ${fullWidth ? "w-full" : ""}`;

  const variants: Record<Variant, { className: string; style: React.CSSProperties }> = {
    primary: {
      className: `text-white active:scale-[0.985] ${disabled ? "opacity-50 cursor-not-allowed" : ""}`,
      style: {
        background: disabled
          ? tokens.colors.primary[400]
          : `linear-gradient(160deg, ${tokens.colors.primary[500]}, ${tokens.colors.primary[600]})`,
        boxShadow: disabled ? "none" : tokens.shadow.cta,
        borderRadius: tokens.radius.lg,
        padding: "14px 20px",
        fontWeight: tokens.typography.fontWeight.semibold,
      },
    },
    secondary: {
      className: `${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#f3f0ec]"}`,
      style: {
        background: tokens.colors.neutral[0],
        border: `1px solid ${tokens.colors.neutral[200]}`,
        color: tokens.colors.neutral[800],
        boxShadow: tokens.shadow.sm,
        borderRadius: tokens.radius.lg,
        padding: "12px 18px",
        fontWeight: tokens.typography.fontWeight.semibold,
      },
    },
    ghost: {
      className: `${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#f4f7f4]"}`,
      style: {
        background: "transparent",
        color: tokens.colors.primary[700],
        borderRadius: tokens.radius.sm,
        padding: "10px 14px",
        fontWeight: tokens.typography.fontWeight.medium,
      },
    },
    accent: {
      className: `text-white ${disabled ? "opacity-50 cursor-not-allowed" : ""}`,
      style: {
        background: tokens.colors.secondary[500],
        borderRadius: tokens.radius.lg,
        padding: "14px 20px",
        fontWeight: tokens.typography.fontWeight.semibold,
      },
    },
  };

  const v = variants[variant];

  return (
    <button
      className={`${base} ${v.className} ${className}`}
      style={{ ...v.style, ...style }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
