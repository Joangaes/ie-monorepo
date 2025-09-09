"use client"

import { useState, useEffect } from "react"
import { columns, Section } from "./columns"
import { AdminDataTable } from "../../../components/ui/admin-data-table"
import { FilterAndSearchWrapper } from "@/components/ui/filter-and-search-wrapper"
import { type GeneralFilterConfig, type GeneralFilterValues } from "@/components/ui/general-filter-button"
import { apiGet, apiDelete } from "@/lib/api"
import { toast } from "react-hot-toast"
import { useTranslations } from "@/hooks/use-translations"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

export default function Sections() {
  const { t } = useTranslations()
  const [data, setData] = useState<Section[]>([])
  const [activeSections, setActiveSections] = useState<Section[]>([])
  const [inactiveSections, setInactiveSections] = useState<Section[]>([])
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [prevUrl, setPrevUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValues, setFilterValues] = useState<GeneralFilterValues>({})
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active")


  // Filter configurations based on Django admin
  const filters: GeneralFilterConfig[] = [
    {
      key: "name",
      label: "Section Name",
      type: "select",
      options: [
        { value: "A", label: "Section A" },
        { value: "B", label: "Section B" }
      ]
    },
    {
      key: "campus",
      label: "Campus",
      type: "select",
      options: [
        { value: "Segovia", label: "Segovia" },
        { value: "Madrid A", label: "Madrid IE Tower" },
        { value: "Madrid B", label: "Madrid Maria de Molina" }
      ]
    },
    {
      key: "course_year",
      label: "Course Year",
      type: "select",
      options: [
        { value: "1", label: "Year 1" },
        { value: "2", label: "Year 2" },
        { value: "3", label: "Year 3" },
        { value: "4", label: "Year 4" }
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
      params.append("ordering", "-created_at")
    }

    const queryString = params.toString()
    return queryString ? `${url}?${queryString}` : url
  }

  const fetchData = async (url?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const requestUrl = url || buildQueryParams(`${base_url}/api/sections/`, true)
      const response = await apiGet<{
        results: Section[]
        next: string | null
        previous: string | null
      }>(requestUrl)

      const sections = response.results || []
      
      // Separate sections into active and inactive based on term's is_active status
      const active: Section[] = []
      const inactive: Section[] = []
      
      sections.forEach(section => {
        // Debug: Check what properties are available in the intake object
        if (section.intake) {
          console.log('Intake properties:', Object.keys(section.intake));
          console.log('Active value:', (section.intake as any).active);
        }
        
        // Check if section has an intake (term) and if that term is active
        if (section.intake && (section.intake as any).active) {
          active.push(section)
        } else {
          inactive.push(section)
        }
      })
      
      // Sort both arrays by program name, then by course year
      const sortSections = (sectionsList: Section[]) => {
        return sectionsList.sort((a, b) => {
          // First sort by program name
          const programA = a.program?.name || ''
          const programB = b.program?.name || ''
          if (programA !== programB) {
            return programA.localeCompare(programB)
          }
          // Then sort by course year
          return (a.course_year || 0) - (b.course_year || 0)
        })
      }
      
      setActiveSections(sortSections(active))
      setInactiveSections(sortSections(inactive))
      setData(sections) // Keep original data for compatibility
      setNextUrl(response.next)
      setPrevUrl(response.previous)
    } catch (err: any) {
      setError(err.message || "Failed to fetch sections")
      setData([])
      setActiveSections([])
      setInactiveSections([])
    } finally {
      setLoading(false)
    }
  }



  const handleBulkDelete = async (recordIds: string[]) => {
    try {
      await Promise.all(recordIds.map(id => apiDelete(`${base_url}/api/sections/${id}/`)))
      toast.success(`Successfully deleted ${recordIds.length} section(s)`)
      fetchData() // Refresh the data
    } catch (error: any) {
      toast.error(`Failed to delete sections: ${error.message}`)
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
          <h1 className="text-2xl font-bold tracking-tight">{t('sections.title')}</h1>
          <p className="text-muted-foreground">{t('sections.description')}</p>
        </div>
        
        <FilterAndSearchWrapper
          searchPlaceholder="Search sections by program name or code..."
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilterValues}
          initialSearchValue={searchQuery}
          initialFilterValues={filterValues}
        />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "inactive")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              Active Sections
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {activeSections.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-2">
              Inactive Sections  
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                {inactiveSections.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-green-700">Active Sections</h3>
              <p className="text-sm text-muted-foreground">
                Sections linked to active terms - these appear automatically in delivery overview
              </p>
            </div>
            <AdminDataTable
              columns={columns}
              data={activeSections}
              onNext={() => nextUrl && fetchData(nextUrl)}
              onPrevious={() => prevUrl && fetchData(prevUrl)}
              disableNext={!nextUrl}
              disablePrevious={!prevUrl}
              loading={loading}
              entityName="Section"
              basePath="/sections"
              onBulkDelete={handleBulkDelete}
              enableImportExport={true}
              apiEndpoint={`${base_url}/api/sections`}
              exportFields={['name', 'campus', 'course_year', 'program', 'intake']}
            />
          </TabsContent>

          <TabsContent value="inactive" className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Inactive Sections</h3>
              <p className="text-sm text-muted-foreground">
                Sections linked to inactive terms - activate the term to make these appear in delivery overview
              </p>
            </div>
            <AdminDataTable
              columns={columns}
              data={inactiveSections}
              onNext={() => nextUrl && fetchData(nextUrl)}
              onPrevious={() => prevUrl && fetchData(prevUrl)}
              disableNext={!nextUrl}
              disablePrevious={!prevUrl}
              loading={loading}
              entityName="Section"
              basePath="/sections"
              onBulkDelete={handleBulkDelete}
              enableImportExport={true}
              apiEndpoint={`${base_url}/api/sections`}
              exportFields={['name', 'campus', 'course_year', 'program', 'intake']}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}