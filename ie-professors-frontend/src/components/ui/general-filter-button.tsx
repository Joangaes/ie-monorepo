"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter, X } from "lucide-react"

export interface GeneralFilterConfig {
  key: string
  label: string
  options: FilterOption[]
  multiSelect?: boolean
  placeholder?: string
  loading?: boolean
}

export interface GeneralFilterValues {
  [key: string]: string[]
}

interface GeneralFilterButtonProps {
  filters: GeneralFilterConfig[]
  filterValues: GeneralFilterValues
  onFiltersChange: (filters: GeneralFilterValues) => void
  onClearAll?: () => void
  className?: string
}

export function GeneralFilterButton({
  filters,
  filterValues,
  onFiltersChange,
  onClearAll,
  className = ""
}: GeneralFilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Handle individual filter change
  const handleFilterChange = (filterKey: string, values: string[]) => {
    const newFilters = {
      ...filterValues,
      [filterKey]: values
    }
    onFiltersChange(newFilters)
  }

  // Check if any filters are active
  const hasActiveFilters = Object.values(filterValues).some(values => values.length > 0)
  const activeFilterCount = Object.values(filterValues).reduce(
    (count, values) => count + values.length, 
    0
  )

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters: GeneralFilterValues = {}
    filters.forEach(filter => {
      clearedFilters[filter.key] = []
    })
    onFiltersChange(clearedFilters)
    if (onClearAll) onClearAll()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          className={`flex items-center space-x-2 ${className}`}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 max-h-[500px] overflow-y-auto p-4" 
        align="start"
        sideOffset={5}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filters</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="flex items-center space-x-1 text-sm"
              >
                <X className="h-3 w-3" />
                <span>Clear All</span>
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {filter.label}
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {filter.options.map((option) => {
                    const isSelected = (filterValues[filter.key] || []).includes(option.value)
                    
                    return (
                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded">
                        <input
                          type={filter.multiSelect ? "checkbox" : "radio"}
                          name={filter.multiSelect ? undefined : filter.key}
                          checked={isSelected}
                          onChange={(e) => {
                            const currentValues = filterValues[filter.key] || []
                            let newValues: string[]
                            
                            if (filter.multiSelect) {
                              if (e.target.checked) {
                                newValues = [...currentValues, option.value]
                              } else {
                                newValues = currentValues.filter(v => v !== option.value)
                              }
                            } else {
                              newValues = e.target.checked ? [option.value] : []
                            }
                            
                            handleFilterChange(filter.key, newValues)
                          }}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          {option.label}
                        </span>
                        {option.count !== undefined && (
                          <span className="text-xs text-gray-500 ml-auto">
                            ({option.count})
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {hasActiveFilters && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Active Filters</h4>
              <div className="space-y-1">
                {Object.entries(filterValues).map(([key, values]) => {
                  if (values.length === 0) return null
                  const filter = filters.find(f => f.key === key)
                  if (!filter) return null
                  
                  return (
                    <div key={key} className="text-xs text-muted-foreground">
                      <span className="font-medium">{filter.label}:</span> {values.length} selected
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}