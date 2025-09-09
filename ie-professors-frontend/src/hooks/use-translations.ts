"use client"

import { useState, useEffect } from 'react'
  
type TranslationKey = string
type TranslationValues = Record<string, string | number>

interface Translations {
  [key: string]: any
}

const translations: Record<string, Translations> = {
  en: {
    navigation: {
      faculty_data: "Faculty Data",
      professors: "Professors",
      programs_data: "Programs Data",
      programs: "Programs",
      courses: "Courses",
      terms: "Terms",
      intakes: "Intake",
      sections: "Sections",
      course_deliveries: "Course Deliveries",
      current_intakes: "Current Intakes"
    },
    common: {
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      back: "Back",
      search: "Search",
      filter: "Filter",
      export: "Export",
      import: "Import",
      loading: "Loading...",
      saving: "Saving...",
      updating: "Updating...",
      creating: "Creating...",
      actions: "Actions"
    },
    professors: {
      title: "Professors",
      description: "Manage and view all professors",
      add_professor: "Add Professor",
      edit_professor: "Edit Professor",
      personal_information: "Personal Information",
      professional_information: "Professional Information",
      contact_information: "Contact Information",
      degrees: "Degrees",
      course_possibilities: "Course Possibilities",
      active_courses: "Active Courses",
      name: "Name",
      last_name: "Last Name",
      email: "Personal Email",
      corporate_email: "Corporate Email",
      phone_number: "Phone Number",
      professor_type: "Professor Type",
      gender: "Gender",
      birth_year: "Birth Year",
      joined_year: "Joined Year",
      accredited: "Accredited",
      linkedin_profile: "LinkedIn Profile",
      minimum_number_of_sessions: "PDP (Required Sessions)",
      degree: "Degree",
      course: "Course",
      professor: "Professor",
      campuses: "Campuses",
      availabilities: "Availabilities"
    },
    courses: {
      title: "Courses",
      description: "Manage and view all courses",
      add_course: "Add Course",
      edit_course: "Edit Course",
      course_information: "Course Information",
      course_deliveries: "Course Deliveries",
      course_code: "Course Code",
      course_name: "Course Name",
      course_type: "Course Type",
      credits: "Credits",
      sessions: "Sessions",
      area: "Area"
    },
    sections: {
      title: "Sections",
      description: "Manage and view all sections",
      add_section: "Add Section",
      edit_section: "Edit Section",
      section_information: "Section Information",
      section_name: "Section Name",
      campus: "Campus",
      course_year: "Course Year",
      intake: "Term",
      program: "Program",
      academic_year: "Intake"
    },
    programs: {
      title: "Programs",
      description: "Manage and view all programs",
      add_program: "Add Program",
      edit_program: "Edit Program"
    },
    intakes: {
      title: "Intake",
      description: "Manage and view intake information",
      add_intake: "Add Intake",
      edit_intake: "Edit Intake"
    },
    terms: {
      title: "Terms",
      description: "Manage and view term information",
      add_term: "Add Term",
      edit_term: "Edit Term"
    },
    course_deliveries: {
      title: "Course Deliveries",
      description: "Manage and view course deliveries",
      add_course_delivery: "Add Course Delivery",
      edit_course_delivery: "Edit Course Delivery"
    }
  },
  es: {
    navigation: {
      faculty_data: "Datos de Facultad",
      professors: "Profesores",
      programs_data: "Datos de Programas",
      programs: "Programas",
      courses: "Cursos",
      terms: "Términos",
      intakes: "Admisiones",
      sections: "Secciones",
      course_deliveries: "Entregas de Cursos",
      current_intakes: "Admisiones Actuales"
    },
    common: {
      add: "Agregar",
      edit: "Editar",
      delete: "Eliminar",
      save: "Guardar",
      cancel: "Cancelar",
      back: "Atrás",
      search: "Buscar",
      filter: "Filtrar",
      export: "Exportar",
      import: "Importar",
      loading: "Cargando...",
      saving: "Guardando...",
      updating: "Actualizando...",
      creating: "Creando...",
      actions: "Acciones"
    },
    professors: {
      title: "Profesores",
      description: "Gestionar y ver todos los profesores",
      add_professor: "Agregar Profesor",
      edit_professor: "Editar Profesor",
      personal_information: "Información Personal",
      professional_information: "Información Profesional",
      contact_information: "Información de Contacto",
      degrees: "Títulos",
      course_possibilities: "Posibilidades de Cursos",
      active_courses: "Cursos Activos",
      name: "Nombre",
      last_name: "Apellido",
      email: "Correo Personal",
      corporate_email: "Correo Corporativo",
      phone_number: "Número de Teléfono",
      professor_type: "Tipo de Profesor",
      gender: "Género",
      birth_year: "Año de Nacimiento",
      joined_year: "Año de Ingreso",
      accredited: "Acreditado",
      linkedin_profile: "Perfil de LinkedIn",
      minimum_number_of_sessions: "PDP (Sesiones Requeridas)",
      degree: "Título",
      course: "Curso",
      professor: "Profesor",
      campuses: "Campus",
      availabilities: "Disponibilidades"
    },
    courses: {
      title: "Cursos",
      description: "Gestionar y ver todos los cursos",
      add_course: "Agregar Curso",
      edit_course: "Editar Curso",
      course_information: "Información del Curso",
      course_deliveries: "Entregas de Cursos",
      course_code: "Código del Curso",
      course_name: "Nombre del Curso",
      course_type: "Tipo de Curso",
      credits: "Créditos",
      sessions: "Sesiones",
      area: "Área"
    },
    sections: {
      title: "Secciones",
      description: "Gestionar y ver todas las secciones",
      add_section: "Agregar Sección",
      edit_section: "Editar Sección",
      section_information: "Información de la Sección",
      section_name: "Nombre de la Sección",
      campus: "Campus",
      course_year: "Año del Curso",
      intake: "Admisión",
      program: "Programa",
      academic_year: "Año Académico"
    },
    programs: {
      title: "Programas",
      description: "Gestionar y ver todos los programas",
      add_program: "Agregar Programa",
      edit_program: "Editar Programa"
    },
    intakes: {
      title: "Admisiones",
      description: "Gestionar y ver información de admisiones",
      add_intake: "Agregar Admisión",
      edit_intake: "Editar Admisión"
    },
    terms: {
      title: "Términos",
      description: "Gestionar y ver términos académicos",
      add_term: "Agregar Término",
      edit_term: "Editar Término"
    },
    course_deliveries: {
      title: "Entregas de Cursos",
      description: "Gestionar y ver entregas de cursos",
      add_course_delivery: "Agregar Entrega de Curso",
      edit_course_delivery: "Editar Entrega de Curso"
    }
  }
}

