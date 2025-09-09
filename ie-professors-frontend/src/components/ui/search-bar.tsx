"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  initialValue?: string
  className?: string
}

export function SearchBar({ 
  placeholder = "Search...", 
  onSearch, 
  initialValue = "",
  className = ""
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue)

  useEffect(() => {
    setSearchQuery(initialValue)
  }, [initialValue])

  const handleSearch = () => {
    onSearch(searchQuery.trim())
  }

  const handleClear = () => {
    setSearchQuery("")
    onSearch("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}