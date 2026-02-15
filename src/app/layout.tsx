import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Multi-Agent System",
  description: "A hierarchical multi-agent framework with visual builder for creating, orchestrating, and deploying AI agent systems",
  keywords: ["ai", "agents", "multi-agent", "orchestration", "llm", "openai", "ollama", "visual-builder", "typescript", "nextjs"],
  authors: [{ name: "Multi-Agent Team" }],
  icons: {
    icon: "/logo.svg", // This points to your logo in the public folder
  },
  openGraph: {
    title: "Multi-Agent System",
    description: "A hierarchical multi-agent framework with visual builder",
    url: "https://your-domain.com",
    siteName: "Multi-Agent System",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Multi-Agent System",
    description: "A hierarchical multi-agent framework with visual builder",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
