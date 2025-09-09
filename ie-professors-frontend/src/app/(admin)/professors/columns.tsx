"use client";


import { ColumnDef } from "@tanstack/react-table"

export type Professor = {
  id: string
  name: string
  last_name: string
  corporate_email: string
  professor_type_display:string
}

export const columns: ColumnDef<Professor>[] = [

  {
    accessorKey: "name",
    header: () => <div className="">Name</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("name")}</div> 
      }
    },
  {
    accessorKey: "last_name",
     header: () => <div className="">Last Name</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("last_name")}</div> 
      }
  },
  {
    accessorKey: "corporate_email",
    header: () => <div className="">Corporate Email</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("corporate_email")}</div> 
      }
  },
  {
    accessorKey: "professor_type_display",
    header: () => <div className="">Professor Type</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("professor_type_display")}</div> 
      }
  },
]