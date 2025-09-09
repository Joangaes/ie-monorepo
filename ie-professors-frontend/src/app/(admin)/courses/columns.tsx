"use client";


import { ColumnDef } from "@tanstack/react-table"

export type Course = {
  id: string
  name:string
  code: string
  course_type_display: string
  credits: number
  sessions: number
}

export const columns: ColumnDef<Course>[] = [
{
    accessorKey: "name",
    header: () => <div className="">Name</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("name")}</div> 
      }
    },
  {
    accessorKey: "code",
     header: () => <div className="">Code</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("code") ||  "-"}</div> 
      }
  },
  {
    accessorKey: "course_type_display",
    header: () => <div className="">Course Type</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("course_type_display")||  "-"}</div> 
      }
  },
  {
    accessorKey: "credits",
    header: () => <div className="">Sessions</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("credits")}</div> 
      }
  },
  {
    accessorKey: "sessions",
    header: () => <div className="">Sessions</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("sessions")}</div> 
      }
  },
]