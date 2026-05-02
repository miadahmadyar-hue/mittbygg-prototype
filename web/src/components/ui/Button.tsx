import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-green-500 text-white shadow-[0_1px_0_var(--color-green-700)_inset,0_4px_14px_rgba(10,79,60,0.25)] hover:bg-green-600",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  ghost: "bg-transparent text-green-500 hover:bg-green-50",
  danger: "bg-red-500 text-white hover:opacity-90",
};

const SIZE: Record<Size, string> = {
  sm: "px-3.5 py-2 text-sm rounded-lg",
  md: "px-5 py-3.5 text-base rounded-xl",
  lg: "px-6 py-4.5 text-lg rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", full, className = "", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={[
          "inline-flex items-center justify-center gap-2 font-semibold",
          "transition-[transform,background,box-shadow] active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          VARIANT[variant],
          SIZE[size],
          full ? "w-full flex" : "",
          className,
        ].join(" ")}
        {...props}
      />
    );
  },
);
