import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { CompareTray } from "@/components/CompareTray";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "ATLAS — Strength Machine Index", template: "%s · ATLAS" },
  description:
    "Compare commercial strength machines by brand, muscle and resistance profile. Hammer Strength, Panatta, Prime, Atlantis, Watson and more, plus a vintage section for Nautilus, MedX, Cybex and Flex.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${mono.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <div className="scanline" aria-hidden />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CompareTray />
      </body>
    </html>
  );
}
