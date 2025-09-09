"use client"

import { AdminTabbedForm, FieldConfig, TabConfig, InlineConfig } from "@/components/admin/admin-tabbed-form"
import { useTranslations } from "@/hooks/use-translations"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

interface EditProfessorProps {
  params: {
    id: string
  }
}

export default function EditProfessor({ params }: EditProfessorProps) {
  const { t } = useTranslations()

  const professorFields: FieldConfig[] = [
    // Personal Information Tab
    { key: 'name', label: t('professors.name'), type: 'text', required: true, tab: 'personal' },
    { key: 'last_name', label: t('professors.last_name'), type: 'text', required: true, tab: 'personal' },
    { key: 'birth_year', label: t('professors.birth_year'), type: 'number', tab: 'personal' },
    { key: 'gender', label: t('professors.gender'), type: 'select', tab: 'personal', options: [
      { value: 'H', label: 'Male' },
      { value: 'M', label: 'Female' },
    ]},
    
    // Professional Information Tab
    { key: 'professor_type', label: t('professors.professor_type'), type: 'select', tab: 'professional', options: [
      { value: 'f', label: 'Faculty' },
      { value: 'a', label: 'Adjunct Professor' },
      { value: 'v', label: 'Visiting Professor' },
    ]},
    { key: 'joined_year', label: t('professors.joined_year'), type: 'number', tab: 'professional' },
    { key: 'minimum_number_of_sessions', label: t('professors.minimum_number_of_sessions'), type: 'number', defaultValue: 0, tab: 'professional' },
    { key: 'accredited', label: t('professors.accredited'), type: 'boolean', defaultValue: false, tab: 'professional' },
    { key: 'campuses', label: t('professors.campuses'), type: 'multi-select', tab: 'professional', defaultValue: [], options: [
      { value: 'Segovia', label: 'Segovia' },
      { value: 'Madrid A', label: 'Madrid IE Tower' },
      { value: 'Madrid B', label: 'Madrid Maria de Molina' },
    ]},
    { key: 'availabilities', label: t('professors.availabilities'), type: 'multi-select', tab: 'professional', defaultValue: [], options: [
      { value: 'morning', label: 'Morning' },
      { value: 'afternoon', label: 'Afternoon' },
    ]},
    
    // Contact Information Tab
    { key: 'email', label: t('professors.email'), type: 'email', required: true, tab: 'contact' },
    { key: 'corporate_email', label: t('professors.corporate_email'), type: 'email', tab: 'contact' },
    { key: 'phone_number', label: t('professors.phone_number'), type: 'text', tab: 'contact' },
    { key: 'linkedin_profile', label: t('professors.linkedin_profile'), type: 'text', tab: 'contact' },
  ]

  const professorTabs: TabConfig[] = [
    { key: 'personal', label: t('professors.personal_information'), fields: ['name', 'last_name', 'birth_year', 'gender'] },
    { key: 'professional', label: t('professors.professional_information'), fields: ['professor_type', 'joined_year', 'minimum_number_of_sessions', 'accredited', 'campuses', 'availabilities'] },
    { key: 'contact', label: t('professors.contact_information'), fields: ['email', 'corporate_email', 'phone_number', 'linkedin_profile'] },
  ]

  const professorInlines: InlineConfig[] = [
    {
      key: 'degrees',
      label: t('professors.degrees'),
      endpoint: `${base_url}/api/professor-degrees`,
      foreignKeyField: 'professor',
      tab: 'professional',
      fields: [
        { 
          key: 'degree', 
          label: t('professors.degree'), 
          type: 'foreign-key',
          foreignKeyConfig: {
            endpoint: `${base_url}/api/degrees`,
            displayField: 'name',
            valueField: 'id'
          }
        },
      ]
    },
    {
      key: 'course_possibilities',
      label: t('professors.course_possibilities'),
      endpoint: `${base_url}/api/professor-course-possibilities`,
      foreignKeyField: 'professor',
      tab: 'professional',
      fields: [
        { 
          key: 'course', 
          label: t('professors.course'), 
          type: 'foreign-key',
          foreignKeyConfig: {
            endpoint: `${base_url}/api/courses`,
            displayField: 'name',
            valueField: 'id'
          }
        },
      ]
    },
    {
      key: 'active_courses',
      label: t('professors.active_courses'),
      endpoint: `${base_url}/api/course-deliveries`,
      foreignKeyField: 'professor',
      tab: 'professional',
      fields: [
        { 
          key: 'course', 
          label: t('professors.course'), 
          type: 'foreign-key',
          foreignKeyConfig: {
            endpoint: `${base_url}/api/courses`,
            displayField: 'name',
            valueField: 'id'
          },
          readonly: true
        },
      ]
    }
  ]

  return (
    <AdminTabbedForm
      title={t('professors.edit_professor')}
      endpoint={`${base_url}/api/professors`}
      fields={professorFields}
      tabs={professorTabs}
      inlines={professorInlines}
      recordId={params.id}
      backPath="/professors"
      entityName={t('professors.title').slice(0, -1)} // Remove 's' to get singular
    />
  )
}
