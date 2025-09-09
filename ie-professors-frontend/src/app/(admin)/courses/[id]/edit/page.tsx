"use client"

import { AdminTabbedForm, FieldConfig, TabConfig, InlineConfig } from "@/components/admin/admin-tabbed-form"
import { useTranslations } from "@/hooks/use-translations"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

interface EditCourseProps {
  params: {
    id: string
  }
}

export default function EditCourse({ params }: EditCourseProps) {
  const { t } = useTranslations()

  const courseFields: FieldConfig[] = [
    // Basic Information Tab
    { key: 'code', label: t('courses.course_code'), type: 'text', required: true, tab: 'basic' },
    { key: 'name', label: t('courses.course_name'), type: 'text', required: true, tab: 'basic' },
    { 
      key: 'course_type', 
      label: t('courses.course_type'), 
      type: 'select',
      tab: 'basic',
      options: [
        { value: 'BA', label: 'Basic' },
        { value: 'OB', label: 'Obligatory' },
        { value: 'OP', label: 'Optional' },
        { value: 'CA', label: 'Complementary Activity' },
        { value: 'EL', label: 'Electives' },
        { value: 'RE', label: 'Regular' },
        { value: 'OACT', label: 'Other Activities' },
      ]
    },
    { key: 'credits', label: t('courses.credits'), type: 'number', required: true, tab: 'basic' },
    { key: 'sessions', label: t('courses.sessions'), type: 'number', required: true, tab: 'basic' },
    { 
      key: 'area', 
      label: t('courses.area'), 
      type: 'foreign-key',
      tab: 'basic',
      foreignKeyConfig: {
        endpoint: `${process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE}/api/areas`,
        displayField: 'name',
        valueField: 'id'
      }
    },
  ]

  const courseTabs: TabConfig[] = [
    { key: 'basic', label: t('courses.course_information'), fields: ['code', 'name', 'course_type', 'credits', 'sessions', 'area'] },
  ]

  const courseInlines: InlineConfig[] = [
    {
      key: 'deliveries',
      label: t('courses.course_deliveries'),
      endpoint: `${base_url}/api/course-deliveries`,
      foreignKeyField: 'course',
      tab: 'basic',
      fields: [
        { 
          key: 'professor', 
          label: t('professors.professor'), 
          type: 'foreign-key',
          foreignKeyConfig: {
            endpoint: `${base_url}/api/professors`,
            displayField: 'name',
            valueField: 'id'
          }
        },
      ]
    }
  ]

  return (
    <AdminTabbedForm
      title={t('courses.edit_course')}
      endpoint={`${base_url}/api/courses`}
      fields={courseFields}
      tabs={courseTabs}
      inlines={courseInlines}
      recordId={params.id}
      backPath="/courses"
      entityName={t('courses.title').slice(0, -1)}
    />
  )
}
