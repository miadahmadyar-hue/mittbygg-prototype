import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MittBygg — Fra idé til ferdigattest",
  description:
    "Forbruker-app for byggesøknader. Adresse → tiltak → svar på 60 sekunder.",
};

export const viewport: Viewport = {
  themeColor: "#0a4f3c",
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
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
