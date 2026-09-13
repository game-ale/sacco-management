import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Globe } from "lucide-react";

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "am", label: "አማርኛ", flag: "🇪🇹" },
  { code: "om", label: "Afaan Oromoo", flag: "🇪🇹" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(
    i18n.resolvedLanguage || i18n.language || "en",
  );

  useEffect(() => {
    const handleLanguageChanged = (nextLanguage: string) => {
      setLanguage(nextLanguage.split("-")[0]);
    };

    handleLanguageChanged(i18n.resolvedLanguage || i18n.language || "en");
    i18n.on("languageChanged", handleLanguageChanged);
    return () => i18n.off("languageChanged", handleLanguageChanged);
  }, [i18n]);

  const handleLanguageChange = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    i18n.changeLanguage(nextLanguage);
  };

  return (
    <label
      className="relative inline-flex h-7 w-10 items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
      data-i18n-ignore="true"
    >
      <span className="sr-only">Language</span>
      <span
        className="pointer-events-none flex items-center gap-0.5 text-sm leading-none"
        aria-hidden="true"
      >
        <Globe className="h-3.5 w-3.5" strokeWidth={2} />
        <span>
          {languages.find((option) => option.code === language)?.flag ?? "🇺🇸"}
        </span>
        <ChevronDown className="h-2.5 w-2.5" strokeWidth={2.5} />
      </span>
      <select
        value={language}
        onChange={(event) => handleLanguageChange(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 outline-none"
        aria-label="Language"
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
