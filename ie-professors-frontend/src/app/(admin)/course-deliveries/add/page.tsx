"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete"
import { apiGet, apiPost } from "@/lib/api"
import { toast } from "react-hot-toast"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

interface CourseSelection {
  id: string
  courseId: string | null
}

export default function AddCourseDelivery() {
  const { t } = useTranslations()
  const router = useRouter()
  const [professorId, setProfessorId] = useState<string | null>(null)
  const [courseSelections, setCourseSelections] = useState<CourseSelection[]>([
    { id: '1', courseId: null }
  ])
  const [professors, setProfessors] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load professors and courses data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [professorsData, coursesData] = await Promise.all([
        apiGet(`${base_url}/api/professors/`),
        apiGet(`${base_url}/api/courses/`)
      ])
      setProfessors(professorsData.results || professorsData)
      setCourses(coursesData.results || coursesData)
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`)
    }
    setLoading(false)
  }

  // Helper function to create autocomplete options
  const createAutocompleteOptions = (objects: any[], type: 'professor' | 'course'): AutocompleteOption[] => {
    return objects.map(obj => {
      if (type === 'professor') {
        const fullName = `${obj.name || ''} ${obj.last_name || ''}`.trim()
        return {
          value: obj.id,
          label: fullName || obj.name || 'Unknown Professor',
          subtitle: obj.corporate_email || obj.email,
          searchText: `${fullName} ${obj.email || ''} ${obj.corporate_email || ''} ${obj.professor_type || ''}`.toLowerCase()
        }
      } else {
        return {
          value: obj.id,
          label: `${obj.code || ''} - ${obj.name || ''}`.replace(/^- /, ''),
          subtitle: obj.area?.name || obj.course_type_display,
          searchText: `${obj.code || ''} ${obj.name || ''} ${obj.area?.name || ''}`.toLowerCase()
        }
      }
    })
  }

  const professorOptions = createAutocompleteOptions(professors, 'professor')
  const courseOptions = createAutocompleteOptions(courses, 'course')

  const addCourseField = () => {
    const newId = Date.now().toString()
    setCourseSelections(prev => [...prev, { id: newId, courseId: null }])
  }

  const removeCourseField = (idToRemove: string) => {
    setCourseSelections(prev => prev.filter(selection => selection.id !== idToRemove))
  }

  const updateCourseSelection = (id: string, courseId: string | null) => {
    setCourseSelections(prev => prev.map(selection => 
      selection.id === id ? { ...selection, courseId } : selection
    ))
  }

  const handleSave = async () => {
    if (!professorId) {
      toast.error('Please select a professor')
      return
    }

    const selectedCourses = courseSelections.filter(selection => selection.courseId)
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course')
      return
    }

    console.log('Selected professor ID:', professorId)
    console.log('Selected courses:', selectedCourses.map(s => s.courseId))

    setSaving(true)
    try {
      // Create multiple course deliveries
      const promises = selectedCourses.map(selection => {
        // Use the new write-only fields from updated serializer
        const payload = {
          course_id: parseInt(selection.courseId!),
          professor_id: parseInt(professorId),
          sections_ids: [] // Initialize with empty sections array
        }
        
        console.log('Creating course delivery with data:', payload)
        
        return apiPost(`${base_url}/api/course-deliveries/`, payload)
      })

      const results = await Promise.all(promises)
      console.log('Course delivery creation results:', results)
      
      toast.success(`Successfully created ${selectedCourses.length} course delivery assignment(s)`)
      router.push('/course-deliveries')
    } catch (error: any) {
      console.error('Failed to create course deliveries:', error)
      toast.error(`Failed to create course deliveries: ${error.message}`)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <div>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/course-deliveries')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('common.back')}</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add Course Deliveries</h1>
            <p className="text-muted-foreground">
              Assign multiple courses to one professor
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bulk Course Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Professor Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Autocomplete
                    label="Professor"
                    value={professorId || ''}
                    onChange={(value) => setProfessorId(value as string)}
                    options={professorOptions}
                    placeholder="Search professor by name or email..."
                    required={true}
                    loading={professors.length === 0}
                  />
                </div>
              </div>

              {/* Course Selections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Courses</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCourseField}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Course</span>
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {courseSelections.map((selection, index) => (
                    <div key={selection.id} className="flex items-end space-x-3">
                      <div className="flex-1">
                        <Autocomplete
                          label={index === 0 ? "Course" : ""}
                          value={selection.courseId || ''}
                          onChange={(value) => updateCourseSelection(selection.id, value as string)}
                          options={courseOptions}
                          placeholder="Search course by code or name..."
                          loading={courses.length === 0}
                        />
                      </div>
                      {courseSelections.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCourseField(selection.id)}
                          className="h-10 px-3"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/course-deliveries')}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !professorId || courseSelections.filter(s => s.courseId).length === 0}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {saving 
                      ? t('common.saving') 
                      : `Create ${courseSelections.filter(s => s.courseId).length} Assignment(s)`
                    }
                  </span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
