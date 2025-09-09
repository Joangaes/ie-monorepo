"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, AlertTriangle, User, MapPin, Calendar, BookOpen } from "lucide-react"
import { apiGet } from "@/lib/api"
import { ProfessorAssignmentModal } from "@/components/professor-assignment-modal"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

type Section = {
  id: string
  name: string
  campus: string
  campus_display: string
  course_year: number
  intake?: {
    id: string
    name: string
    start_time: string
    end_time: string
    semester_display: string
  }
  program?: {
    id: string
    name: string
    code: string
  }
  joined_academic_year?: {
    id: string
    name: string
  }
}

type CourseDelivery = {
  id: string
  course?: {
    id: string
    name: string
    code: string
    credits: number
    sessions: number
    course_type_display: string
  }
  professor?: {
    id: string
    name: string
    last_name: string
    corporate_email: string
  }
  sections: Section[]
}

export default function IntakeSectionsDetail() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sections, setSections] = useState<Section[]>([])
  const [courseDeliveries, setCourseDeliveries] = useState<CourseDelivery[]>([])
  const [intake, setIntake] = useState<Section["intake"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignmentModal, setAssignmentModal] = useState<{
    isOpen: boolean
    courseDelivery: CourseDelivery | null
  }>({ isOpen: false, courseDelivery: null })

  const intakeId = params.intakeId as string
  const programName = searchParams.get('program')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get sections for this intake
      const sectionsResponse = await apiGet<{
        results: Section[]
      }>(`${base_url}/api/sections/?intake=${intakeId}`)

      let filteredSections = sectionsResponse.results
      
      // Filter by program name if provided
      if (programName && programName !== `Complete Intake: ${programName}`) {
        filteredSections = sectionsResponse.results.filter(section => 
          section.program?.name === programName
        )
      }

      setSections(filteredSections)
      
      // Get the intake info from the first section
      if (filteredSections.length > 0 && filteredSections[0].intake) {
        setIntake(filteredSections[0].intake)
      }

      // Get course deliveries for these sections
      if (filteredSections.length > 0) {
        const sectionIds = filteredSections.map(s => s.id).join(',')
        const deliveriesResponse = await apiGet<{
          results: CourseDelivery[]
        }>(`${base_url}/api/course-deliveries/?sections__in=${sectionIds}`)
        
        setCourseDeliveries(deliveriesResponse.results)
      }

    } catch (err: any) {
      setError(err.message || "Failed to fetch intake details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [intakeId, programName])

  const handleAssignProfessor = (courseDelivery: CourseDelivery) => {
    setAssignmentModal({ isOpen: true, courseDelivery })
  }

  const handleCloseAssignmentModal = () => {
    setAssignmentModal({ isOpen: false, courseDelivery: null })
  }

  const handleAssignmentSuccess = () => {
    fetchData() // Refresh the data to show updated assignments
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSectionsByYear = () => {
    return sections.reduce((acc, section) => {
      const year = section.course_year
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(section)
      return acc
    }, {} as Record<number, Section[]>)
  }

  const getCourseDeliveriesForSection = (sectionId: string) => {
    return courseDeliveries.filter(delivery => 
      delivery.sections.some(s => s.id === sectionId)
    )
  }

  const getMissingProfessorsCount = (sections: Section[]) => {
    return sections.reduce((count, section) => {
      const deliveries = getCourseDeliveriesForSection(section.id)
      return count + deliveries.filter(d => !d.professor).length
    }, 0)
  }

  if (loading) return <div className="container mx-auto py-10">Loading...</div>
  if (error) return <div className="container mx-auto py-10">Error: {error}</div>
  if (!sections.length) return <div className="container mx-auto py-10">No sections found</div>

  const sectionsByYear = getSectionsByYear()
  const totalMissing = Object.values(sectionsByYear).reduce((total, sections) => 
    total + getMissingProfessorsCount(sections), 0
  )

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Program Overview Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">
              {programName || (sections[0]?.program?.name) || 'Program Details'}
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
              {intake && (
                <>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {intake.semester_display} {new Date(intake.start_time).getFullYear()}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span>{formatDate(intake.start_time)} → {formatDate(intake.end_time)}</span>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {totalMissing > 0 ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-red-600 font-medium">
                    ×{totalMissing} missing professors
                  </span>
                  <Button size="sm" className="ml-auto">
                    Assign Professors →
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-green-600 font-medium">
                    ✓ All professors assigned
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sections by Year */}
        <div className="space-y-6">
          {Object.entries(sectionsByYear)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([year, sectionsInYear]) => {
              const yearMissing = getMissingProfessorsCount(sectionsInYear)
              
              return (
                <div key={year} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">Year {year}</h2>
                    {yearMissing > 0 && (
                      <Badge variant="destructive">
                        ×{yearMissing} missing
                      </Badge>
                    )}
                  </div>

                  {/* Collect all course deliveries for this year */}
                  {(() => {
                    const allDeliveriesInYear = sectionsInYear.flatMap(section => {
                      const sectionDeliveries = getCourseDeliveriesForSection(section.id)
                      return sectionDeliveries.map(delivery => ({
                        ...delivery,
                        section
                      }))
                    })

                    // Group by campus
                    const deliveriesByCampus = allDeliveriesInYear.reduce((acc, delivery) => {
                      const campus = delivery.section.campus_display || 'Unknown Campus'
                      if (!acc[campus]) acc[campus] = []
                      acc[campus].push(delivery)
                      return acc
                    }, {} as Record<string, typeof allDeliveriesInYear>)

                    // Get actual campus names from data
                    const actualCampusNames = Object.keys(deliveriesByCampus)
                    
                    // Find the actual Madrid and Segovia campus names from the data
                    const madridCampus = actualCampusNames.find(name => 
                      name.toLowerCase().includes('madrid')
                    )
                    const segoviaCampus = actualCampusNames.find(name => 
                      name.toLowerCase().includes('segovia')
                    )
                    
                    // Create array with both campuses, using actual names or placeholders
                    const campusesToShow = []
                    if (madridCampus) {
                      campusesToShow.push(madridCampus)
                    } else {
                      campusesToShow.push('Madrid Campus')
                    }
                    if (segoviaCampus) {
                      campusesToShow.push(segoviaCampus)
                    } else {
                      campusesToShow.push('Segovia Campus')
                    }
                    
                    // Ensure both campus entries exist in deliveriesByCampus
                    campusesToShow.forEach(campus => {
                      if (!deliveriesByCampus[campus]) {
                        deliveriesByCampus[campus] = []
                      }
                    })

                    return (
                      <div className="space-y-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-24">Code</TableHead>
                              <TableHead>Course</TableHead>
                              <TableHead className="w-20">Type</TableHead>
                              <TableHead className="w-20">Credits</TableHead>
                              {campusesToShow.map(campus => (
                                <TableHead key={campus} className="text-center">
                                  {campus}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Get unique courses */}
                            {Array.from(new Set(allDeliveriesInYear.map(d => d.course?.code).filter(Boolean)))
                              .sort()
                              .map(courseCode => {
                                const delivery = allDeliveriesInYear.find(d => d.course?.code === courseCode)
                                if (!delivery?.course) return null

                                return (
                                  <TableRow key={courseCode}>
                                    <TableCell className="font-mono text-sm">
                                      {delivery.course.code}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {delivery.course.name}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">
                                        {delivery.course.course_type_display || '—'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {delivery.course.credits}
                                    </TableCell>
                                    {campusesToShow.map(campus => {
                                      const campusDelivery = deliveriesByCampus[campus].find(
                                        d => d.course?.code === courseCode
                                      )
                                      
                                      return (
                                        <TableCell key={campus} className="text-center">
                                          {campusDelivery ? (
                                            campusDelivery.professor ? (
                                              <div className="text-green-700">
                                                <div className="font-medium">
                                                  {campusDelivery.professor.name} {campusDelivery.professor.last_name}
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex items-center justify-center gap-2">
                                                <span className="text-red-600 text-sm">🚨 Missing</span>
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  className="h-6 px-2 text-xs"
                                                  onClick={() => handleAssignProfessor(campusDelivery)}
                                                >
                                                  Assign
                                                </Button>
                                              </div>
                                            )
                                          ) : (
                                            <span className="text-muted-foreground">—</span>
                                          )}
                                        </TableCell>
                                      )
                                    })}
                                  </TableRow>
                                )
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    )
                  })()}
                </div>
              )
            })}
        </div>
      </div>

      {/* Professor Assignment Modal */}
      {assignmentModal.courseDelivery && (
        <ProfessorAssignmentModal
          isOpen={assignmentModal.isOpen}
          onClose={handleCloseAssignmentModal}
          courseDelivery={assignmentModal.courseDelivery}
          onAssignmentSuccess={handleAssignmentSuccess}
        />
      )}
    </div>
  )
}