"use client";

import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { LangToggle } from "@/components/ui/LangToggle";
import { useT } from "@/lib/i18n/context";

export default function HomePage() {
  const t = useT();

  return (
    <main className="bg-white">
      <section className="relative flex min-h-[78dvh] flex-col overflow-hidden bg-green-700 text-white">
        <Image
          src="/soknadsklar-home.webp"
          alt={t("Moderne norsk trehus i landskapet", "Modern Norwegian timber home in the landscape")}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#0d241dcf]" aria-hidden />

        <nav className="relative z-10 mx-auto flex h-[76px] w-full max-w-[1220px] items-center justify-between px-5 md:px-8">
          <Brand inverse />
          <div className="flex items-center gap-3">
            <LangToggle className="border-white/25 bg-white/10 text-white" />
            <Link
              href="/bankid"
              className="hidden min-h-10 items-center rounded-[5px] border border-white/35 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:inline-flex"
            >
              {t("Logg inn", "Sign in")}
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex w-full max-w-[1220px] flex-1 items-center px-5 py-12 md:px-8 md:py-16">
          <div className="max-w-[760px]">
            <p className="text-xs font-extrabold uppercase text-[#e2a17e]">
              {t("Digital byggerådgivning", "Digital building advisory")}
            </p>
            <h1 className="mt-5 font-serif text-[64px] font-medium leading-[0.92] text-white sm:text-[82px] md:text-[104px]">
              Søknadsklar
            </h1>
            <p className="mt-6 max-w-[680px] font-serif text-[27px] leading-[1.15] text-white sm:text-[34px] md:text-[42px]">
              {t("Trygg vei gjennom byggesaken.", "A clearer path through your building project.")}
            </p>
            <p className="mt-5 max-w-[620px] text-base leading-7 text-white/72 md:text-lg">
              {t(
                "Eiendomsdata, regelsjekk og profesjonell dokumentasjon samlet i én strukturert prosess.",
                "Property data, regulatory review and professional documentation in one structured process.",
              )}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/address"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-[6px] bg-white px-6 text-[15px] font-bold text-green-700 transition-colors hover:bg-gray-50"
              >
                {t("Start med eiendommen", "Start with your property")}
                <ArrowIcon />
              </Link>
              <Link
                href="/bankid"
                className="inline-flex min-h-12 items-center justify-center rounded-[6px] border border-white/35 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t("Logg inn med BankID", "Sign in with BankID")}
              </Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/20">
          <div className="mx-auto grid w-full max-w-[1220px] grid-cols-1 gap-4 px-5 py-5 text-sm text-white/70 sm:grid-cols-3 md:px-8">
            <Assurance number="01" text={t("Eiendomsdata fra offentlige kilder", "Property data from public sources")} />
            <Assurance number="02" text={t("Regelvurdering mot PBL, SAK10 og TEK17", "Review against Norwegian building regulation")} />
            <Assurance number="03" text={t("Dokumentasjon klar for neste steg", "Documentation prepared for the next step")} />
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-[1220px] gap-8 px-5 py-12 md:grid-cols-[0.8fr_1.2fr] md:px-8 md:py-16">
          <div>
            <p className="page-kicker">{t("Én samlet oversikt", "One clear overview")}</p>
            <h2 className="mt-3 max-w-[420px] font-serif text-3xl font-medium leading-tight text-gray-900 md:text-4xl">
              {t("Bedre beslutninger før du bygger.", "Better decisions before you build.")}
            </h2>
          </div>
          <p className="max-w-[680px] text-base leading-7 text-gray-600 md:text-lg">
            {t(
              "Søknadsklar samler det som vanligvis ligger spredt hos kommune, rådgivere og fagfolk. Du får en tydelig vurdering av saken, hva som mangler og hvilke steg som følger.",
              "Søknadsklar brings together information normally spread across municipalities, advisers and specialists. You get a clear assessment, the missing documentation and the next steps.",
            )}
          </p>
        </div>
      </section>
    </main>
  );
}

function Assurance({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="font-mono text-xs font-bold text-[#e2a17e]">{number}</span>
      <span>{text}</span>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
