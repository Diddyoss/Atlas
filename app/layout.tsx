import type { Metadata } from "next";
import { Anton, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Nav } from "@/components/Nav";
import { CompareTray } from "@/components/CompareTray";
import { getCatalogue } from "@/lib/catalogue";
import "./globals.css";

const anton = Anton({ variable: "--font-anton", weight: "400", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", weight: ["400", "500", "600"], subsets: ["latin"] });
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", weight: ["400", "500", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "IRON ATLAS — Compare gym equipment", template: "%s · IRON ATLAS" },
  description:
    "Search and compare strength machines from Hammer Strength, Panatta, Prime, Newtech, Watson, Atlantis, Nautilus and more, including vintage legends.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Slim lookup for the compare tray, so it can show names without fetching
  const lookup = Object.fromEntries(
    getCatalogue().map((i) => [i.slug, { name: i.name, brand: i.brand.name, movement: i.movement, loading: i.loading }]),
  );
  return (
    <html lang="en" className={`${anton.variable} ${plexMono.variable} ${plexSans.variable} antialiased`}>
      <body className="bg-grid min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 pb-32">{children}</main>
        <footer className="border-t border-rivet px-4 py-8 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:justify-between">
            <span className="label text-ash">IRON ATLAS · equipment compendium</span>
            <span className="label text-weld">
              Scores and curves are editorial estimates · images belong to their credited owners
            </span>
          </div>
        </footer>
        <CompareTray lookup={lookup} />
      </body>
    </html>
  );
}