export function useTranslations() {
  const [locale, setLocale] = useState<'en' | 'es'>('en')

  useEffect(() => {
    // Load saved language preference on mount
    const savedLanguage = localStorage.getItem('preferred-language') as 'en' | 'es'
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLocale(savedLanguage)
    }

    // Listen for custom language change events
    const handleLanguageChange = (e: CustomEvent) => {
      const newLang = e.detail.language as 'en' | 'es'
      if (newLang === 'en' || newLang === 'es') {
        setLocale(newLang)
      }
    }

    // Listen for storage changes (for cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'preferred-language' && e.newValue) {
        const newLang = e.newValue as 'en' | 'es'
        if (newLang === 'en' || newLang === 'es') {
          setLocale(newLang)
        }
      }
    }

    window.addEventListener('languageChanged', handleLanguageChange as EventListener)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const t = (key: TranslationKey, values?: TranslationValues): string => {
    const keys = key.split('.')
    let value: any = translations[locale]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback to English if key not found
        value = translations.en
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey]
          } else {
            return key // Return the key if not found in fallback either
          }
        }
        break
      }
    }

    if (typeof value !== 'string') {
      return key
    }

    // Replace placeholders with values
    if (values) {
      return value.replace(/\{(\w+)\}/g, (match, placeholder) => {
        return values[placeholder]?.toString() || match
      })
    }

    return value
  }

  return { t, locale }
}
