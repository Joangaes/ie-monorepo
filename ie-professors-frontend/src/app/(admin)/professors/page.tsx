"use client"

import { useState, useEffect } from "react"
import { columns, Professor } from "./columns"
import { AdminDataTable } from "../../../components/ui/admin-data-table"
import { FilterAndSearchWrapper } from "@/components/ui/filter-and-search-wrapper"
import { type GeneralFilterConfig, type GeneralFilterValues } from "@/components/ui/general-filter-button"
import { apiGet, apiDelete } from "@/lib/api"
import { toast } from "react-hot-toast"
import { useTranslations } from "@/hooks/use-translations"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

export default function Professors() {
  console.log("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL);  
  const { t } = useTranslations()
  const [data, setData] = useState<Professor[]>([])
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [prevUrl, setPrevUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValues, setFilterValues] = useState<GeneralFilterValues>({})

  // Filter configurations based on Django admin
  const filters: GeneralFilterConfig[] = [
    {
      key: "professor_type",
      label: "Professor Type",
      options: [
        { value: "f", label: "Faculty", count: 145 },
        { value: "a", label: "Adjunct Professor", count: 89 },
        { value: "v", label: "Visiting Professor", count: 23 },
      ],
      multiSelect: true,
      placeholder: "Select professor types..."
    },
    {
      key: "campuses",
      label: "Campus",
      options: [
        { value: "Segovia", label: "Segovia", count: 78 },
        { value: "Madrid A", label: "Madrid IE Tower", count: 134 },
        { value: "Madrid B", label: "Madrid Maria de Molina", count: 45 },
      ],
      multiSelect: true,
      placeholder: "Select campuses..."
    },
    {
      key: "accredited",
      label: "Accredited",
      options: [
        { value: "true", label: "Yes", count: 187 },
        { value: "false", label: "No", count: 70 },
      ],
      multiSelect: false,
      placeholder: "Select accreditation status..."
    },
    {
      key: "gender",
      label: "Gender",
      options: [
        { value: "H", label: "Male", count: 145 },
        { value: "M", label: "Female", count: 112 },
      ],
      multiSelect: false,
      placeholder: "Select gender..."
    },
    {
      key: "joined_year",
      label: "Joined Year",
      options: [
        { value: "2020", label: "2020", count: 34 },
        { value: "2021", label: "2021", count: 45 },
        { value: "2022", label: "2022", count: 67 },
        { value: "2023", label: "2023", count: 89 },
        { value: "2024", label: "2024", count: 22 },
      ],
      multiSelect: true,
      placeholder: "Select joining years..."
    },
    {
      key: "availability",
      label: "Availability",
      options: [
        { value: "morning", label: "Morning", count: 156 },
        { value: "afternoon", label: "Afternoon", count: 101 },
      ],
      multiSelect: true,
      placeholder: "Select availability..."
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
        fetchUrl = `${base_url}/api/professors/${queryParams ? `?${queryParams}` : ''}`
      }
      
      const json = await apiGet<{ results: Professor[]; next: string; previous: string }>(
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
      await Promise.all(recordIds.map(id => apiDelete(`${base_url}/api/professors/${id}/`)))
      toast.success(`Successfully deleted ${recordIds.length} professor(s)`)
      fetchData() // Refresh the data
    } catch (error: any) {
      toast.error(`Failed to delete professors: ${error.message}`)
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
          <h1 className="text-2xl font-bold tracking-tight">{t('professors.title')}</h1>
          <p className="text-muted-foreground">{t('professors.description')}</p>
        </div>
        
        <FilterAndSearchWrapper
          searchPlaceholder="Search professors by name, email, or last name..."
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
          entityName="Professor"
          basePath="/professors"
          onBulkDelete={handleBulkDelete}
          enableImportExport={true}
          apiEndpoint={`${base_url}/api/professors`}
          exportFields={['name', 'last_name', 'email', 'corporate_email', 'phone_number', 'professor_type', 'gender', 'birth_year', 'joined_year', 'accredited', 'linkedin_profile']}
        />
      </div>
    </div>
  )
}
