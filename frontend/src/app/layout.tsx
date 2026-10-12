import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/context/Web3Provider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingBackground } from "@/components/layout/FloatingBackground";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/* Runs before first paint: a saved choice wins, otherwise follow the OS setting.
   Prevents a flash of the wrong theme. Keep the key in sync with ThemeToggle.tsx */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('bcl-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BCL Onchain | Blockchain LAUTECH Club",
  description: "The official Web3 identity, task verification, and achievement platform for Blockchain Club LAUTECH.",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-transparent.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} min-h-screen flex flex-col font-sans antialiased relative overflow-x-hidden w-full max-w-[100vw]`}
      >
        <Web3Provider>
          <FloatingBackground />
          <div className="relative z-10 flex flex-col min-h-screen w-full overflow-x-hidden">
            <Navbar />
            <main className="flex-1 flex flex-col w-full overflow-x-hidden">{children}</main>
            <Footer />
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
