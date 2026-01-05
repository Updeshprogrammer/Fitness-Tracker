'use client';

import { SessionProvider } from 'next-auth/react';
import ToastProvider from './ToastProvider';
import ThemeProvider from './ThemeProvider';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}

