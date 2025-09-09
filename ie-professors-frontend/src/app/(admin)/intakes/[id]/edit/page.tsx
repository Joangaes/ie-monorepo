"use client"

import { AdminForm, FieldConfig } from "@/components/admin/admin-form"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

const intakeFields: FieldConfig[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'start_date', label: 'Start Date', type: 'date', required: true },
]

interface EditIntakeProps {
  params: {
    id: string
  }
}

export default function EditIntake({ params }: EditIntakeProps) {
  return (
    <AdminForm
      title="Edit Intake"
      endpoint={`${base_url}/api/joined-academic-years`}
      fields={intakeFields}
      recordId={params.id}
      backPath="/intakes"
      entityName="Intake"
    />
  )
}
