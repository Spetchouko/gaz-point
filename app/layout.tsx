import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import LayoutClient from '@/app/layout-client';
import { LangProvider } from '@/app/_components/lang-provider';
import { PublicHeader } from '@/app/_components/public-header';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.gazpoints.com'),
  title: {
    template: '%s | GazPoints',
    absolute: 'GazPoints – Trouvez votre bouteille de gaz au Cameroun',
  },
  description: 'GazPoints est la plateforme qui vous permet de rechercher et de vérifier la disponibilité des bouteilles de gaz auprès des points de vente au Cameroun. Trouvez le gaz près de chez vous sans vous déplacer inutilement.',
  authors: [{ name: 'GazPoints' }],
  creator: 'GazPoints',
  publisher: 'GazPoints',
  keywords: [
    'gaz bouteille disponibilité Cameroun',
    'trouver gaz Douala',
    'point de vente gaz Cameroun',
    'bouteille gaz 6 kg 12,5 kg',
    'gaz domestique Cameroun',
    'GazPoints',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.gazpoints.com',
    siteName: 'GazPoints',
    title: 'GazPoints – Trouvez votre bouteille de gaz au Cameroun',
    description: 'GazPoints est la plateforme qui vous permet de rechercher et de vérifier la disponibilité des bouteilles de gaz auprès des points de vente au Cameroun.',
    images: [
      {
        url: '/brand/opengraph.jpg',
        width: 1200,
        height: 630,
        alt: 'GazPoints - Trouvez votre gaz au Cameroun',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GazPoints – Trouvez votre bouteille de gaz au Cameroun',
    description: 'GazPoints est la plateforme qui vous permet de rechercher et de vérifier la disponibilité des bouteilles de gaz auprès des points de vente au Cameroun.',
    images: ['/brand/opengraph.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
          </LangProvider>
        </LayoutClient>
      </body>
    </html>
  );
}
