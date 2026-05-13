"use client";

import { tokens } from "@/lib/tokens";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function TextInput({
  label,
  error,
  helperText,
  id,
  className = "",
  style,
  ...props
}: TextInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium"
          style={{ color: tokens.colors.neutral[700] }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full transition-all duration-150 outline-none ${className}`}
        style={{
          borderRadius: tokens.radius.md,
          border: error
            ? `1.5px solid ${tokens.colors.danger[500]}`
            : `1.5px solid ${tokens.colors.neutral[200]}`,
          padding: "12px 14px",
          fontSize: tokens.typography.fontSize.base,
          color: tokens.colors.neutral[900],
          background: error ? tokens.colors.danger[50] : tokens.colors.neutral[0],
          boxShadow: error
            ? `0 0 0 3px ${tokens.colors.danger[100]}`
            : undefined,
          ...style,
        }}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = tokens.colors.primary[500];
            e.currentTarget.style.boxShadow = `0 0 0 3px ${tokens.colors.primary[100]}`;
          }
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = tokens.colors.neutral[200];
            e.currentTarget.style.boxShadow = "none";
          }
          props.onBlur?.(e);
        }}
        {...props}
      />
      {(error ?? helperText) && (
        <p
          className="text-xs"
          style={{ color: error ? tokens.colors.danger[600] : tokens.colors.neutral[500] }}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}
