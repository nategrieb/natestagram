import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
    icon: "/square-4-grid.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} antialiased`}>{children}</body>
    </html>
  );
}
