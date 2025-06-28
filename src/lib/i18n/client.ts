import { locales } from '@/i18n/config';

export const getLocaleFromPathname = (pathname: string): string => {
  const segments = pathname.split('/');
  const locale = segments[1];
  return locales.includes(locale as any) ? locale : 'en';
};

export const getPathnameWithoutLocale = (pathname: string): string => {
  const segments = pathname.split('/');
  const locale = segments[1];
  if (locales.includes(locale as any)) {
    return '/' + segments.slice(2).join('/');
  }
  return pathname;
};

export const switchLocale = (currentPathname: string, newLocale: string): string => {
  const pathWithoutLocale = getPathnameWithoutLocale(currentPathname);
  return `/${newLocale}${pathWithoutLocale}`;
}; 