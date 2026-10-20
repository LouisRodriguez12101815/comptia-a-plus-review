import { defineRouting } from "next-intl/routing";

export const locales = ["en", "fr", "es", "pt"] as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  pt: "Português",
};

// `as-needed` keeps English at its existing unprefixed URLs (/notes/...) and
// serves the other locales under /fr, /es and /pt.
export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "as-needed",
});
