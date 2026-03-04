import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DesktopSidebar } from "@/components/Sidebar";
import { MobileNavbar } from "@/components/MobileNavbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Ape Intelligence OS",
  description: "Blindado y Operativo.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ape Intelligence",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} bg-[#0A0A0A] text-white`}>
        <div className="flex min-h-screen">
          <div className="hidden lg:block">
            <DesktopSidebar />
          </div>
          <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        </div>
        <MobileNavbar />
      </body>
    </html>
  );
}
