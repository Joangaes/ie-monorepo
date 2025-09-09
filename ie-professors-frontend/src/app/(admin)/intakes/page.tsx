"use client"

import { useState, useEffect } from "react"
import { columns, Intake } from "./columns"
import { AdminDataTable } from "../../../components/ui/admin-data-table"
import { FilterAndSearchWrapper } from "@/components/ui/filter-and-search-wrapper"
import { type GeneralFilterConfig, type GeneralFilterValues } from "@/components/ui/general-filter-button"
import { apiGet, apiDelete } from "@/lib/api"
import { toast } from "react-hot-toast"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

export default function Intake() {
  const [data, setData] = useState<Intake[]>([])
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [prevUrl, setPrevUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValues, setFilterValues] = useState<GeneralFilterValues>({})


  // Filter configurations - simplified for intake
  const filters: GeneralFilterConfig[] = []

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
      params.append("ordering", "-start_date")
    }

    const queryString = params.toString()
    return queryString ? `${url}?${queryString}` : url
  }

  const fetchData = async (url?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const requestUrl = url || buildQueryParams(`${base_url}/api/joined-academic-years/`, true)
      const response = await apiGet<{
        results: Intake[]
        next: string | null
        previous: string | null
      }>(requestUrl)

      setData(response.results || [])
      setNextUrl(response.next)
      setPrevUrl(response.previous)
    } catch (err: any) {
      setError(err.message || "Failed to fetch intake data")
      setData([])
    } finally {
      setLoading(false)
    }
  }



  const handleBulkDelete = async (recordIds: string[]) => {
    try {
      await Promise.all(recordIds.map(id => apiDelete(`${base_url}/api/joined-academic-years/${id}/`)))
      toast.success(`Successfully deleted ${recordIds.length} intake(s)`)
      fetchData() // Refresh the data
    } catch (error: any) {
      toast.error(`Failed to delete intakes: ${error.message}`)
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
          <h1 className="text-2xl font-bold tracking-tight">Intake</h1>
          <p className="text-muted-foreground">Manage and view intake information</p>
        </div>
        
        <FilterAndSearchWrapper
          searchPlaceholder="Search intake by name..."
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
          entityName="Intake"
          basePath="/intakes"
          onBulkDelete={handleBulkDelete}
          enableImportExport={true}
          apiEndpoint={`${base_url}/api/joined-academic-years`}
          exportFields={['name', 'start_date']}
        />
      </div>
    </div>
  )
}