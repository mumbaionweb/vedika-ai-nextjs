import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/layout/MainLayout";
import { CoinsProvider } from "@/contexts/CoinsContext";
import { DeepgramContextProvider } from "@/contexts/DeepgramContext";
import { MicrophoneContextProvider } from "@/contexts/MicrophoneContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vedika AI - Enterprise AI Solution",
  description: "Chat-based Agentic AI Solution for Enterprise",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CoinsProvider>
          <DeepgramContextProvider>
            <MicrophoneContextProvider>
              <MainLayout>{children}</MainLayout>
            </MicrophoneContextProvider>
          </DeepgramContextProvider>
        </CoinsProvider>
      </body>
    </html>
  );
}

