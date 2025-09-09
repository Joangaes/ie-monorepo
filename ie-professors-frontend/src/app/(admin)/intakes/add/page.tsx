"use client"

import { AdminForm, FieldConfig } from "@/components/admin/admin-form"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

const intakeFields: FieldConfig[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'start_date', label: 'Start Date', type: 'date', required: true },
]

export default function AddIntake() {
  return (
    <AdminForm
      title="Add Intake"
      endpoint={`${base_url}/api/joined-academic-years`}
      fields={intakeFields}
      backPath="/intakes"
      entityName="Intake"
    />
  )
}
