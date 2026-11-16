'use client';

import { ErrorBoundary } from '@/app/_components/ErrorBoundary';
import { ThemeProvider } from '@/app/_components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';

export default function LayoutClient({ children, role }: { children: React.ReactNode; role?: string }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary fallback={<div className="p-8 bg-red-50 border border-red-200 rounded-lg shadow-sm">Une erreur est survenue.</div>}>
          {children}
          <Toaster position="bottom-right" />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}