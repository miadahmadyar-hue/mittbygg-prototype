import { ReactNode } from "react";

type Variant = "info" | "amber" | "red" | "green";

const STYLES: Record<Variant, string> = {
  info:  "bg-gray-50 border border-gray-200 text-gray-600",
  amber: "bg-amber-50 border border-amber-200 text-amber-900",
  red:   "bg-red-50 border border-red-200 text-red-700",
  green: "bg-green-50 border border-green-200 text-green-700",
};

const ICONS: Record<Variant, ReactNode> = {
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 11v5M12 7h.01" /><circle cx="12" cy="12" r="9" strokeOpacity=".4" />
    </svg>
  ),
  amber: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  red: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  green: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
};

export function Alert({
  variant = "info",
  children,
}: {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex gap-3 p-4 rounded-xl text-sm items-start ${STYLES[variant]}`}
    >
      <span className="shrink-0 mt-0.5">{ICONS[variant]}</span>
      <div className="leading-snug">{children}</div>
    </div>
  );
}
