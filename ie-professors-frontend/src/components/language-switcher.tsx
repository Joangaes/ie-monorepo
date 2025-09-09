"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Globe } from "lucide-react"

interface Language {
  code: string
  name: string
  flag: string
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
]

export function LanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0])
  const [isOpen, setIsOpen] = useState(false)

  // Load saved language on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language')
    if (savedLanguage) {
      const language = languages.find(lang => lang.code === savedLanguage)
      if (language) {
        setCurrentLanguage(language)
      }
    }
  }, [])

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language)
    setIsOpen(false)
    
    // Store the selected language in localStorage
    localStorage.setItem('preferred-language', language.code)
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: language.code } 
    }))
    
    // Refresh the page to ensure all components update
    window.location.reload()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-1 px-2">
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Language / Seleccionar Idioma</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {languages.map((language) => (
            <Button
              key={language.code}
              variant={currentLanguage.code === language.code ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleLanguageChange(language)}
            >
              <span className="mr-3 text-lg">{language.flag}</span>
              <span>{language.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
