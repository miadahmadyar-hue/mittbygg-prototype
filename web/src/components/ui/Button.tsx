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
    "bg-green-500 text-white shadow-sm hover:bg-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500",
  secondary: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
  ghost: "bg-transparent text-green-600 hover:bg-green-50",
  danger: "bg-red-500 text-white hover:opacity-90",
};

const SIZE: Record<Size, string> = {
  sm: "min-h-9 px-3.5 py-2 text-sm rounded-[5px]",
  md: "min-h-11 px-5 py-3 text-[15px] rounded-[6px]",
  lg: "min-h-12 px-6 py-3.5 text-base rounded-[6px]",
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
          "transition-[background,border-color,box-shadow]",
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
