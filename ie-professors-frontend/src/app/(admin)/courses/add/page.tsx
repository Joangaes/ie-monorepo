"use client"

import { AdminForm, FieldConfig } from "@/components/admin/admin-form"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

const courseFields: FieldConfig[] = [
  { key: 'code', label: 'Course Code', type: 'text', required: true },
  { key: 'name', label: 'Course Name', type: 'text', required: true },
  { 
    key: 'course_type', 
    label: 'Course Type', 
    type: 'select',
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
  { key: 'credits', label: 'Credits', type: 'number', required: true },
  { key: 'sessions', label: 'Sessions', type: 'number', required: true },
  { 
    key: 'area', 
    label: 'Area', 
    type: 'foreign-key',
    foreignKeyConfig: {
      endpoint: `${process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE}/api/areas`,
      displayField: 'name',
      valueField: 'id'
    }
  },
]

export default function AddCourse() {
  return (
    <AdminForm
      title="Add Course"
      endpoint={`${base_url}/api/courses`}
      fields={courseFields}
      backPath="/courses"
      entityName="Course"
    />
  )
}
