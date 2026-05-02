import { ReactNode } from "react";

type Variant = "default" | "green" | "amber" | "red" | "blue";

const STYLES: Record<Variant, string> = {
  default: "bg-gray-100 text-gray-700",
  green:   "bg-[#dcebe2] text-green-700",
  amber:   "bg-amber-50 text-amber-500",
  red:     "bg-red-50 text-red-500",
  blue:    "bg-[#e3edf7] text-[#2156a8]",
};

export function Pill({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STYLES[variant]}`}
    >
      {children}
    </span>
  );
}
