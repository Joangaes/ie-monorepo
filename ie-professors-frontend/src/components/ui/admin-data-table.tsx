"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, Plus, Edit } from "lucide-react"
import { toast } from "react-hot-toast"
import { ImportExport } from "@/components/admin/import-export"

interface AdminDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onNext?: () => void
  onPrevious?: () => void
  disableNext?: boolean
  disablePrevious?: boolean
  loading?: boolean
  
  // Page-based features
  entityName: string
  basePath: string // e.g., "/professors", "/courses"
  onBulkDelete?: (recordIds: string[]) => void
  
  // Import/Export features
  enableImportExport?: boolean
  apiEndpoint?: string
  exportFields?: string[]
}

export function AdminDataTable<TData, TValue>({
  columns,
  data,
  onNext,
  onPrevious,
  disableNext,
  disablePrevious,
  loading,
  entityName,
  basePath,
  onBulkDelete,
  enableImportExport = false,
  apiEndpoint,
  exportFields = [],
}: AdminDataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1)
  const router = useRouter()

  // Add row selection column and actions column
  const enhancedColumns: ColumnDef<TData, TValue>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(value) => table.toggleAllPageRowsSelected(!!value.target.checked)}
          className="h-4 w-4"
        />
      ),
      cell: ({ row }) => {
        const handleRowSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
          const isChecked = e.target.checked
          const currentIndex = row.index

          if (e.nativeEvent.shiftKey && lastSelectedIndex !== -1) {
            // Shift+click: select range
            const startIndex = Math.min(lastSelectedIndex, currentIndex)
            const endIndex = Math.max(lastSelectedIndex, currentIndex)
            
            const newSelection: RowSelectionState = { ...rowSelection }
            
            // Select all rows in range
            for (let i = startIndex; i <= endIndex; i++) {
              const rowId = i.toString()
              newSelection[rowId] = isChecked
            }
            
            setRowSelection(newSelection)
          } else {
            // Normal click: toggle single row
            row.toggleSelected(isChecked)
            setLastSelectedIndex(currentIndex)
          }
        }

        return (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={handleRowSelect}
            className="h-4 w-4"
            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
          />
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
    ...columns.map(column => ({
      ...column,
      cell: (props: any) => {
        const originalCell = typeof column.cell === 'function' ? column.cell(props) : props.getValue()
        const record = props.row.original as any
        
        return (
          <div 
            className="cursor-pointer hover:bg-muted/50 p-1 rounded"
            onClick={(e) => {
              if (e.shiftKey || e.ctrlKey || e.metaKey) {
                // Shift/Ctrl+click: handle selection
                e.preventDefault()
                const currentIndex = props.row.index
                
                if (e.shiftKey && lastSelectedIndex !== -1) {
                  // Shift+click: select range
                  const startIndex = Math.min(lastSelectedIndex, currentIndex)
                  const endIndex = Math.max(lastSelectedIndex, currentIndex)
                  
                  const newSelection: RowSelectionState = { ...rowSelection }
                  
                  for (let i = startIndex; i <= endIndex; i++) {
                    const rowId = i.toString()
                    newSelection[rowId] = true
                  }
                  
                  setRowSelection(newSelection)
                } else {
                  // Ctrl+click: toggle single row
                  props.row.toggleSelected()
                  setLastSelectedIndex(currentIndex)
                }
              } else {
                // Normal click: navigate to edit
                router.push(`${basePath}/${record.id}/edit`)
              }
            }}
          >
            {originalCell}
          </div>
        )
      }
    })),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const record = row.original as any
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`${basePath}/${record.id}/edit`)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )
      },
      enableSorting: false,
    }
  ]

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  })

  const selectedRecords = table.getFilteredSelectedRowModel().rows.map(row => (row.original as any).id)

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A: Select all
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        table.toggleAllPageRowsSelected(true)
      }
      
      // Delete key: Delete selected
      if (e.key === 'Delete' && selectedRecords.length > 0) {
        e.preventDefault()
        handleBulkDelete()
      }
      
      // Escape: Clear selection
      if (e.key === 'Escape') {
        setRowSelection({})
        setLastSelectedIndex(-1)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedRecords.length])

  const handleBulkDelete = () => {
    if (selectedRecords.length > 0 && onBulkDelete) {
      const confirmed = confirm(`Are you sure you want to delete ${selectedRecords.length} ${entityName.toLowerCase()}(s)?`)
      if (confirmed) {
        onBulkDelete(selectedRecords)
        setRowSelection({})
        setLastSelectedIndex(-1)
      }
    }
  }

  const handleAddNew = () => {
    router.push(`${basePath}/add`)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          {selectedRecords.length > 0 && (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete ({selectedRecords.length})</span>
              </Button>
              <div className="text-xs text-muted-foreground">
                Tip: Shift+click to select range, Ctrl+click to select multiple
              </div>
            </>
          )}

        </div>
        
        <div className="flex items-center space-x-2">
          {enableImportExport && apiEndpoint && (
            <ImportExport
              endpoint={apiEndpoint}
              entityName={entityName}
              fields={exportFields}
            />
          )}
          <Button
            onClick={handleAddNew}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add {entityName}</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-[1200px] text-sm sm:text-base">
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
                  className={`transition-colors duration-200 ${
                    row.getIsSelected() 
                      ? "bg-primary/10 border-primary/20" 
                      : i % 2 === 0 ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/30"
                  }`}
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
                <TableCell colSpan={enhancedColumns.length} className="h-24 text-center">
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
