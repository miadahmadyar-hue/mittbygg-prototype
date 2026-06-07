"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { useT } from "@/lib/i18n/context";
import { LangToggle } from "./LangToggle";

interface TopbarProps {
  title?: string;
  back?: boolean;
  right?: ReactNode;
}

export function Topbar({ title = "", back = true, right }: TopbarProps) {
  const router = useRouter();
  const t = useT();
  return (
    <div className="flex items-center justify-between px-5 h-14 bg-white border-b border-gray-100 sticky top-0 z-10 shrink-0">
      <div className="w-9">
        {back && (
          <button
            type="button"
            aria-label={t("Tilbake", "Back")}
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 grid place-items-center transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>
      <div className="font-semibold text-base truncate px-2">{title}</div>
      <div className="flex items-center gap-2 justify-end shrink-0">
        {right}
        <LangToggle />
      </div>
    </div>
  );
}
