import type { Metadata } from "next";
import { Outfit, Geist_Mono, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pointix — Reservas deportivas",
  description: "Reservá tu cancha online las 24hs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${barlowCondensed.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${outfit.className} min-h-full flex flex-col`}>{children}</body>
    </html>
  );
}
