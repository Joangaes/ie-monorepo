"use client"

import { useState, useEffect, useCallback } from "react"
import { SearchBar } from "./search-bar"
import { GeneralFilterButton, type GeneralFilterConfig, type GeneralFilterValues } from "./general-filter-button"
import { Button } from "./button"
import { X } from "lucide-react"

interface FilterAndSearchWrapperProps {
  // Search configuration
  searchPlaceholder?: string
  initialSearchValue?: string
  onSearchChange: (query: string) => void

  // Filter configuration  
  filters: GeneralFilterConfig[]
  initialFilterValues?: GeneralFilterValues
  onFiltersChange: (filters: GeneralFilterValues) => void

  // Layout
  className?: string
  showClearAll?: boolean
}

export function FilterAndSearchWrapper({
  searchPlaceholder = "Search...",
  initialSearchValue = "",
  onSearchChange,
  filters,
  initialFilterValues = {},
  onFiltersChange,
  className = "",
  showClearAll = true
}: FilterAndSearchWrapperProps) {
  const [filterValues, setFilterValues] = useState<GeneralFilterValues>(initialFilterValues)
  const [searchValue, setSearchValue] = useState(initialSearchValue)

  // Update filter values when initial values change
  useEffect(() => {
    setFilterValues(initialFilterValues)
  }, [initialFilterValues])

  // Update search value when initial value changes
  useEffect(() => {
    setSearchValue(initialSearchValue)
  }, [initialSearchValue])

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: GeneralFilterValues) => {
    setFilterValues(newFilters)
    onFiltersChange(newFilters)
  }, [onFiltersChange])

  // Handle search change
  const handleSearchChange = useCallback((query: string) => {
    setSearchValue(query)
    onSearchChange(query)
  }, [onSearchChange])

  // Clear all filters and search
  const clearAll = () => {
    const clearedFilters: GeneralFilterValues = {}
    filters.forEach(filter => {
      clearedFilters[filter.key] = []
    })
    setFilterValues(clearedFilters)
    setSearchValue("")
    onFiltersChange(clearedFilters)
    onSearchChange("")
  }

  // Check if any filters or search are active
  const hasActiveFilters = Object.values(filterValues).some(values => values.length > 0)
  const hasActiveSearch = searchValue.trim().length > 0
  const hasAnyActive = hasActiveFilters || hasActiveSearch

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <SearchBar
            placeholder={searchPlaceholder}
            onSearch={handleSearchChange}
            initialValue={searchValue}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* General Filter Button */}
          <GeneralFilterButton
            filters={filters}
            filterValues={filterValues}
            onFiltersChange={handleFilterChange}
            onClearAll={clearAll}
          />
          
          {/* Clear All Button (optional, separate from filter button) */}
          {showClearAll && hasAnyActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="flex items-center space-x-1"
            >
              <X className="h-3 w-3" />
              <span>Clear All</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasAnyActive && (
        <div className="flex flex-wrap gap-2 text-sm">
          {hasActiveSearch && (
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
              Search: "{searchValue}"
            </span>
          )}
          {Object.entries(filterValues).map(([key, values]) => {
            if (values.length === 0) return null
            const filter = filters.find(f => f.key === key)
            if (!filter) return null
            
            return (
              <span key={key} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                {filter.label}: {values.length}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}