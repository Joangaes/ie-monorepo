"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle, User, MapPin, Calendar, BookOpen } from "lucide-react"
import { apiGet, apiPatch } from "@/lib/api"
import { ProfessorAssignmentModal } from "@/components/professor-assignment-modal"
import { toast } from "react-hot-toast"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

type CourseDelivery = {
  id: string
  course: {
    id: string
    name: string
    code: string
    credits: number
    sessions: number
    course_type_display: string
  } | null
  professor: {
    id: string
    name: string
    last_name: string
    corporate_email: string
  } | null
}

type SectionData = {
  id: string
  name: string
  campus: string
  campus_display: string
  course_year: number
  course_deliveries: CourseDelivery[]
}

type ProgramDeliveryData = {
  program: {
    id: string
    name: string
    code: string
    school: string
    school_display: string
  }
  intake: {
    id: string
    name: string
    start_time: string
    end_time: string
    semester: string
    semester_display: string
  }
  sections: SectionData[]
}

export default function ProgramDetail() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<ProgramDeliveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignmentModal, setAssignmentModal] = useState<{
    isOpen: boolean
    courseDelivery: CourseDelivery | null
    sectionInfo: { name: string; campus: string } | null
  }>({ isOpen: false, courseDelivery: null, sectionInfo: null })

  const programName = decodeURIComponent(params.programName as string)
  const intakeId = params.intakeId as string

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // First, find the program by name
      const programsResponse = await apiGet<{
        results: Array<{ id: string; name: string; code: string }>
      }>(`${base_url}/api/programs/?search=${encodeURIComponent(programName)}`)
      
      const program = programsResponse.results.find(p => p.name === programName)
      if (!program) {
        throw new Error("Program not found")
      }

      // Then get the program delivery data
      const response = await apiGet<ProgramDeliveryData>(
        `${base_url}/api/program-delivery/${program.id}/${intakeId}/`
      )
      setData(response)
    } catch (err: any) {
      setError(err.message || "Failed to fetch program details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [programName, intakeId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSectionsByYear = () => {
    if (!data) return {}
    
    return data.sections.reduce((acc, section) => {
      const year = section.course_year
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(section)
      return acc
    }, {} as Record<number, SectionData[]>)
  }

  const getMissingProfessorsCount = (sections: SectionData[]) => {
    return sections.reduce((count, section) => {
      return count + section.course_deliveries.filter(cd => !cd.professor).length
    }, 0)
  }

  const handleAssignProfessor = (courseDelivery: CourseDelivery, sectionInfo: { name: string; campus: string }) => {
    setAssignmentModal({ 
      isOpen: true, 
      courseDelivery, 
      sectionInfo 
    })
  }

  const handleCloseAssignmentModal = () => {
    setAssignmentModal({ isOpen: false, courseDelivery: null, sectionInfo: null })
  }

  const handleAssignmentSave = async (professorData: any) => {
    if (!assignmentModal.courseDelivery || !professorData.professor) {
      toast.error("Missing assignment data")
      return
    }

    try {
      const professor = professorData.professor
      const courseDelivery = assignmentModal.courseDelivery
      
      await apiPatch(`${base_url}/api/course-deliveries/${courseDelivery.id}/`, {
        professor: professor.id
      })
      
      toast.success(`Successfully assigned ${professor.name} ${professor.last_name}`)
      
      // Refresh data to show the updated assignment
      await fetchData()
      
    } catch (error: any) {
      console.error('Error assigning professor:', error)
      toast.error(`Failed to assign professor: ${error.message}`)
    }
    
    handleCloseAssignmentModal()
  }

  if (loading) return <div className="container mx-auto py-10">Loading...</div>
  if (error) return <div className="container mx-auto py-10">Error: {error}</div>
  if (!data) return <div className="container mx-auto py-10">No data available</div>

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
            <CardTitle className="text-2xl">{data.program.name}</CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {data.intake.semester_display} {new Date(data.intake.start_time).getFullYear()}
              </span>
              <span className="text-muted-foreground">•</span>
              <span>{data.intake.semester_display}</span>
              <span className="text-muted-foreground">•</span>
              <span>{formatDate(data.intake.start_time)} → {formatDate(data.intake.end_time)}</span>
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
            .map(([year, sections]) => {
              const yearMissing = getMissingProfessorsCount(sections)
              
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

                  <div className="grid gap-4">
                    {sections.map((section) => {
                      const sectionMissing = section.course_deliveries.filter(cd => !cd.professor).length
                      
                      return (
                        <Card key={section.id} className={sectionMissing > 0 ? "border-red-200" : "border-green-200"}>
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">
                                Section {section.name} — Year {section.course_year}, {section.campus_display}
                              </CardTitle>
                              {sectionMissing > 0 && (
                                <Badge variant="destructive">
                                  ×{sectionMissing}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {section.course_deliveries.length === 0 && (
                                <div className="text-muted-foreground text-sm">No course deliveries found for this section</div>
                              )}
                              {section.course_deliveries.map((delivery) => (
                                <div 
                                  key={delivery.id} 
                                  className={`flex items-center justify-between p-3 rounded-md border ${
                                    delivery.professor ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <BookOpen className="h-4 w-4" />
                                    <div>
                                      <div className="font-medium">
                                        {delivery.course ? `${delivery.course.code} - ${delivery.course.name}` : 'Unknown Course'}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {delivery.course && (
                                          <>
                                            {delivery.course.credits} credits • {delivery.course.sessions} sessions
                                            {delivery.course.course_type_display && ` • ${delivery.course.course_type_display}`}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    {delivery.professor ? (
                                      <div className="text-right">
                                        <div className="font-medium text-green-700">
                                          {delivery.professor.name} {delivery.professor.last_name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {delivery.professor.corporate_email}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                        <span className="text-red-600 font-medium">Unassigned</span>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => handleAssignProfessor(delivery, {
                                            name: section.name,
                                            campus: section.campus_display
                                          })}
                                        >
                                          Assign
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
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
          onSave={handleAssignmentSave}
          assignment={assignmentModal.courseDelivery && assignmentModal.sectionInfo ? {
            courseCode: assignmentModal.courseDelivery.course?.code || 'Unknown',
            sectionId: assignmentModal.sectionInfo.name,
            campus: assignmentModal.sectionInfo.campus,
            timeSlot: 'morning' as const
          } : null}
        />
      )}
    </div>
  )
}