"use client"

import { useEffect, useState } from "react"
import { AdminDataTable } from "@/components/ui/admin-data-table"
import { FilterAndSearchWrapper } from "@/components/ui/filter-and-search-wrapper"
import { type GeneralFilterConfig, type GeneralFilterValues } from "@/components/ui/general-filter-button"
import { apiGet, apiDelete } from "@/lib/api"
import { toast } from "react-hot-toast"
import { useTranslations } from "@/hooks/use-translations"
import { columns, Course } from "./columns"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

export default function Courses() {
  const { t } = useTranslations()
  const [data, setData] = useState<Course[]>([])
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [prevUrl, setPrevUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValues, setFilterValues] = useState<GeneralFilterValues>({})


  // Filter configurations based on Django admin
  const filters: GeneralFilterConfig[] = [
    {
      key: "course_type",
      label: "Course Type",
      options: [
        { value: "BA", label: "Basic", count: 45 },
        { value: "OB", label: "Obligatory", count: 123 },
        { value: "OP", label: "Optional", count: 67 },
        { value: "CA", label: "Complementary Activity", count: 23 },
        { value: "EL", label: "Electives", count: 89 },
        { value: "RE", label: "Regular", count: 156 },
        { value: "OACT", label: "Other Activities", count: 12 },
      ],
      multiSelect: true,
      placeholder: "Select course types..."
    },
    {
      key: "area",
      label: "Area",
      options: [
        { value: "business_admin", label: "Business Administration", count: 78 },
        { value: "finance", label: "Finance & Banking", count: 45 },
        { value: "marketing", label: "Marketing", count: 34 },
        { value: "economics", label: "Economics", count: 56 },
        { value: "law", label: "Law", count: 89 },
        { value: "technology", label: "Technology & Innovation", count: 67 },
        { value: "humanities", label: "Humanities", count: 23 },
        { value: "languages", label: "Languages", count: 45 },
      ],
      multiSelect: true,
      placeholder: "Select areas..."
    },
    {
      key: "credits",
      label: "Credits",
      options: [
        { value: "3", label: "3 Credits", count: 145 },
        { value: "6", label: "6 Credits", count: 234 },
        { value: "9", label: "9 Credits", count: 67 },
        { value: "12", label: "12 Credits", count: 23 },
      ],
      multiSelect: true,
      placeholder: "Select credits..."
    },
    {
      key: "sessions",
      label: "Sessions",
      options: [
        { value: "15", label: "15 Sessions", count: 123 },
        { value: "30", label: "30 Sessions", count: 187 },
        { value: "45", label: "45 Sessions", count: 89 },
        { value: "60", label: "60 Sessions", count: 34 },
      ],
      multiSelect: true,
      placeholder: "Select session count..."
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
        fetchUrl = `${base_url}/api/courses/${queryParams ? `?${queryParams}` : ''}`
      }
      
      const json = await apiGet<{ results: Course[]; next: string; previous: string }>(
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
      await Promise.all(recordIds.map(id => apiDelete(`${base_url}/api/courses/${id}/`)))
      toast.success(`Successfully deleted ${recordIds.length} course(s)`)
      fetchData() // Refresh the data
    } catch (error: any) {
      toast.error(`Failed to delete courses: ${error.message}`)
    }
  }

  const handleRecordUpdated = () => {
    fetchData() // Refresh the data
  }

  // Fetch data when search or filters change
  useEffect(() => {
    if (!base_url) {
      setError("Missing API base URL")
      return
    }
    fetchData()
  }, [searchQuery, filterValues])

  // Initial load
  useEffect(() => {
    if (!base_url) {
      setError("Missing API base URL")
      return
    }
    fetchData()
  }, [])

  if (error) return <div>Error: {error}</div>

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('courses.title')}</h1>
          <p className="text-muted-foreground">{t('courses.description')}</p>
        </div>
        
        <FilterAndSearchWrapper
          searchPlaceholder="Search courses by name or code..."
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
          entityName="Course"
          basePath="/courses"
          onBulkDelete={handleBulkDelete}
          enableImportExport={true}
          apiEndpoint={`${base_url}/api/courses`}
          exportFields={['name', 'code', 'area', 'course_type', 'credits', 'sessions']}
        />
      </div>
    </div>
  )
}
