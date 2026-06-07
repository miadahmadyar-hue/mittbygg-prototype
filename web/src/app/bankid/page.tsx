"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/context";
import { Suspense } from "react";

function BankIDContent() {
  const t = useT();
  const [code] = useState(() => generateCode());
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) return;
    const t = setTimeout(() => {
      window.location.href = "/address?auth=ok&name=Demo+Bruker";
    }, 3000);
    return () => clearTimeout(t);
  }, [error]);

  if (error) {
    return (
      <>
        <Topbar title="BankID" />
        <div className="view items-center justify-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-red-50 grid place-items-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-[22px] font-bold tracking-tight">{t("Innlogging feilet", "Sign-in failed")}</h2>
            <p className="mt-2 text-sm text-gray-500">{t("Prøv igjen eller bruk demo-modus.", "Try again or use demo mode.")}</p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-[280px]">
            <Button full onClick={() => { window.location.href = "/address?auth=ok&name=Demo+Bruker"; }}>
              {t("Prøv igjen", "Try again")}
            </Button>
            <Button variant="ghost" full onClick={() => { window.location.href = "/address?auth=ok&name=Demo+Bruker"; }}>
              {t("Fortsett som demo", "Continue as demo")}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="BankID" />
      <div className="view items-center justify-center text-center gap-6">
        <div
          className="rounded-[28px] grid place-items-center"
          style={{ width: 88, height: 88, background: "linear-gradient(135deg, #2156a8, #143670)" }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="6" width="18" height="14" rx="2" />
            <path d="M7 10h10M7 14h6M7 18h4" />
          </svg>
        </div>

        <div>
          <h2 className="text-[22px] font-bold tracking-tight">{t("Bekreft pålogging", "Confirm sign-in")}</h2>
          <p className="mt-2 text-sm text-gray-700">
            {t("Åpne BankID-appen på telefonen og bekreft.", "Open the BankID app on your phone and confirm.")}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 max-w-[280px] w-full">
          <div className="text-center text-3xl tracking-[4px] text-green-500 font-mono">
            {code}
          </div>
          <p className="text-xs text-gray-500 mt-2">{t("Engangskode", "One-time code")}</p>
        </div>

        <div className="spinner" />
        <p className="text-xs text-gray-500">{t("Starter BankID…", "Starting BankID…")}</p>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => { window.location.href = "/address?auth=ok&name=Demo+Bruker"; }}
        >
          ▸ {t("Simuler innlogging", "Simulate sign-in")}
        </Button>
      </div>
    </>
  );
}

export default function BankIDPage() {
  return (
    <Suspense>
      <BankIDContent />
    </Suspense>
  );
}

function generateCode(): string {
  const a = Math.floor(Math.random() * 10);
  const b = Math.floor(Math.random() * 10);
  const c = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  const d = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `${a}${b}-${c}-${d}`;
}
