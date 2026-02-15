'use client';

import { useState } from 'react';
import { ThemeProvider } from '@/components/landing/ThemeProvider';
import { LandingPage } from '@/components/landing/LandingPage';
import dynamic from 'next/dynamic';

const MainApp = dynamic(() => import('@/components/MainApp'), { ssr: false });

export default function Page() {
  const [showApp, setShowApp] = useState(false);

  if (showApp) {
    return (
      <ThemeProvider defaultTheme="dark">
        <MainApp onBackToLanding={() => setShowApp(false)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <LandingPage onLaunchApp={() => setShowApp(true)} />
    </ThemeProvider>
  );
}
