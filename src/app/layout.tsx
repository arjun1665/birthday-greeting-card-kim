import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Providers } from "@/components/Providers";
import LoadingScreen from "@/components/LoadingScreen";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://happy-birthday.kim"),
  title: {
    default: "Someone has something for you...",
    template: "%s | Happy Birthday, Kim 🎂",
  },
  description: "A little universe built just for Kim.",
  applicationName: "Happy Birthday Kim",
  keywords: ["birthday", "Kim", "gift", "celebration", "celestial", "starfield", "universe"],
  authors: [{ name: "Your LOVELY IDIOT", url: "https://happy-birthday.kim" }],
  creator: "Your LOVELY IDIOT",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Happy Birthday, Kim 🎂",
    description: "A little universe built just for you.",
    url: "https://happy-birthday.kim",
    siteName: "Happy Birthday Kim",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Happy Birthday, Kim 🎂",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Happy Birthday, Kim 🎂",
    description: "A little universe built just for you.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
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
      <body className="h-full overflow-hidden flex flex-col bg-background text-on-surface">
        <LoadingScreen />
        <Providers>{children}</Providers>
        <Script
          src="https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
