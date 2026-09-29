"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/context";

function BankIDContent() {
  const t = useT();
  const [code] = useState(() => generateCode());
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) return;
    const timer = setTimeout(() => {
      window.location.href = "/address?auth=ok&name=Demo+Bruker";
    }, 3000);
    return () => clearTimeout(timer);
  }, [error]);

  const continueToApp = () => {
    window.location.href = "/address?auth=ok&name=Demo+Bruker";
  };

  return (
    <>
      <Topbar title="BankID" />
      <main className="view items-center justify-center">
        <section className="panel w-full max-w-[520px] px-6 py-8 text-center md:px-10 md:py-10">
          <div className={`mx-auto grid h-14 w-14 place-items-center rounded-[6px] ${error ? "bg-red-50 text-red-500" : "bg-[#315b70] text-white"}`}>
            {error ? <ErrorIcon /> : <IdentityIcon />}
          </div>

          <p className="page-kicker mt-6">{t("Sikker innlogging", "Secure sign-in")}</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            {error ? t("Innlogging feilet", "Sign-in failed") : t("Bekreft pålogging", "Confirm sign-in")}
          </h1>
          <p className="mx-auto mt-3 max-w-[380px] text-sm leading-6 text-gray-500">
            {error
              ? t("Vi kunne ikke fullføre innloggingen. Prøv igjen eller fortsett i demoen.", "We could not complete sign-in. Try again or continue in the demo.")
              : t("Åpne BankID-appen på telefonen og kontroller at koden er den samme.", "Open the BankID app on your phone and confirm that the code matches.")}
          </p>

          {!error && (
            <>
              <div className="mx-auto mt-6 w-full max-w-[280px] border-y border-gray-200 py-5">
                <div className="font-mono text-3xl font-semibold text-green-600">{code}</div>
                <p className="mt-2 text-xs text-gray-500">{t("Kontrollkode", "Verification code")}</p>
              </div>
              <div className="mt-6 flex items-center justify-center gap-3 text-xs text-gray-500">
                <div className="spinner" />
                <span>{t("Venter på bekreftelse", "Waiting for confirmation")}</span>
              </div>
            </>
          )}

          <div className="mx-auto mt-7 flex w-full max-w-[300px] flex-col gap-2">
            {error && <Button full onClick={continueToApp}>{t("Prøv igjen", "Try again")}</Button>}
            <Button variant="ghost" full onClick={continueToApp}>
              {error ? t("Fortsett som demo", "Continue as demo") : t("Simuler innlogging", "Simulate sign-in")}
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}

export default function BankIDPage() {
  return <Suspense><BankIDContent /></Suspense>;
}

function generateCode(): string {
  const first = Math.floor(Math.random() * 10);
  const second = Math.floor(Math.random() * 10);
  const third = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  const fourth = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `${first}${second}-${third}-${fourth}`;
}

function IdentityIcon() {
  return <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M7 10h10M7 14h6M7 18h4" /></svg>;
}

function ErrorIcon() {
  return <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>;
}
