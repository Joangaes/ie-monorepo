"use client"

import { AdminForm, FieldConfig } from "@/components/admin/admin-form"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

const courseDeliveryFields: FieldConfig[] = [
  { 
    key: 'course', 
    label: 'Course', 
    type: 'foreign-key',
    required: true,
    foreignKeyConfig: {
      endpoint: `${process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE}/api/courses`,
      displayField: 'name',
      valueField: 'id'
    }
  },
  { 
    key: 'professor', 
    label: 'Professor', 
    type: 'foreign-key',
    foreignKeyConfig: {
      endpoint: `${process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE}/api/professors`,
      displayField: 'name',
      valueField: 'id'
    }
  },
]

interface EditCourseDeliveryProps {
  params: {
    id: string
  }
}

export default function EditCourseDelivery({ params }: EditCourseDeliveryProps) {
  return (
    <AdminForm
      title="Edit Course Delivery"
      endpoint={`${base_url}/api/course-deliveries`}
      fields={courseDeliveryFields}
      recordId={params.id}
      backPath="/course-deliveries"
      entityName="Course Delivery"
    />
  )
}
