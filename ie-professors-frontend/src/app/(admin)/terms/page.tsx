"use client"

import { useState, useEffect } from "react"
import { columns, Term } from "./columns"
import { AdminDataTable } from "../../../components/ui/admin-data-table"
import { FilterAndSearchWrapper } from "@/components/ui/filter-and-search-wrapper"
import { type GeneralFilterConfig, type GeneralFilterValues } from "@/components/ui/general-filter-button"
import { apiGet, apiDelete } from "@/lib/api"
import { toast } from "react-hot-toast"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

export default function Terms() {
  const [data, setData] = useState<Term[]>([])
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [prevUrl, setPrevUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValues, setFilterValues] = useState<GeneralFilterValues>({})


  // Filter configurations for Intake model (Terms)
  const filters: GeneralFilterConfig[] = [
    {
      key: "semester",
      label: "Semester",
      type: "select",
      options: [
        { value: "fall", label: "Fall" },
        { value: "spring", label: "Spring" }
      ]
    },
    {
      key: "active",
      label: "Active",
      type: "select",
      options: [
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" }
      ]
    }
  ]

  const buildQueryParams = (url: string, isInitial: boolean = false) => {
    const params = new URLSearchParams()

    if (searchQuery.trim()) {
      params.append("search", searchQuery.trim())
    }

    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== "") {
        params.append(key, value)
      }
    })

    if (isInitial) {
      params.append("ordering", "-start_time")
    }

    const queryString = params.toString()
    return queryString ? `${url}?${queryString}` : url
  }

  const fetchData = async (url?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const requestUrl = url || buildQueryParams(`${base_url}/api/intakes/`, true)
      const response = await apiGet<{
        results: Term[]
        next: string | null
        previous: string | null
      }>(requestUrl)

      setData(response.results || [])
      setNextUrl(response.next)
      setPrevUrl(response.previous)
    } catch (err: any) {
      setError(err.message || "Failed to fetch terms")
      setData([])
    } finally {
      setLoading(false)
    }
  }



  const handleBulkDelete = async (recordIds: string[]) => {
    try {
      await Promise.all(recordIds.map(id => apiDelete(`${base_url}/api/intakes/${id}/`)))
      toast.success(`Successfully deleted ${recordIds.length} term(s)`)
      fetchData() // Refresh the data
    } catch (error: any) {
      toast.error(`Failed to delete terms: ${error.message}`)
    }
  }

  const handleRecordUpdated = () => {
    fetchData() // Refresh the data
  }



  useEffect(() => {
    fetchData()
  }, [searchQuery, filterValues])

  useEffect(() => {
    fetchData()
  }, [])

  if (error) return <div>Error: {error}</div>

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Terms</h1>
          <p className="text-muted-foreground">Manage and view all academic terms</p>
        </div>
        
        <FilterAndSearchWrapper
          searchPlaceholder="Search terms by name..."
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilterValues}
          initialSearchValue={searchQuery}
          initialFilterValues={filterValues}
        />

        <AdminDataTable
          columns={columns}
          data={data}
          onNext={() => nextUrl && fetchData(nextUrl)}
          onPrevious={() => prevUrl && fetchData(prevUrl)}
          disableNext={!nextUrl}
          disablePrevious={!prevUrl}
          loading={loading}
          entityName="Term"
          basePath="/terms"
          onBulkDelete={handleBulkDelete}
          enableImportExport={true}
          apiEndpoint={`${base_url}/api/intakes`}
          exportFields={['name', 'start_time', 'end_time', 'semester', 'active']}
        />
      </div>
    </div>
  )
}