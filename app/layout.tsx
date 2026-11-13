import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import LayoutClient from '@/app/layout-client';
import { LangProvider } from '@/app/_components/lang-provider';
import { PublicHeader } from '@/app/_components/public-header';

export const metadata: Metadata = {
  title: { absolute: 'GazPoints' },
  description: 'Next.js 16 dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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