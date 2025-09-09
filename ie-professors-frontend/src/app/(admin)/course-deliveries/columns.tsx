"use client";


import { ColumnDef } from "@tanstack/react-table"

export type CourseDelivery = {
  id: string
  course?: {
    id: string
    name: string
    code: string
    course_type_display: string
    credits: number
    sessions: number
  }
  professor?: {
    id: string
    name: string
    last_name: string
    corporate_email: string
    professor_type_display: string
  }
  sections: Array<{
    id: string
    name: string
    campus_display: string
    course_year: number
    program?: {
      id: string
      name: string
      code: string
    }
  }>
}

export const columns: ColumnDef<CourseDelivery>[] = [
  {
    accessorKey: "course",
    header: () => <div className="">Course</div>,
    cell: ({ row }) => {
      const course = row.getValue("course") as CourseDelivery["course"]
      return <div className=" font-medium">{course ? `${course.code} - ${course.name}` : "-"}</div> 
      }
    },
  {
    accessorKey: "professor",
     header: () => <div className="">Professor</div>,
    cell: ({ row }) => {
      const professor = row.getValue("professor") as CourseDelivery["professor"]
      return <div className=" font-medium">{professor ? `${professor.name} ${professor.last_name}` : "Unassigned"}</div> 
      }
  },
  {
    accessorKey: "professor.corporate_email",
    header: () => <div className="">Professor Email</div>,
    cell: ({ row }) => {
      const professor = row.getValue("professor") as CourseDelivery["professor"]
      return <div className=" font-medium">{professor?.corporate_email || "-"}</div> 
      }
  },
  {
    accessorKey: "sections",
    header: () => <div className="">Sections</div>,
    cell: ({ row }) => {
      const sections = row.getValue("sections") as CourseDelivery["sections"]
      if (!sections || sections.length === 0) return <div className=" font-medium">-</div>
      
      const sectionNames = sections.map(section => 
        `Section ${section.name} (${section.campus_display}, Year ${section.course_year})`
      ).join(", ")
      
      return <div className=" font-medium text-sm">{sectionNames}</div> 
      }
  },
  {
    accessorKey: "course.credits",
    header: () => <div className="">Credits</div>,
    cell: ({ row }) => {
      const course = row.getValue("course") as CourseDelivery["course"]
      return <div className=" font-medium">{course?.credits || "-"}</div> 
      }
  },
  {
    accessorKey: "course.sessions",
    header: () => <div className="">Sessions</div>,
    cell: ({ row }) => {
      const course = row.getValue("course") as CourseDelivery["course"]
      return <div className=" font-medium">{course?.sessions || "-"}</div> 
      }
  },
]