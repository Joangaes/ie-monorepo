"use client"

import { AdminForm, FieldConfig } from "@/components/admin/admin-form"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

const termFields: FieldConfig[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'start_time', label: 'Start Date', type: 'date', required: true },
  { key: 'end_time', label: 'End Date', type: 'date', required: true },
  { 
    key: 'semester', 
    label: 'Semester', 
    type: 'select',
    options: [
      { value: 'fall', label: 'Fall' },
      { value: 'spring', label: 'Spring' },
    ]
  },
  { key: 'active', label: 'Active', type: 'boolean', defaultValue: true },
]

interface EditTermProps {
  params: {
    id: string
  }
}

export default function EditTerm({ params }: EditTermProps) {
  return (
    <AdminForm
      title="Edit Term"
      endpoint={`${base_url}/api/intakes`}
      fields={termFields}
      recordId={params.id}
      backPath="/terms"
      entityName="Term"
    />
  )
}
