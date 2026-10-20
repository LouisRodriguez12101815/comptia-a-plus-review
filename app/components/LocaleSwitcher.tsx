"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("localeSwitcher");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="inline-flex min-h-11 items-center">
      <span className="sr-only">{t("label")}</span>
      <select
        value={locale}
        onChange={(event) => router.replace(pathname, { locale: event.target.value as Locale })}
        className="min-h-11 rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:border-teal-400 hover:text-white focus:border-teal-400 focus:outline-none"
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeNames[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
