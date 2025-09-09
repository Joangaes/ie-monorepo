"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onNext?: () => void
  onPrevious?: () => void
  disableNext?: boolean
  disablePrevious?: boolean
  loading?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onNext,
  onPrevious,
  disableNext,
  disablePrevious,
  loading,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-[600px] text-sm sm:text-base">
  <TableHeader className="sticky top-0 z-10 bg-white shadow-sm">
    {table.getHeaderGroups().map((headerGroup) => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map((header) => (
          <TableHead
            key={header.id}
            className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wide text-xs sm:text-sm"
          >
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
          </TableHead>
        ))}
      </TableRow>
    ))}
  </TableHeader>
  <TableBody>
    {table.getRowModel().rows?.length ? (
      table.getRowModel().rows.map((row, i) => (
        <TableRow
          key={row.id}
          className={i % 2 === 0 ? "bg-muted/30" : ""}
          data-state={row.getIsSelected() && "selected"}
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell
              key={cell.id}
              className="px-4 py-3 whitespace-nowrap text-sm"
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={columns.length} className="h-24 text-center">
          {loading ? "Loading..." : "No results."}
        </TableCell>
      </TableRow>
    )}
  </TableBody>
</Table>

      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={disablePrevious || loading}
          className="w-full sm:w-auto"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={disableNext || loading}
          className="w-full sm:w-auto"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
