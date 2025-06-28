import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'he'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Debug logs for i18n config
  console.log("🔍 I18n Config Debug:");
  console.log("Requested locale:", locale);
  console.log("Available locales:", locales);
  console.log("Default locale:", defaultLocale);
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    console.log("⚠️ Invalid locale, using default:", locale, "->", defaultLocale);
    // Instead of notFound(), we'll use the default locale
    locale = defaultLocale;
  }

  try {
    const messages = (await import(`./locales/${locale}.json`)).default;
    console.log("✅ Successfully loaded messages for locale:", locale);
    console.log("📄 Messages keys:", Object.keys(messages));
    console.log("📄 Dashboard keys:", Object.keys(messages.dashboard || {}));
    console.log("📄 Protocols keys:", Object.keys(messages.dashboard?.protocols || {}));
    console.log("📄 Attachments keys:", Object.keys(messages.dashboard?.protocols?.attachments || {}));
    console.log("📄 Messages keys:", Object.keys(messages.dashboard?.protocols?.messages || {}));
    
    return {
      locale: locale as string,
      messages
    };
  } catch (error) {
    console.error("❌ Failed to load messages for locale:", locale, error);
    throw error;
  }
}); 