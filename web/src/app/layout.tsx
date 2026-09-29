import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  metadataBase: new URL("https://soknadsklar.no"),
  applicationName: "Søknadsklar",
  title: {
    default: "Søknadsklar | Digital byggerådgivning",
    template: "%s | Søknadsklar",
  },
  description:
    "Digital byggerådgivning for norske boligeiere. Fra eiendomsdata og regelsjekk til søknadsklar dokumentasjon.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName: "Søknadsklar",
    title: "Søknadsklar | Digital byggerådgivning",
    description: "Fra eiendomsdata og regelsjekk til søknadsklar dokumentasjon.",
    url: "/",
    images: [{ url: "/soknadsklar-home.webp", width: 1672, height: 941 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#214c3d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="no">
      <body>
        <LangProvider>
          <div className="shell">{children}</div>
        </LangProvider>
      </body>
    </html>
  );
}
