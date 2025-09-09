"use client"

import { AdminForm, FieldConfig } from "@/components/admin/admin-form"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

const professorFields: FieldConfig[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'last_name', label: 'Last Name', type: 'text', required: true },
  { key: 'email', label: 'Personal Email', type: 'email', required: true },
  { key: 'corporate_email', label: 'Corporate Email', type: 'email' },
  { key: 'phone_number', label: 'Phone Number', type: 'text' },
  { 
    key: 'professor_type', 
    label: 'Professor Type', 
    type: 'select',
    options: [
      { value: 'f', label: 'Faculty' },
      { value: 'a', label: 'Adjunct Professor' },
      { value: 'v', label: 'Visiting Professor' },
    ]
  },
  { 
    key: 'gender', 
    label: 'Gender', 
    type: 'select',
    options: [
      { value: 'H', label: 'Male' },
      { value: 'M', label: 'Female' },
    ]
  },
  { key: 'birth_year', label: 'Birth Year', type: 'number' },
  { key: 'joined_year', label: 'Joined Year', type: 'number' },
  { key: 'minimum_number_of_sessions', label: 'PDP (Required Sessions)', type: 'number', defaultValue: 0 },
  { key: 'accredited', label: 'Accredited', type: 'boolean', defaultValue: false },
  { key: 'linkedin_profile', label: 'LinkedIn Profile', type: 'text' },
]

export default function AddProfessor() {
  return (
    <AdminForm
      title="Add Professor"
      endpoint={`${base_url}/api/professors`}
      fields={professorFields}
      backPath="/professors"
      entityName="Professor"
    />
  )
}
