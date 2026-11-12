import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import LayoutClient from '@/app/layout-client';
import { LangProvider } from '@/app/_components/lang-provider';
import { PublicHeader } from '@/app/_components/public-header';
import { PublicFooter } from '@/app/_components/public-footer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gazpoints.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | GazPoints',
    default: 'GazPoints - Trouvez du gaz près de chez vous',
  },
  description:
    'Vérifiez la disponibilité des bouteilles de gaz près de chez vous. Points de vente, distance, numéro du vendeur. Évitez les déplacements inutiles au Cameroun.',
  keywords: [
    'disponibilité gaz Cameroun',
    'où trouver bouteille gaz Douala',
    'point de vente gaz proximité',
    'recherche bouteille gaz',
    'disponibilité bouteille gaz 12,5 kg',
    'dépôt de gaz Douala',
    'gaz domestique Cameroun',
    'GazPoints',
  ],
  authors: [{ name: 'GazPoints', url: SITE_URL }],
  creator: 'GazPoints',
  publisher: 'GazPoints',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: 'GazPoints',
    title: 'GazPoints - Trouvez du gaz près de chez vous',
    description:
      'Vérifiez la disponibilité des bouteilles de gaz près de chez vous. Points de vente, distance, numéro du vendeur.',
    images: [
      {
        url: '/brand/hero.webp',
        width: 1200,
        height: 630,
        alt: 'GazPoints - Trouvez du gaz près de chez vous',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GazPoints - Trouvez du gaz près de chez vous',
    description:
      'Vérifiez la disponibilité des bouteilles de gaz près de chez vous.',
    images: ['/brand/hero.webp'],
  },
  verification: {
    google: process.env.GOOGLE_SEARCH_CONSOLE_VERIFICATION || undefined,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const role = 'client';
  return (
    <html lang="fr">
      <body>
        <LayoutClient role={role}>
          <LangProvider>
            <PublicHeader />
            {children}
            <PublicFooter />
          </LangProvider>
        </LayoutClient>
      </body>
    </html>
  );
}
