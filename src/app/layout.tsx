import type { Metadata } from "next";
import { Figtree, Rubik } from "next/font/google";

import NextTopLoader from "nextjs-toploader";

import { ThemeProvider } from "@/lib/providers/theme-provider";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { brand } from "@/lib/constants/brand";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" suppressHydrationWarning>
      <AuthProvider>
        <body className={`${figtree.variable} ${rubik.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="theme-preference"
          >
            <NextTopLoader showSpinner={false} />
            {children}
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </body>
      </AuthProvider>
    </html>
  );
}
