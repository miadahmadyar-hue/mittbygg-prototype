"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { useT } from "@/lib/i18n/context";
import { Brand } from "./Brand";
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
    <header className="sticky top-0 z-20 shrink-0 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-[1220px] items-center gap-4 px-4 md:h-[72px] md:px-8">
        {back && (
          <button
            type="button"
            aria-label={t("Tilbake", "Back")}
            onClick={() => router.back()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[5px] border border-gray-200 bg-white transition-colors hover:bg-gray-50"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        <div className="hidden md:block"><Brand /></div>
        {title ? (
          <div className="min-w-0 flex-1 truncate border-l border-gray-200 pl-4 text-sm font-semibold text-gray-700 md:ml-2">
            {title}
          </div>
        ) : (
          <>
            <div className="flex-1 md:hidden"><Brand /></div>
            <div className="hidden flex-1 md:block" />
          </>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {right}
          <LangToggle />
        </div>
      </div>
    </header>
  );
}
