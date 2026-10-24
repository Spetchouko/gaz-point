import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/_components/theme-provider";
import { LangProvider } from "@/app/_components/lang-provider";
import { Header } from "@/app/header";
import { Footer } from "@/app/_components/footer";
import { RecherchePermanente } from "@/app/_components/recherche-permanente";
import { ConsentBanner } from "@/app/_components/consent-banner";
import { LangUpdater } from "@/app/_components/lang-updater";
import { NavigationLoader } from "@/app/_components/navigation-loader";
import { PwaRegistration } from "@/app/_components/pwa-registration";
import { PwaInstallPrompt } from "@/app/_components/pwa-install-prompt";

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
  title: "GazPoints - Trouve ton gaz avant de te déplacer",
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
        <meta name="apple-mobile-web-app-title" content="GazPoints" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("gaz-theme");if(t==="dark")document.documentElement.classList.add("dark");else if(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");}catch(e){}})();`,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LangProvider>
            <LangUpdater />
            <NavigationLoader />
            <Header />
          <main className="flex-1">{children}</main>
            <Footer />
          </LangProvider>
        </ThemeProvider>
        <RecherchePermanente />
        <ConsentBanner />
        <PwaRegistration />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}