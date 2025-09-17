"use client"

import { useState, useEffect } from "react"
import { columns, Program } from "./columns"
import { AdminDataTable } from "../../../components/ui/admin-data-table"
import { FilterAndSearchWrapper } from "@/components/ui/filter-and-search-wrapper"
import { type GeneralFilterConfig, type GeneralFilterValues } from "@/components/ui/general-filter-button"
import { apiGet, apiDelete } from "@/lib/api"
import { toast } from "react-hot-toast"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

export default function Programs() {
  const [data, setData] = useState<Program[]>([])
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [prevUrl, setPrevUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValues, setFilterValues] = useState<GeneralFilterValues>({})


  // Filter configurations based on Django admin
  const filters: GeneralFilterConfig[] = [
    {
      key: "school",
      label: "School",
      options: [
        { value: "business", label: "Business School", count: 23 },
        { value: "law", label: "Law School", count: 12 },
        { value: "sci_and_tech", label: "Science and Technology School", count: 18 },
        { value: "humanities", label: "School of Humanities", count: 15 },
        { value: "econ_glo_affa", label: "Politics, Economics and Global Affairs School", count: 9 },
        { value: "arch", label: "School of Architecture and Design", count: 8 },
      ],
      multiSelect: true,
      placeholder: "Select schools..."
    },
    {
      key: "type",
      label: "Program Type",
      options: [
        { value: "ba", label: "Bachelors", count: 45 },
        { value: "ma", label: "Master", count: 40 },
      ],
      multiSelect: false,
      placeholder: "Select program type..."
    },
    {
      key: "duration",
      label: "Duration",
      options: [
        { value: "1", label: "1 Year", count: 25 },
        { value: "2", label: "2 Years", count: 35 },
        { value: "3", label: "3 Years", count: 15 },
        { value: "4", label: "4 Years", count: 10 },
      ],
      multiSelect: true,
      placeholder: "Select duration..."
    },
    {
      key: "language",
      label: "Language",
      options: [
        { value: "english", label: "English", count: 65 },
        { value: "spanish", label: "Spanish", count: 20 },
        { value: "bilingual", label: "Bilingual", count: 0 },
      ],
      multiSelect: true,
      placeholder: "Select languages..."
    },
    {
      key: "active_status", 
      label: "Status",
      options: [
        { value: "active", label: "Active", count: 78 },
        { value: "inactive", label: "Inactive", count: 7 },
      ],
      multiSelect: false,
      placeholder: "Select status..."
    }
  ]



  function buildQueryParams() {
    const params = new URLSearchParams()
    
    // Add search query
    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim())
    }
    
    // Add filters
    Object.entries(filterValues).forEach(([key, values]) => {
      values.forEach(value => {
        params.append(key, value)
      })
    })
    
    return params.toString()
  }

  async function fetchData(url?: string) {
    setLoading(true)
    setError(null)

    try {
      let fetchUrl = url
      if (!fetchUrl) {
        const queryParams = buildQueryParams()
        fetchUrl = `${base_url}/api/programs/${queryParams ? `?${queryParams}` : ''}`
      }
      
      const json = await apiGet<{ results: Program[]; next: string; previous: string }>(
        fetchUrl
      )
      setData(json.results)
      setNextUrl(json.next)
      setPrevUrl(json.previous)
    } catch (e: any) {
      setError(e.message)
    }

    setLoading(false)
  }

  const handleBulkDelete = async (recordIds: string[]) => {
    try {
      await Promise.all(recordIds.map(id => apiDelete(`${base_url}/api/programs/${id}/`)))
      toast.success(`Successfully deleted ${recordIds.length} program(s)`)
      fetchData() // Refresh the data
    } catch (error: any) {
      toast.error(`Failed to delete programs: ${error.message}`)
    }
  }

  const handleRecordUpdated = () => {
    fetchData() // Refresh the data
  }



  // Fetch data when search or filters change
  useEffect(() => {
    fetchData()
  }, [searchQuery, filterValues])

  // Initial load
  useEffect(() => {
    fetchData()
  }, [])

  if (error) return <div>Error: {error}</div>

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
          <p className="text-muted-foreground">Manage and view all programs</p>
        </div>
        
        <FilterAndSearchWrapper
          searchPlaceholder="Search programs by name or code..."
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
          entityName="Program"
          basePath="/programs"
          onBulkDelete={handleBulkDelete}
          enableImportExport={true}
          apiEndpoint={`${base_url}/api/programs`}
          exportFields={['name', 'code', 'school', 'type', 'years', 'academic_director']}
        />
      </div>
    </div>
  )
}
