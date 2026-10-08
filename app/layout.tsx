import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/app/header";
import { Footer } from "@/app/_components/footer";
import { RecherchePermanente } from "@/app/_components/recherche-permanente";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: "GazPoint - Trouve ton gaz avant de te déplacer",
  description:
    "Vérifie la disponibilité des bouteilles de gaz près de chez toi. Évite les déplacements inutiles, économise temps et argent. Trouve le bon point de vente en 2 min.",
  keywords: [
    "gaz bouteilles",
    "points de vente gaz",
    "disponibilité gaz",
    "trouver gaz près de moi",
    "livraison gaz",
    "gaz domestique",
    "bouteille gaz prix",
    "gaz butane propane",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="GazPoint" />
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <RecherchePermanente />
      </body>
    </html>
  );
}
