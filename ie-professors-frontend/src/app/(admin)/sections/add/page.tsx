"use client"

import { AdminForm, FieldConfig } from "@/components/admin/admin-form"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

const sectionFields: FieldConfig[] = [
  { 
    key: 'name', 
    label: 'Section Name', 
    type: 'text', 
    required: true
  },
  { 
    key: 'campus', 
    label: 'Campus', 
    type: 'select', 
    required: true,
    options: [
      { value: 'Segovia', label: 'Segovia' },
      { value: 'Madrid A', label: 'Madrid IE Tower' },
      { value: 'Madrid B', label: 'Madrid Maria de Molina' },
    ]
  },
  { key: 'course_year', label: 'Course Year', type: 'number', required: true, defaultValue: 1 },
  { 
    key: 'intake', 
    label: 'Term', 
    type: 'foreign-key',
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
    foreignKeyConfig: {
      endpoint: `${process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE}/api/joined-academic-years`,
      displayField: 'name',
      valueField: 'id'
    }
  },
]

export default function AddSection() {
  return (
    <AdminForm
      title="Add Section"
      endpoint={`${base_url}/api/sections`}
      fields={sectionFields}
      backPath="/sections"
      entityName="Section"
    />
  )
}
