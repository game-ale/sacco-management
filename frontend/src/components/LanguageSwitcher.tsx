import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
  { code: 'om', label: 'Afaan Oromoo' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [language, setLanguage] = useState(i18n.resolvedLanguage || i18n.language || 'en')

  useEffect(() => {
    const handleLanguageChanged = (nextLanguage: string) => {
      setLanguage(nextLanguage.split('-')[0])
    }

    handleLanguageChanged(i18n.resolvedLanguage || i18n.language || 'en')
    i18n.on('languageChanged', handleLanguageChanged)
    return () => i18n.off('languageChanged', handleLanguageChanged)
  }, [i18n])

  const handleLanguageChange = (nextLanguage: string) => {
    setLanguage(nextLanguage)
    i18n.changeLanguage(nextLanguage)
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800" data-i18n-ignore="true">
      <Globe className="h-5 w-5" />
      <span className="sr-only">Language</span>
      <select
        value={language}
        onChange={(event) => handleLanguageChange(event.target.value)}
        className="cursor-pointer bg-transparent text-sm font-medium outline-none"
        aria-label="Language"
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  )
}
