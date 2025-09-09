"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Calendar, MapPin } from "lucide-react"
import { apiGet } from "@/lib/api"
import { useRouter } from "next/navigation"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

type IntakeData = {
  id: string
  name: string
  start_time: string
  end_time: string
  semester: string
  semester_display: string
  missing_professors: number
  missing_programs: Array<{
    sections__intake__id: string
    course__programs__name: string
    missing_count: number
  }>
}

type CurrentIntakesResponse = {
  selected_date: string
  intakes: IntakeData[]
}

export default function CurrentIntakes() {
  const [data, setData] = useState<CurrentIntakesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const router = useRouter()

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (selectedDate) {
        params.append('date', selectedDate)
      }
      
      const response = await apiGet<CurrentIntakesResponse>(
        `${base_url}/api/current-intakes/?${params.toString()}`
      )
      setData(response)
    } catch (err: any) {
      setError(err.message || "Failed to fetch current intakes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getIntakesWithMissingProfessors = () => {
    if (!data) return []
    return data.intakes.filter(intake => intake.missing_professors > 0)
  }

  const getCompletePrograms = () => {
    if (!data) return []
    
    // Get all programs that have sections but no missing professors
    const completePrograms: Array<{
      programName: string
      intake: IntakeData
      totalSections: number
    }> = []
    
    data.intakes.forEach(intake => {
      // Get all unique programs for this intake that have no missing professors
      const programsInIntake = new Set<string>()
      
      // First collect all programs that have any deliveries in this intake
      intake.missing_programs.forEach(missing => {
        if (missing.course__programs__name && 
            missing.course__programs__name !== 'null' && 
            missing.course__programs__name.trim() !== '') {
          programsInIntake.add(missing.course__programs__name)
        }
      })
      
      // For intakes with no missing professors, we need to get programs differently
      if (intake.missing_professors === 0) {
        // This intake is complete, but we don't have the program names from missing_programs
        // We'll show the intake itself as complete
        completePrograms.push({
          programName: `Complete Intake: ${intake.name}`,
          intake: intake,
          totalSections: 0
        })
      }
    })
    
    return completePrograms
  }

  const handleProgramClick = async (programName: string, intakeId: string) => {
    try {
      // Since the backend API has a bug, let's try a different approach
      // We'll use the sections API to get the data we need
      router.push(`/current-intakes/sections/${intakeId}?program=${encodeURIComponent(programName)}`)
    } catch (error) {
      console.error("Navigation error:", error)
    }
  }

  if (loading) return <div className="container mx-auto py-10">Loading...</div>
  if (error) return <div className="container mx-auto py-10">Error: {error}</div>
  if (!data) return <div className="container mx-auto py-10">No data available</div>

  const missingIntakes = getIntakesWithMissingProfessors()
  const completePrograms = getCompletePrograms()

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Current Intakes</h1>
          <p className="text-muted-foreground">Overview of active intakes and missing professor assignments</p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-4">
          <label htmlFor="date-select" className="text-sm font-medium">
            Select Date:
          </label>
          <input
            id="date-select"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <span className="text-sm text-muted-foreground">
            Showing intakes active on {formatDate(selectedDate)}
          </span>
        </div>

        {/* Missing Professors Section */}
        {missingIntakes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold text-red-700">Programs with Missing Professors</h2>
              <Badge variant="destructive" className="ml-2">
                {missingIntakes.reduce((sum, intake) => sum + intake.missing_professors, 0)} Missing
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {missingIntakes.map((intake) => {
                // Group missing programs by program name
                const groupedPrograms = intake.missing_programs.reduce((acc, item) => {
                  const programName = item.course__programs__name
                  if (!acc[programName]) {
                    acc[programName] = 0
                  }
                  acc[programName] += item.missing_count
                  return acc
                }, {} as Record<string, number>)

                return Object.entries(groupedPrograms)
                  .filter(([programName]) => programName && programName !== 'null' && programName.trim() !== '')
                  .map(([programName, missingCount]) => (
                  <Card 
                    key={`${intake.id}-${programName}`} 
                    className="border-red-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleProgramClick(programName, intake.id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{programName}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {intake.semester_display} {new Date(intake.start_time).getFullYear()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(intake.start_time)} → {formatDate(intake.end_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600 font-medium">
                            ×{missingCount} missing
                          </span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleProgramClick(programName, intake.id)
                          }}
                        >
                          Assign Professors →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              })}
            </div>
          </div>
        )}

        {/* Complete Programs Section */}
        {completePrograms.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-semibold text-green-700">Complete Programs</h2>
              <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
                {completePrograms.length} Complete
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completePrograms.map((program, index) => (
                <Card 
                  key={`${program.intake.id}-${index}`} 
                  className="border-green-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleProgramClick(program.programName, program.intake.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{program.programName}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {program.intake.semester_display} {new Date(program.intake.start_time).getFullYear()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(program.intake.start_time)} → {formatDate(program.intake.end_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 font-medium">
                          All professors assigned
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleProgramClick(program.programName, program.intake.id)
                        }}
                      >
                        View Details →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {missingIntakes.length === 0 && completePrograms.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Intakes</h3>
              <p className="text-muted-foreground">
                No intakes are active for the selected date ({formatDate(selectedDate)})
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}