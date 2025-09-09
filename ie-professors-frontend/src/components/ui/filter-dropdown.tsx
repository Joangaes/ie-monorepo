"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Filter, X } from "lucide-react"

export interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterDropdownProps {
  label: string
  options: FilterOption[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  multiSelect?: boolean
  placeholder?: string
  className?: string
  loading?: boolean
}

export function FilterDropdown({
  label,
  options,
  selectedValues,
  onSelectionChange,
  multiSelect = true,
  placeholder = "Select options...",
  className = "",
  loading = false
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelectionChange = (value: string, checked: boolean) => {
    if (multiSelect) {
      if (checked) {
        onSelectionChange([...selectedValues, value])
      } else {
        onSelectionChange(selectedValues.filter(v => v !== value))
      }
    } else {
      onSelectionChange(checked ? [value] : [])
      setIsOpen(false)
    }
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder
    if (selectedValues.length === 1) {
      const option = options.find(o => o.value === selectedValues[0])
      return option?.label || selectedValues[0]
    }
    return `${selectedValues.length} selected`
  }

  const hasSelection = selectedValues.length > 0

  return (
    <div className={`relative ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={hasSelection ? "default" : "outline"}
            size="sm"
            disabled={loading}
            className={`flex items-center justify-between min-w-[120px] ${
              hasSelection ? "bg-primary text-primary-foreground" : ""
            }`}
          >
            <div className="flex items-center space-x-1">
              <Filter className="h-3 w-3" />
              <span className="truncate">{label}</span>
            </div>
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel className="flex items-center justify-between">
            {label}
            {hasSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
            <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
          ) : options.length === 0 ? (
            <DropdownMenuItem disabled>No options available</DropdownMenuItem>
          ) : (
            options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedValues.includes(option.value)}
                onCheckedChange={(checked) => 
                  handleSelectionChange(option.value, checked)
                }
              >
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({option.count})
                    </span>
                  )}
                </div>
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}