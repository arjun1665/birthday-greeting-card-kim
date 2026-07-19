import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astra for Kim — Celestial Odyssey",
  description:
    "A dreamy birthday adventure through floating realms, starlit constellations, and hidden gifts — crafted with love for Kim.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#121414",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden antialiased dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Playfair+Display:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full overflow-hidden flex flex-col">
        <Providers>{children}</Providers>
        <Script
          src="https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
