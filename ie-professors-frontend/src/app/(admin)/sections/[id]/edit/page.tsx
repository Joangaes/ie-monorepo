"use client"

import { AdminTabbedForm, FieldConfig, TabConfig, InlineConfig } from "@/components/admin/admin-tabbed-form"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

const sectionFields: FieldConfig[] = [
  // Basic Information Tab
  { 
    key: 'name', 
    label: 'Section Name', 
    type: 'select', 
    required: true,
    tab: 'basic',
    options: [
      { value: 'A', label: 'Section A' },
      { value: 'B', label: 'Section B' },
    ]
  },
  { 
    key: 'campus', 
    label: 'Campus', 
    type: 'select', 
    required: true,
    tab: 'basic',
    options: [
      { value: 'Segovia', label: 'Segovia' },
      { value: 'Madrid A', label: 'Madrid IE Tower' },
      { value: 'Madrid B', label: 'Madrid Maria de Molina' },
    ]
  },
  { key: 'course_year', label: 'Course Year', type: 'number', required: true, defaultValue: 1, tab: 'basic' },
  { 
    key: 'intake', 
    label: 'Term', 
    type: 'foreign-key',
    tab: 'basic',
    foreignKeyConfig: {
      endpoint: `${process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE}/api/intakes`,
      displayField: 'name',
      valueField: 'id'
    }
  },
  { 
    key: 'program', 
    label: 'Program', 
    type: 'foreign-key',
    tab: 'basic',
    foreignKeyConfig: {
      endpoint: `${process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE}/api/programs`,
      displayField: 'name',
      valueField: 'id'
    }
  },
  { 
    key: 'joined_academic_year', 
    label: 'Intake', 
    type: 'foreign-key',
    tab: 'basic',
    foreignKeyConfig: {
      endpoint: `${process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE}/api/joined-academic-years`,
      displayField: 'name',
      valueField: 'id'
    }
  },
]

const sectionTabs: TabConfig[] = [
  { key: 'basic', label: 'Section Information', fields: ['name', 'campus', 'course_year', 'intake', 'program', 'joined_academic_year'] },
]

const sectionInlines: InlineConfig[] = [
  {
    key: 'course_deliveries',
    label: 'Course Deliveries',
    endpoint: `${base_url}/api/course-deliveries`,
    foreignKeyField: 'sections',
    tab: 'basic',
    fields: [
      { 
        key: 'course', 
        label: 'Course', 
        type: 'foreign-key',
        foreignKeyConfig: {
          endpoint: `${base_url}/api/courses`,
          displayField: 'name',
          valueField: 'id'
        }
      },
      { 
        key: 'professor', 
        label: 'Professor', 
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

interface EditSectionProps {
  params: {
    id: string
  }
}

export default function EditSection({ params }: EditSectionProps) {
  return (
    <AdminTabbedForm
      title="Edit Section"
      endpoint={`${base_url}/api/sections`}
      fields={sectionFields}
      tabs={sectionTabs}
      inlines={sectionInlines}
      recordId={params.id}
      backPath="/sections"
      entityName="Section"
    />
  )
}
