import type { ReactNode } from "react";
import type { IconKey } from "@/lib/data/tiltak";

const SVGS: Record<IconKey, ReactNode> = {
  kjeller: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V8l9-6 9 6v13" />
      <path d="M3 13h18M9 21v-5h6v5" />
    </svg>
  ),
  wall: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V3h18v18z" />
      <path d="M3 9h18M3 15h18M9 3v6m6 0v6M9 15v6" />
    </svg>
  ),
  garasje: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V9l9-6 9 6v12" />
      <rect x="7" y="13" width="10" height="8" rx="1" />
    </svg>
  ),
  tilbygg: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V8l8-5v18z" />
      <path d="M14 11h7v10h-7" />
      <path d="M17 8v3M17 14v3" />
    </svg>
  ),
  fasade: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V7l9-5 9 5v14z" />
      <rect x="7" y="11" width="3" height="4" />
      <rect x="14" y="11" width="3" height="4" />
      <path d="M9 21v-3h6v3" />
    </svg>
  ),
  tak: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12 12 4l10 8" />
      <path d="M5 11v8h14v-8" />
    </svg>
  ),
  sol: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  ),
  anneks: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11 12 5l9 6" />
      <path d="M5 10v10h14V10" />
      <rect x="10" y="14" width="4" height="6" />
    </svg>
  ),
  levegg: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V5h16v16" />
      <path d="M4 9h16M4 13h16M4 17h16" />
    </svg>
  ),
  brygge: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 19c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
      <path d="M5 13h14M7 13V7M12 13V5M17 13V8" />
    </svg>
  ),
  ai: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  ),
  geolog: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10l9-7 9 7" />
      <path d="M12 14v7M8 14v3M16 14v5" />
      <ellipse cx="12" cy="14" rx="5" ry="2" />
    </svg>
  ),
  bruksendring: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M8 21H5a2 2 0 0 1-2-2v-3M21 16v3a2 2 0 0 1-2 2h-3" />
      <path d="m9 15 3-3 3 3M12 12V7" />
    </svg>
  ),
  tilleggsdel: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 12h18M12 3v9" />
      <path d="M8 17h2M14 17h2" />
    </svg>
  ),
  boenhet: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V9l6-4v16M15 21V9l6-4v16" />
      <path d="M3 13h6M15 13h6M9 21V5" />
    </svg>
  ),
};

export function TiltakIcon({ k }: { k: IconKey }) {
  return SVGS[k];
}
