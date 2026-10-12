import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  appleWebApp: { capable: true, title: "NATESTAGRAM", statusBarStyle: "default" },
  title: "○ NATESTAGRAM",
  description: "A quiet, personal photo gallery without social noise.",
  openGraph: {
    title: "○ NATESTAGRAM",
    description: "A quiet, personal photo gallery without social noise.",
    siteName: "○ NATESTAGRAM",
    type: "website",
  },
  twitter: {
    title: "○ NATESTAGRAM",
    description: "A quiet, personal photo gallery without social noise.",
    card: "summary_large_image",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
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
      <body className={`${bodyFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
