"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { User, Search, CheckCircle } from "lucide-react"
import { apiGet, apiPatch } from "@/lib/api"
import { toast } from "react-hot-toast"

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE

type Professor = {
  id: string
  name: string
  last_name: string
  corporate_email: string
  professor_type: string
  professor_type_display: string
  campuses: string[]
}

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

interface ProfessorAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (professorData: any) => void
  assignment: {
    courseCode: string
    sectionId: string
    campus: string
    timeSlot: 'morning' | 'afternoon'
  } | null
}

export function ProfessorAssignmentModal({
  isOpen,
  onClose,
  onSave,
  assignment
}: ProfessorAssignmentModalProps) {
  const [professors, setProfessors] = useState<Professor[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null)
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [professorsLoading, setProfessorsLoading] = useState(false)

  // Fetch professors when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProfessors()
    }
  }, [isOpen])

  const fetchProfessors = async () => {
    setProfessorsLoading(true)
    try {
      const response = await apiGet<{ results: Professor[] }>(`${base_url}/api/professors/?page_size=1000`)
      setProfessors(response.results)
    } catch (error: any) {
      toast.error(`Failed to fetch professors: ${error.message}`)
    } finally {
      setProfessorsLoading(false)
    }
  }

  // Filter professors based on search query
  const filteredProfessors = useMemo(() => {
    if (!searchQuery.trim()) return professors

    const query = searchQuery.toLowerCase()
    return professors.filter(professor => 
      professor.name.toLowerCase().includes(query) ||
      professor.last_name.toLowerCase().includes(query) ||
      professor.corporate_email.toLowerCase().includes(query) ||
      `${professor.name} ${professor.last_name}`.toLowerCase().includes(query)
    )
  }, [professors, searchQuery])

  const handleAssign = async () => {
    if (!selectedProfessor) {
      toast.error("Please select a professor")
      return
    }

    setAssigning(true)
    try {
      // Call the onSave callback with the selected professor and assignment details
      onSave({
        professor: selectedProfessor,
        assignment: assignment
      })
      
      toast.success(`Successfully assigned ${selectedProfessor.name} ${selectedProfessor.last_name}`)
      onClose()
      
      // Reset state
      setSelectedProfessor(null)
      setSearchQuery("")
    } catch (error: any) {
      toast.error(`Failed to assign professor: ${error.message}`)
    } finally {
      setAssigning(false)
    }
  }

  const handleClose = () => {
    setSelectedProfessor(null)
    setSearchQuery("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent size="lg" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assign Professor
          </DialogTitle>
          <DialogDescription>
            Assign a professor to{" "}
            <span className="font-medium">
              {assignment ? `${assignment.courseCode} - ${assignment.campus} ${assignment.sectionId} (${assignment.timeSlot})` : 'Unknown Course'}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assignment Details */}
          {assignment && (
            <div className="bg-muted/50 p-3 rounded-md">
              <div className="font-medium mb-1">
                {assignment.courseCode}
              </div>
              <div className="text-sm text-muted-foreground">
                Campus: {assignment.campus} • Section: {assignment.sectionId} • Time: {assignment.timeSlot}
              </div>
            </div>
          )}

          {/* Professor Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Professors</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, last name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Selected Professor */}
          {selectedProfessor && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-green-700">
                    {selectedProfessor.name} {selectedProfessor.last_name}
                  </div>
                  <div className="text-sm text-green-600">
                    {selectedProfessor.corporate_email}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {selectedProfessor.professor_type_display}
                    </Badge>
                    {selectedProfessor.campuses.map(campus => (
                      <Badge key={campus} variant="outline" className="text-xs">
                        {campus}
                      </Badge>
                    ))}
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          )}

          {/* Professor List */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Available Professors ({filteredProfessors.length})
            </label>
            
            {professorsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading professors...
              </div>
            ) : (
              <ScrollArea className="h-64 border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredProfessors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No professors found matching your search" : "No professors available"}
                    </div>
                  ) : (
                    filteredProfessors.map((professor) => (
                      <div
                        key={professor.id}
                        className={`p-3 rounded-md border cursor-pointer transition-all hover:bg-muted/50 ${
                          selectedProfessor?.id === professor.id
                            ? 'bg-primary/10 border-primary'
                            : 'border-border'
                        }`}
                        onClick={() => setSelectedProfessor(professor)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {professor.name} {professor.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {professor.corporate_email}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {professor.professor_type_display}
                              </Badge>
                              {professor.campuses.map(campus => (
                                <Badge key={campus} variant="outline" className="text-xs">
                                  {campus}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {selectedProfessor?.id === professor.id && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={assigning}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedProfessor || assigning}
            className="min-w-[100px]"
          >
            {assigning ? "Assigning..." : "Assign Professor"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
