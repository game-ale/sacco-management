import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { Button } from '../components/ui/button'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'am' : 'en'
    i18n.changeLanguage(newLang)
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleLanguage} title="Toggle language">
      <Globe className="h-5 w-5" />
      <span className="sr-only">Toggle language</span>
    </Button>
  )
}
