import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import "@/app/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ClientFlow AI",
  description: "Dashboard-first workflow automation SaaS for education consultancies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={manrope.variable} lang="en">
      <body className="font-[family-name:var(--font-sans)] antialiased">
        {children}
      </body>
    </html>
  );
}

