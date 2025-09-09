"use client";


import { ColumnDef } from "@tanstack/react-table"

export type Term = {
  id: string
  name: string
  start_time: string
  end_time: string
  semester: string
  semester_display: string
  active: boolean
}

export const columns: ColumnDef<Term>[] = [
  {
    accessorKey: "name",
    header: () => <div className="">Name</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("name")}</div> 
      }
    },
  {
    accessorKey: "start_time",
     header: () => <div className="">Start Date</div>,
    cell: ({ row }) => {
      const date = new Date(row.getValue("start_time"))
      return <div className=" font-medium">{date.toLocaleDateString()}</div> 
      }
  },
  {
    accessorKey: "end_time",
    header: () => <div className="">End Date</div>,
    cell: ({ row }) => {
      const date = new Date(row.getValue("end_time"))
      return <div className=" font-medium">{date.toLocaleDateString()}</div> 
      }
  },
  {
    accessorKey: "semester_display",
    header: () => <div className="">Semester</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("semester_display")}</div> 
      }
  },
  {
    accessorKey: "active",
    header: () => <div className="">Active</div>,
    cell: ({ row }) => {
      const isActive = row.getValue("active")
      return <div className=" font-medium">{isActive ? "Yes" : "No"}</div> 
      }
  },
]