import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "STASH. — Zero-Knowledge Net Worth",
  description: "E2EE Gen-Z Net Worth & Bill Tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#09090B] text-zinc-100 min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
