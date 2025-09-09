"use client";


import { ColumnDef } from "@tanstack/react-table"

export type Section = {
  id: string
  name: string
  campus: string
  campus_display: string
  course_year: number
  intake?: {
    id: string
    name: string
    start_time: string
    end_time: string
    semester_display: string
  }
  program?: {
    id: string
    name: string
    code: string
  }
  joined_academic_year?: {
    id: string
    name: string
  }
}

export const columns: ColumnDef<Section>[] = [
  {
    accessorKey: "name",
    header: () => <div className="">Section</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">Section {row.getValue("name")}</div> 
      }
    },
  {
    accessorKey: "program",
     header: () => <div className="">Program</div>,
    cell: ({ row }) => {
      const program = row.getValue("program") as Section["program"]
      return <div className=" font-medium">{program ? `${program.code} - ${program.name}` : "-"}</div> 
      }
  },
  {
    accessorKey: "campus_display",
    header: () => <div className="">Campus</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("campus_display")}</div> 
      }
  },
  {
    accessorKey: "course_year",
    header: () => <div className="">Year</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">Year {row.getValue("course_year")}</div> 
      }
  },
  {
    accessorKey: "intake",
    header: () => <div className="">Term</div>,
    cell: ({ row }) => {
      const intake = row.getValue("intake") as Section["intake"]
      return <div className=" font-medium">{intake ? intake.name : "-"}</div> 
      }
  },
  {
    accessorKey: "joined_academic_year",
    header: () => <div className="">Intake</div>,
    cell: ({ row }) => {
      const academicYear = row.getValue("joined_academic_year") as Section["joined_academic_year"]
      return <div className=" font-medium">{academicYear ? academicYear.name : "-"}</div> 
      }
  },
]