import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "MittBygg | Digital byggerådgivning",
  description:
    "Digital byggerådgivning for norske boligeiere. Eiendomsdata, regelsjekk og dokumentasjon samlet på ett sted.",
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
