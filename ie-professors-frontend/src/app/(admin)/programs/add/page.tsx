"use client"

import { AdminForm, FieldConfig } from "@/components/admin/admin-form"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

const programFields: FieldConfig[] = [
  { key: 'name', label: 'Program Name', type: 'text', required: true },
  { key: 'code', label: 'Program Code', type: 'text', required: true },
  { 
    key: 'school', 
    label: 'School', 
    type: 'select',
    options: [
      { value: 'business', label: 'Business School' },
      { value: 'law', label: 'Law School' },
      { value: 'sci_and_tech', label: 'Science and Technology School' },
      { value: 'humanities', label: 'School of Humanities' },
      { value: 'econ_glo_affa', label: 'Politics, Economics and Global Affairs School' },
      { value: 'arch', label: 'School of Architecture and Design' },
    ]
  },
  { 
    key: 'type', 
    label: 'Program Type', 
    type: 'select',
    options: [
      { value: 'ba', label: 'Bachelors' },
      { value: 'ma', label: 'Master' },
    ]
  },
  { 
    key: 'years', 
    label: 'Years', 
    type: 'number', 
    required: true,
    defaultValue: 4,
    helpText: 'Duration of the program in years'
  },
  { 
    key: 'academic_director_id', 
    label: 'Academic Director', 
    type: 'autocomplete',
    apiEndpoint: `${process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE}/api/auth/users/`,
    displayField: 'full_name',
    searchField: 'search'
  },
]

export default function AddProgram() {
  return (
    <AdminForm
      title="Add Program"
      endpoint={`${base_url}/api/programs`}
      fields={programFields}
      backPath="/programs"
      entityName="Program"
    />
  )
}
