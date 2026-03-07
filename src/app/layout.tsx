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
        <footer className="px-4 py-3 sm:px-8">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-start text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500/90 sm:text-xs">
            <a
              href="https://nategrieb.com"
              target="_blank"
              rel="noreferrer noopener"
              className="transition-colors duration-150 hover:text-zinc-800 focus-visible:text-zinc-800"
              aria-label="Visit nategrieb.com"
            >
              NATE GRIEB
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
