'use client';

import { useState } from 'react';
import { ThemeProvider } from '@/components/landing/ThemeProvider';
import { LandingPage } from '@/components/landing/LandingPage';
import { Button } from '@/components/ui/button';
import {
  Brain,
  Settings,
  Bot,
  Layout,
} from 'lucide-react';
import { SettingsDialog } from '@/components/SettingsDialog';
import dynamic from 'next/dynamic';

// Dynamically import the main app to avoid SSR issues with ReactFlow
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
