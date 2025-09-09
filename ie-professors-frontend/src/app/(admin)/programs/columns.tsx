"use client";


import { ColumnDef } from "@tanstack/react-table"

export type Program = {
  id: string
  name: string
  school: string
  code: string
  type: string
  years: number
  academic_director?: {
    id: string
    username: string
    first_name: string
    last_name: string
  }
}

export const columns: ColumnDef<Program>[] = [
  {
    accessorKey: "code",
    header: () => <div className="">Code</div>,
    cell: ({ row }) => {
      return <div className="font-mono font-medium">{row.getValue("code")}</div> 
      }
    },
  {
    accessorKey: "name",
    header: () => <div className="">Name</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("name")}</div> 
      }
    },
  {
    accessorKey: "school",
     header: () => <div className="">School</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("school")}</div> 
      }
  },
  {
    accessorKey: "type",
    header: () => <div className="">Type</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("type")}</div> 
      }
  },
  {
    accessorKey: "years",
    header: () => <div className="">Years</div>,
    cell: ({ row }) => {
      return <div className=" font-medium">{row.getValue("years")}</div> 
      }
  },
  {
    accessorKey: "academic_director",
    header: () => <div className="">Academic Director</div>,
    cell: ({ row }) => {
      const director = row.getValue("academic_director") as Program["academic_director"]
      return <div className=" font-medium">
        {director ? `${director.first_name} ${director.last_name}` : "-"}
      </div> 
      }
  },
]