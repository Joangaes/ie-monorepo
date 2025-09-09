"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AutocompleteOption {
  value: string | number
  label: string
  searchText?: string // Additional text to search through
  subtitle?: string // Optional subtitle to show below the main label
}

interface AutocompleteProps {
  id?: string
  label: string
  value?: string | number
  onChange: (value: string | number | null) => void
  options: AutocompleteOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  loading?: boolean
  allowClear?: boolean
}

export function Autocomplete({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Search...",
  required = false,
  disabled = false,
  className,
  loading = false,
  allowClear = true
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Get the selected option for display
  const selectedOption = options.find(option => option.value == value)

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    
    const term = searchTerm.toLowerCase()
    return options.filter(option => 
      option.label.toLowerCase().includes(term) ||
      option.searchText?.toLowerCase().includes(term) ||
      option.value.toString().toLowerCase().includes(term)
    )
  }, [options, searchTerm])

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [filteredOptions])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        setSearchTerm("")
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchTerm("")
        inputRef.current?.blur()
        break
    }
  }

  // Handle option selection
  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.value)
    setIsOpen(false)
    setSearchTerm("")
    inputRef.current?.blur()
  }

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
    setSearchTerm("")
    inputRef.current?.focus()
  }

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true)
    setSearchTerm("")
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
          listRef.current && !listRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <div 
          className={cn(
            "flex items-center w-full border rounded-md bg-background",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            disabled && "opacity-50 cursor-not-allowed",
            isOpen && "ring-2 ring-ring ring-offset-2"
          )}
        >
          <div className="flex-1 flex items-center min-h-[40px]">
            {isOpen ? (
              <Input
                ref={inputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-2"
              />
            ) : (
              <div
                onClick={handleFocus}
                className="flex-1 p-2 cursor-text min-h-[36px] flex items-center"
              >
                {selectedOption ? (
                  <span className="text-sm">{selectedOption.label}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">{placeholder}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center pr-2 space-x-1">
            {selectedOption && allowClear && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              disabled={disabled}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              {isOpen ? (
                <Search className="h-3 w-3" />
              ) : (
                <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
              )}
            </Button>
          </div>
        </div>

        {/* Dropdown Options */}
        {isOpen && (
          <Card 
            ref={listRef}
            className="absolute z-50 w-full mt-1 max-h-60 overflow-auto border shadow-lg"
          >
            {loading ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              <div className="p-1">
                {filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-md",
                      "hover:bg-accent hover:text-accent-foreground",
                      highlightedIndex === index && "bg-accent text-accent-foreground",
                      selectedOption?.value === option.value && "bg-primary/10 text-primary"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{option.label}</div>
                      {option.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">{option.subtitle}</div>
                      )}
                    </div>
                    {selectedOption?.value === option.value && (
                      <Check className="h-4 w-4 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
