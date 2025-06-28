import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { AuthProvider } from "@/lib/providers/auth-provider";
import NextTopLoader from "nextjs-toploader";
import { brand } from "@/lib/constants/brand";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales, defaultLocale } from '@/i18n/config';

const rubik = Rubik({ 
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentLocale = locales.includes(locale as any) ? locale : defaultLocale;
  const messages = await getMessages({ locale: currentLocale });

  return (
    <html lang={currentLocale} suppressHydrationWarning dir={currentLocale === 'he' ? 'rtl' : 'ltr'}>
      <body className={`${rubik.variable} font-sans`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <NextTopLoader showSpinner={false} />
              {children}
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 