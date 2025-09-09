"use client"

import { useState, useEffect } from "react"
import { columns, CourseDelivery } from "./columns"
import { AdminDataTable } from "../../../components/ui/admin-data-table"
import { FilterAndSearchWrapper } from "@/components/ui/filter-and-search-wrapper"
import { type GeneralFilterConfig, type GeneralFilterValues } from "@/components/ui/general-filter-button"
import { apiGet, apiDelete } from "@/lib/api"
import { toast } from "react-hot-toast"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

export default function CourseDeliveries() {
  const [data, setData] = useState<CourseDelivery[]>([])
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [prevUrl, setPrevUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValues, setFilterValues] = useState<GeneralFilterValues>({})
  const [courses, setCourses] = useState<Array<{ value: string; label: string }>>([])
  const [professors, setProfessors] = useState<Array<{ value: string; label: string }>>([])


  // Filter configurations based on Django admin
  const filters: GeneralFilterConfig[] = [
    {
      key: "course",
      label: "Course",
      type: "select",
      options: courses
    },
    {
      key: "professor",
      label: "Professor",
      type: "select",
      options: [
        { value: "null", label: "Unassigned" },
        ...professors
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
        if (key === "professor" && value === "null") {
          params.append("professor__isnull", "true")
        } else {
          params.append(key, value)
        }
      }
    })

    if (isInitial) {
      params.append("ordering", "-created_at")
    }

    const queryString = params.toString()
    return queryString ? `${url}?${queryString}` : url
  }

  const fetchFilterOptions = async () => {
    try {
      // Fetch courses for filter
      const coursesResponse = await apiGet<{
        results: Array<{ id: string; name: string; code: string }>
      }>(`${base_url}/api/courses/?page_size=1000`)
      
      const courseOptions = coursesResponse.results.map(course => ({
        value: course.id,
        label: `${course.code} - ${course.name}`
      }))
      setCourses(courseOptions)

      // Fetch professors for filter
      const professorsResponse = await apiGet<{
        results: Array<{ id: string; name: string; last_name: string }>
      }>(`${base_url}/api/professors/?page_size=1000`)
      
      const professorOptions = professorsResponse.results.map(professor => ({
        value: professor.id,
        label: `${professor.name} ${professor.last_name}`
      }))
      setProfessors(professorOptions)
    } catch (err) {
      console.error("Failed to fetch filter options:", err)
    }
  }

  const fetchData = async (url?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const requestUrl = url || buildQueryParams(`${base_url}/api/course-deliveries/`, true)
      const response = await apiGet<{
        results: CourseDelivery[]
        next: string | null
        previous: string | null
      }>(requestUrl)

      setData(response.results || [])
      setNextUrl(response.next)
      setPrevUrl(response.previous)
    } catch (err: any) {
      setError(err.message || "Failed to fetch course deliveries")
      setData([])
    } finally {
      setLoading(false)
    }
  }



  const handleBulkDelete = async (recordIds: string[]) => {
    try {
      await Promise.all(recordIds.map(id => apiDelete(`${base_url}/api/course-deliveries/${id}/`)))
      toast.success(`Successfully deleted ${recordIds.length} course delivery(ies)`)
      fetchData() // Refresh the data
    } catch (error: any) {
      toast.error(`Failed to delete course deliveries: ${error.message}`)
    }
  }

  const handleRecordUpdated = () => {
    fetchData() // Refresh the data
  }



  useEffect(() => {
    fetchFilterOptions()
  }, [])

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
          <h1 className="text-2xl font-bold tracking-tight">Course Deliveries</h1>
          <p className="text-muted-foreground">Manage and view all course deliveries and professor assignments</p>
        </div>
        
        <FilterAndSearchWrapper
          searchPlaceholder="Search by course name, code, or professor name..."
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
          entityName="Course Delivery"
          basePath="/course-deliveries"
          onBulkDelete={handleBulkDelete}
          enableImportExport={true}
          apiEndpoint={`${base_url}/api/course-deliveries`}
          exportFields={['course', 'professor', 'sections']}
        />
      </div>
    </div>
  )
}