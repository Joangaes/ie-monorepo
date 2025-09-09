"use client";


import { ColumnDef } from "@tanstack/react-table"

export type Intake = {
  id: string
  name: string
  start_date: string
}

export const columns: ColumnDef<Intake>[] = [
  {
    accessorKey: "name",
    header: () => <div className="">Name</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("name")}</div> 
      }
    },
  {
    accessorKey: "start_date",
     header: () => <div className="">Start Date</div>,
    cell: ({ row }) => {
      const date = new Date(row.getValue("start_date"))
      return <div className=" font-medium">{date.toLocaleDateString()}</div> 
      }
  },
]