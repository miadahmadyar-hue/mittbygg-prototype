"use client";
import Link from "next/link";
import { Topbar } from "@/components/ui/Topbar";
import { useT } from "@/lib/i18n/context";

export default function BankIDPage() {
  const t = useT();
  return <><Topbar title={t("Demotilgang", "Demo access")} /><main className="view">
    <section className="panel p-8"><p className="page-kicker">Demo</p>
      <h1 className="mt-3 text-2xl font-semibold">{t("Prøv Søknadsklar uten innlogging", "Try Søknadsklar without signing in")}</h1>
      <p className="mt-4 leading-7">{t("BankID er ikke aktivert i denne demonstrasjonen. Du trenger ikke åpne BankID-appen. Ingen identitet bekreftes, og ingen betaling eller innsending gjennomføres.", "BankID is not enabled in this demonstration. You do not need to open the BankID app. No identity is verified, and no payment or submission takes place.")}</p>
      <p className="mt-3 text-sm text-gray-500">{t("Utkast lagres på denne enheten. Bruk eksempeldata hvis du deler enheten med andre.", "Drafts are saved on this device. Use example data if you share this device.")}</p>
      <Link href="/address" className="primary-link mt-6">{t("Fortsett til demoen", "Continue to demo")}</Link>
    </section></main></>;
}
