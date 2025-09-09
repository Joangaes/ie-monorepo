"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileSpreadsheet, 
  Users, 
  MapPin, 
  Clock, 
  BookOpen,
  Edit,
  Plus,
  Filter,
  Download,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProfessorAssignmentModal } from "@/components/professor-assignment-modal";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { toast } from "react-hot-toast";

const base_url = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE;

// Types based on the API response structure
type Program = {
  id: number;
  name: string;
  code: string;
  years?: number; // Optional since some programs might not have this field
};

type Intake = {
  id: number;
  name: string;
  semester: string;
  start_time: string;
  end_time: string;
};

type Course = {
  id: number;
  code: string;
  name: string;
  type: string;
  type_display: string;
  credits: number;
  sessions: number;
  area: string | {
    id: number;
    name: string;
    name_en?: string;
    name_es?: string;
  };
};

type ProfessorInfo = {
  id: number;
  name: string;
  email: string;
  type: string;
  section_name: string;
  delivery_id: number;
};

type CampusAssignment = {
  morning: ProfessorInfo[];
  afternoon: ProfessorInfo[];
};

type SemesterData = {
  semester: string;
  semester_display: string;
  campuses: {
    [campus: string]: CampusAssignment;
  };
};

type SectionInfo = {
  name: string;
  campus: string;
  campus_display: string;
  intake: {
    id: number | null;
    name: string | null;
    semester_display: string;
  };
  program: {
    id: number | null;
    name: string | null;
    code: string | null;
  };
};

type CourseAssignment = {
  course: Course;
  assignments: {
    [campus: string]: {
      morning: ProfessorInfo[];
      afternoon: ProfessorInfo[];
    };
  };
};

type SectionData = {
  section_info: SectionInfo;
  courses: CourseAssignment[];
};

type YearData = {
  year: number;
  sections: SectionData[];
};

type FilterOption = {
  value: string;
  display: string;
};

type ApiResponse = {
  years: { [year: string]: YearData };
  filters: {
    programs: Program[];
    intakes: Intake[];
    semesters: FilterOption[];
    campuses: FilterOption[];
    time_slots: FilterOption[];
  };
};

// Dynamic section configuration - sections are columns, years are rows
type SectionColumn = {
  id: string;
  name: string;
  displayName: string;
  sectionData: any; // The actual section data from API
};

type YearCourses = {
  [sectionId: string]: Course[]; // Courses for each section in this year
};

// Helper function to safely render area
const getAreaDisplay = (area: Course['area']): string => {
  if (typeof area === 'string') {
    return area;
  }
  if (area && typeof area === 'object') {
    return area.name || area.name_en || 'Unknown Area';
  }
  return 'Unknown Area';
};

export default function DeliveryOverview() {
  const { t } = useTranslations();
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIntake, setSelectedIntake] = useState<string>("all");
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<{
    courseCode: string;
    sectionId: string;
    campus: string;
    timeSlot: 'morning' | 'afternoon';
  } | null>(null);

  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [selectedYearForCourse, setSelectedYearForCourse] = useState<number | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  
  // Dynamic section columns and year-section course mapping
  const [sectionColumns, setSectionColumns] = useState<SectionColumn[]>([]);
  const [yearCourses, setYearCourses] = useState<{[year: number]: YearCourses}>({});
  const autoPopulatedRef = useRef<string | null>(null); // Track which program was auto-populated
  const [professorAssignments, setProfessorAssignments] = useState<{[key: string]: any[]}>({});

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedProgram) params.append('program', selectedProgram);
        if (selectedIntake && selectedIntake !== 'all') params.append('intake', selectedIntake);
        
        const url = `${base_url}/api/delivery-overview/?${params.toString()}`;
        const response = await apiGet<ApiResponse>(url);
        setApiData(response);
      } catch (error: any) {
        toast.error(`Failed to fetch delivery overview: ${error.message}`);
        console.error('Error fetching delivery overview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProgram, selectedIntake]);

  // Get the selected program data to know how many years it has
  const selectedProgramData = apiData?.filters.programs.find(p => p.id.toString() === selectedProgram);

  // Initialize year courses and auto-populate when program is selected
  useEffect(() => {
    if (selectedProgramData) {
      const programId = selectedProgramData.id.toString();
      
      // Check if we've already auto-populated this program
      if (autoPopulatedRef.current === programId) {
        return;
      }
      
      // Fallback to 4 years if years property is missing (common for bachelor programs)
      const yearCount = selectedProgramData.years || 4;
      const initialYearCourses: {[year: number]: YearCourses} = {};
      for (let year = 1; year <= yearCount; year++) {
        initialYearCourses[year] = {}; // Empty object for each year
      }
      setYearCourses(initialYearCourses);
      setSectionColumns([]); // Reset sections when program changes
      
      // Auto-populate with active terms
      autoPopulateActiveSections();
    }
  }, [selectedProgramData]);

  // Reset when program changes
  useEffect(() => {
    autoPopulatedRef.current = null;
    setSectionColumns([]);
  }, [selectedProgram]);

  // Auto-populate sections based on active terms
  const autoPopulateActiveSections = async () => {
    if (!selectedProgramData) return;
    
    try {
      // Fetch active terms (what frontend calls "Term" but API calls "intakes")
      const termsResponse = await apiGet<any>(`${base_url}/api/intakes/?is_active=true`);
      const activeTerms = termsResponse.results || termsResponse;
      
      // Fetch sections for this program
      const sectionsResponse = await apiGet<any>(`${base_url}/api/sections/?program=${selectedProgram}`);
      const programSections = sectionsResponse.results || sectionsResponse;
      
      // Filter sections linked to active terms
      const activeSections = programSections.filter((section: any) => 
        activeTerms.some((term: any) => term.id === section.intake?.id)
      );
      
      // Auto-populate these sections
      for (const section of activeSections) {
        await autoAddSectionColumn(section);
      }
      
      // Mark this program as auto-populated
      autoPopulatedRef.current = selectedProgramData.id.toString();
    } catch (error: any) {
      // Don't show error toast for auto-population failures
    }
  };

  // Auto-add section column (similar to addSectionColumn but for auto-population)
  const autoAddSectionColumn = async (section: any) => {
    // Check if section already exists before adding
    setSectionColumns(prev => {
      const alreadyExists = prev.some(col => col.sectionData.id === section.id);
      if (alreadyExists) {
        return prev;
      }
      
      const newSectionColumn: SectionColumn = {
        id: `section_${section.id}_${section.course_year}_auto`,
        name: `${section.name} (Year ${section.course_year})`,
        displayName: `${section.name} (Year ${section.course_year})`,
        sectionData: { ...section, targetYear: section.course_year }
      };

      return [...prev, newSectionColumn];
    });
    
    // Populate the specific year with courses from this section
    await populateYearWithSectionCourses(section, section.course_year);
  };

  
  // Get years data from API (now organized by actual sections)
  const yearsData = apiData?.years || {};
  
  // Filter sections and courses based on search term
  const filteredYearsData = React.useMemo(() => {
    const filtered: { [year: string]: YearData } = {};
    
    Object.entries(yearsData).forEach(([year, yearData]) => {
      const filteredSections = yearData.sections.map(section => ({
        ...section,
        courses: section.courses.filter(courseAssignment => {
          const matchesSearch = searchTerm === "" || 
            courseAssignment.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            courseAssignment.course.name.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesSearch;
        })
      })).filter(section => section.courses.length > 0); // Only keep sections with courses
      
      if (filteredSections.length > 0) {
        filtered[year] = {
          ...yearData,
          sections: filteredSections
        };
      }
    });
    
    return filtered;
  }, [yearsData, searchTerm]);

  // Section management functions - simplified since we now redirect to add page

  const populateYearWithSectionCourses = async (selectedSection: any, targetYear: number) => {
    try {
      // Fetch course deliveries for this section
      const response = await apiGet<any>(`${base_url}/api/course-deliveries/?sections=${selectedSection.id}`);
      const courseDeliveries = response.results || response;
      
      // Extract courses from course deliveries
      const allSectionCourses = courseDeliveries
        .filter((delivery: any) => delivery.course) // Only keep deliveries with courses
        .map((delivery: any) => ({
          ...delivery.course,
          delivery_year: delivery.year || delivery.academic_year, // Keep track of delivery year
          delivery_info: delivery // Keep delivery info for reference
        }));
      
      // For now, let's populate all courses to the target year
      // (We can filter by year later if needed based on the actual data structure)
      const sectionCourses = allSectionCourses;
      
      // Add courses to the specific year
      setYearCourses(prev => {
        const updated = { ...prev };
        if (!updated[targetYear]) {
          updated[targetYear] = {};
        }
        updated[targetYear][selectedSection.id] = sectionCourses;
        return updated;
      });
    } catch (error: any) {
      toast.error(`Failed to fetch courses for section: ${error.message}`);
    }
  };

  const removeSectionColumn = (sectionId: string) => {
    setSectionColumns(prev => prev.filter(col => col.id !== sectionId));
    
    // Remove courses for this section from all years
    setYearCourses(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(year => {
        delete updated[parseInt(year)][sectionId];
      });
      return updated;
    });
  };

  const updateSectionName = (sectionId: string, newName: string) => {
    setSectionColumns(prev => 
      prev.map(col => 
        col.id === sectionId 
          ? { ...col, name: newName, displayName: newName }
          : col
      )
    );
  };

  const getProfessorAssignment = (courseId: string, sectionId: string) => {
    // Find the actual section data to get the real section ID
    const sectionColumn = sectionColumns.find(col => col.id === sectionId);
    const actualSectionId = sectionColumn?.sectionData.id || sectionId;
    
    // Use course ID for consistent lookup
    const key = `${courseId}_${actualSectionId}`;
    const assignments = professorAssignments[key] || [];
    const assignment = assignments.length > 0 ? assignments[0] : null; // Get first professor if any
    
    
    return assignment;
  };

  const fetchProfessorAssignments = async () => {
    if (!selectedProgramData || sectionColumns.length === 0) return;

    try {
      const assignments: {[key: string]: any} = {};
      for (const sectionCol of sectionColumns) {
        const sectionId = sectionCol.sectionData.id;
        const response = await apiGet<any>(`${base_url}/api/course-deliveries/?sections=${sectionId}`);
        const deliveries = response.results || response;
        
        deliveries.forEach((delivery: any) => {
          if (delivery.course && delivery.professor) {
            // Store assignments using course ID as primary key (more reliable)
            const idKey = `${delivery.course.id}_${sectionId}`;
            if (!assignments[idKey]) {
              assignments[idKey] = [];
            }
            assignments[idKey].push(delivery.professor);
          }
        });
      }
      setProfessorAssignments(assignments);
    } catch (error: any) {
      console.error('Error fetching professor assignments:', error);
    }
  };

  // Fetch professor assignments when sections change
  useEffect(() => {
    if (sectionColumns.length > 0) {
      fetchProfessorAssignments();
    }
  }, [sectionColumns]);

  const handleAssignProfessor = (courseCode: string, sectionId: string, campus: string, timeSlot: string) => {
    // Find the actual section data to get the real section ID
    const sectionColumn = sectionColumns.find(col => col.id === sectionId);
    const actualSectionId = sectionColumn?.sectionData.id || sectionId;
    
    
    setSelectedAssignment({ 
      courseCode, 
      sectionId: actualSectionId, // Use the actual section ID, not the frontend ID
      campus, 
      timeSlot: 'morning' as 'morning' | 'afternoon'
    });
    setIsAssignmentModalOpen(true);
  };

  const handleAssignmentSave = async (professorData: any) => {
    if (!selectedAssignment || !professorData.professor) {
      toast.error('Missing assignment or professor data');
      return;
    }

    try {
      // Find the course delivery that needs to be updated
      // We need to either create a new course delivery or update an existing one
      const { courseCode, sectionId } = selectedAssignment;
      const professor = professorData.professor;
      

      // First, try to find existing course delivery using course ID
      const existingDeliveriesResponse = await apiGet<any>(
        `${base_url}/api/course-deliveries/?sections=${sectionId}&course=${courseCode}`
      );
      const existingDeliveries = existingDeliveriesResponse.results || existingDeliveriesResponse;

      if (existingDeliveries.length > 0) {
        // Update existing course delivery
        const delivery = existingDeliveries[0];
        
        await apiPatch(`${base_url}/api/course-deliveries/${delivery.id}/`, {
          professor_id: professor.id
        });
        toast.success(`Professor assigned successfully`);
      } else {
        // Create new course delivery using course ID directly
        await apiPost(`${base_url}/api/course-deliveries/`, {
          course: courseCode, // courseCode is actually the course ID in this context
          sections: [sectionId],
          professor_id: professor.id
        });
        toast.success(`New course delivery created with professor assignment`);
      }

      // Update professor assignments directly to show the new assignment immediately
      const assignmentKey = `${courseCode}_${sectionId}`;
      setProfessorAssignments(prev => ({
        ...prev,
        [assignmentKey]: [professor]
      }));
      
      
    } catch (error: any) {
      console.error('Error assigning professor:', error);
      toast.error(`Failed to assign professor: ${error.message}`);
    }

    setIsAssignmentModalOpen(false);
    setSelectedAssignment(null);
  };

  const handleAddCourseToYear = async (year: number) => {
    setSelectedYearForCourse(year);
    setShowAddCourseModal(true);
    
    // Fetch available courses
    setLoadingCourses(true);
    try {
      const response = await apiGet<{ results: Course[] }>(`${base_url}/api/courses/?page_size=1000`);
      setAvailableCourses(response.results);
    } catch (error: any) {
      toast.error(`Failed to fetch courses: ${error.message}`);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCourseAdded = (courseData: any) => {
    // Handle adding the course to the specific year
    setShowAddCourseModal(false);
    setSelectedYearForCourse(null);
    // Refresh data or update local state as needed
  };

  const renderProfessorCell = (professors: ProfessorInfo[], courseCode: string, semester: string, campus: string, timeSlot: string) => {
    return (
      <div className="h-[80px] flex flex-col justify-start">
        {professors.length === 0 ? (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAssignProfessor(courseCode, semester, campus, timeSlot)}
              className="text-muted-foreground hover:text-primary h-6 px-2 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Assign
            </Button>
          </div>
        ) : (
          <div className="space-y-1 overflow-y-auto h-full">
            {professors.map((prof, idx) => (
              <div key={idx} className="flex items-center justify-between p-1 bg-muted/50 rounded text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-xs">{prof.name}</div>
                  <div className="text-muted-foreground truncate text-xs">{prof.email}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {prof.type} • {prof.section_name}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAssignProfessor(courseCode, semester, campus, timeSlot)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading delivery overview...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state when no program is selected
  if (!selectedProgram) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Course Delivery Overview</h1>
            </div>
          </div>

          {/* Program Tabs */}
          <ScrollArea className="w-full">
            <div className="flex space-x-2 pb-2">
              {apiData?.filters.programs.map((program) => (
                <Button
                  key={program.id}
                  variant="outline"
                  onClick={() => setSelectedProgram(program.id.toString())}
                  className="whitespace-nowrap"
                >
                  {program.code}
                  <Badge variant="secondary" className="ml-2">
                    {program.name.split(' ').length > 3 ? 
                      program.name.split(' ').slice(0, 3).join(' ') + '...' : 
                      program.name
                    }
                  </Badge>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileSpreadsheet className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Select a Program</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Choose a program from the tabs above to view the course delivery overview with professor assignments across campuses and time slots.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Course Delivery Overview</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowConfigPanel(!showConfigPanel)}>
              <Edit className="h-4 w-4 mr-2" />
              Configure Layout
            </Button>
          </div>
        </div>

        {/* Program Tabs */}
        <ScrollArea className="w-full">
          <div className="flex space-x-2 pb-2">
            {apiData?.filters.programs.map((program) => (
              <Button
                key={program.id}
                variant={selectedProgram === program.id.toString() ? "default" : "outline"}
                onClick={() => setSelectedProgram(program.id.toString())}
                className="whitespace-nowrap"
              >
                {program.code}
                <Badge variant="secondary" className="ml-2">
                  {program.name.split(' ').length > 3 ? 
                    program.name.split(' ').slice(0, 3).join(' ') + '...' : 
                    program.name
                  }
                </Badge>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          <Select value={selectedIntake} onValueChange={setSelectedIntake}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Intake" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Intakes</SelectItem>
              {apiData?.filters.intakes.map((intake) => (
                <SelectItem key={intake.id} value={intake.id.toString()}>
                  {intake.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Course Deliveries Overview</span>
            {selectedProgram && selectedProgramData && (
              <>
                <Badge variant="secondary">
                  {selectedProgramData.code}
                </Badge>
                <Badge variant="outline">
                  {selectedProgramData.years || 4} Years
                </Badge>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[600px]">
            <div className="space-y-6 overflow-x-auto">
              {/* Render separate table for each year - show all years regardless of content */}
              {selectedProgramData && Array.from({ length: selectedProgramData.years || 4 }, (_, index) => index + 1).map((yearNum) => {
                // Define year colors
                const yearColors = [
                  'bg-red-50 border-red-200',      // Year 1
                  'bg-blue-50 border-blue-200',    // Year 2  
                  'bg-green-50 border-green-200',  // Year 3
                  'bg-yellow-50 border-yellow-200', // Year 4
                  'bg-purple-50 border-purple-200', // Year 5
                  'bg-pink-50 border-pink-200',    // Year 6
                ];
                const yearColorClass = yearColors[(yearNum - 1) % yearColors.length];
                
                // Get sections for this specific year
                const yearSections = sectionColumns.filter(section => 
                  section.sectionData.targetYear === yearNum
                );
                
                // Get all unique courses for this year
                const allCoursesInYear = new Set<string>();
                const yearData = yearCourses[yearNum] || {};
                
                Object.values(yearData).forEach((courses: Course[]) => {
                  courses.forEach(course => {
                    if (searchTerm === "" || 
                        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        course.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                      allCoursesInYear.add(course.code);
                    }
                  });
                });
                
                const coursesArray = Array.from(allCoursesInYear).sort();
                
                // Always show year, even if no sections or courses (so user can see what's missing)
                
                return (
                  <div key={`year-${yearNum}`} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Year Header */}
                    <div className={`${yearColorClass} p-3 border-b border-gray-200`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-bold">
                            Year {yearNum}
                            {yearSections.length > 0 && yearSections[0].sectionData.joined_academic_year && (
                              <span className="text-sm font-normal text-muted-foreground ml-2">
                                {yearSections[0].sectionData.joined_academic_year.name}
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {yearSections.length} Section{yearSections.length !== 1 ? 's' : ''} • {coursesArray.length} Course{coursesArray.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = '/sections/add'}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Section
                        </Button>
                      </div>
                    </div>
                    
                    {/* Year-specific Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse min-w-[1200px]">
                        <thead className="bg-gray-50">
                  <tr>
                    {/* Course Information Headers */}
                    <th className="w-20 border border-gray-200 bg-muted/30 p-2 text-xs font-medium">Course</th>
                    <th className="w-64 border border-gray-200 bg-muted/30 p-2 text-xs font-medium">Course Name</th>
                    <th className="w-16 border border-gray-200 bg-muted/30 p-2 text-xs font-medium">Type</th>
                    <th className="w-16 border border-gray-200 bg-muted/30 p-2 text-xs font-medium">Credits</th>
                    <th className="w-20 border border-gray-200 bg-muted/30 p-2 text-xs font-medium">Sessions</th>
                    <th className="w-32 border border-gray-200 bg-muted/30 p-2 text-xs font-medium">Area</th>
                    
                            {/* Sections for this year only */}
                            {yearSections.map((section, sectionIdx) => (
                              <th key={section.id} className={`border border-gray-200 p-2 text-sm font-medium ${sectionIdx % 2 === 0 ? 'bg-blue-50' : 'bg-green-50'}`}>
                                <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center justify-center gap-2">
                          {showConfigPanel ? (
                            <>
                              <input
                                type="text"
                                          value={section.displayName}
                                          onChange={(e) => updateSectionName(section.id, e.target.value)}
                                className="text-sm font-medium bg-transparent border-none text-center focus:outline-none focus:bg-white focus:border focus:rounded px-1"
                              />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                          onClick={() => removeSectionColumn(section.id)}
                                  className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                >
                                  ×
                                </Button>
                            </>
                          ) : (
                                      <span className="text-sm font-medium">{section.displayName}</span>
                          )}
                        </div>
                              </div>
                          </th>
                        ))}
                  </tr>
                </thead>

                <tbody>
                          {coursesArray.length === 0 ? (
                            <tr>
                              <td colSpan={6 + yearSections.length} className="border border-gray-200 p-4 text-center text-muted-foreground">
                                No courses available for Year {yearNum}
                              </td>
                            </tr>
                          ) : (
                            coursesArray.map((courseCode, courseIdx) => {
                              // Find the course object from any section that has it
                              const courseObj = Object.values(yearCourses[yearNum] || {})
                                .flat()
                                .find((c: Course) => c.code === courseCode);
                              
                              if (!courseObj) return null;
                    
                    return (
                                <tr key={`${yearNum}-${courseCode}`} className="hover:bg-muted/20">
                                {/* Course Information */}
                                <td className="border border-gray-200 p-2 text-center">
                                    <span className="font-mono font-medium text-xs">{courseObj.code}</span>
                                </td>
                                <td className="border border-gray-200 p-2">
                                    <span className="text-xs font-medium truncate" title={courseObj.name}>
                                      {courseObj.name}
                                  </span>
                                </td>
                                <td className="border border-gray-200 p-2 text-center">
                                  <Badge 
                                      variant={courseObj.type === 'CORE' ? 'default' : 'secondary'}
                                    className="text-xs px-1 py-0"
                                  >
                                      {courseObj.type_display || courseObj.type}
                                  </Badge>
                                </td>
                                <td className="border border-gray-200 p-2 text-center">
                                    <span className="text-xs">{courseObj.credits}</span>
                                </td>
                                <td className="border border-gray-200 p-2 text-center">
                                    <span className="text-xs">{courseObj.sessions}</span>
                                </td>
                                <td className="border border-gray-200 p-2">
                                    <span className="text-xs truncate" title={getAreaDisplay(courseObj.area)}>
                                      {getAreaDisplay(courseObj.area)}
                                  </span>
                                </td>
                                
                                  {/* Year-specific Section Columns */}
                                  {yearSections.map((section) => {
                                    const sectionCourses = yearCourses[yearNum]?.[section.sectionData.id] || [];
                                    const hasCourse = sectionCourses.some((c: Course) => c.code === courseCode);
                                    const assignedProfessor = getProfessorAssignment(courseObj.id.toString(), section.id);
                                    
                                    return (
                                      <td key={`${courseCode}-${section.id}`} className="border border-gray-200 p-1 w-48">
                                        {hasCourse ? (
                                          <div className="p-2 bg-green-50 border border-green-200 rounded text-center">
                                            {assignedProfessor ? (
                                              <div>
                                                <div className="text-xs text-green-800 font-medium mb-1">
                                                  Assigned
                                                </div>
                                                <div className="text-xs font-medium mb-1 truncate" title={`${assignedProfessor.name} ${assignedProfessor.last_name}`}>
                                                  {assignedProfessor.name} {assignedProfessor.last_name}
                                                </div>
                              <Button
                                variant="outline"
                                size="sm"
                                                  onClick={() => handleAssignProfessor(courseObj.id.toString(), section.id, 'section', section.name)}
                                                  className="text-xs h-6 px-2"
                                                >
                                                  <Edit className="h-3 w-3 mr-1" />
                                                  Edit
                                                </Button>
                                              </div>
                                            ) : (
                                              <div>
                                                <div className="text-xs text-green-800 font-medium mb-1">
                                                  Available
                                                </div>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleAssignProfessor(courseObj.id.toString(), section.id, 'section', section.name)}
                                                  className="text-xs h-6 px-2"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                                  Assign
                              </Button>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="p-2 bg-gray-50 border border-gray-200 rounded text-center">
                                            <div className="text-xs text-gray-500 font-medium mb-1">
                                              Not Available
                                            </div>
                                          </div>
                                        )}
                                      </td>
                    );
                  })}
                                </tr>
                              );
                            })
                          )}
                </tbody>
              </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professor Assignment Modal */}
      <ProfessorAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => {
          setIsAssignmentModalOpen(false);
          setSelectedAssignment(null);
        }}
        onSave={handleAssignmentSave}
        assignment={selectedAssignment}
      />


      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-medium mb-4">
              Add Course to Year {selectedYearForCourse}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Search and select a course to add to Year {selectedYearForCourse}. This will create a new course delivery assignment.
            </p>
            
            {/* Course Search and Selection */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Search Courses</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by course code or name..."
                    value={courseSearchQuery}
                    onChange={(e) => setCourseSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Selected Course Display */}
              {selectedCourse && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-green-700">
                        {selectedCourse.code} - {selectedCourse.name}
                      </div>
                      <div className="text-sm text-green-600">
                        {selectedCourse.credits} credits • {selectedCourse.sessions} sessions • {getAreaDisplay(selectedCourse.area)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCourse(null)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}

              {/* Course List */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Available Courses ({availableCourses.filter(course => 
                    courseSearchQuery === "" || 
                    course.code.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                    course.name.toLowerCase().includes(courseSearchQuery.toLowerCase())
                  ).length})
                </label>
                
                {loadingCourses ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading courses...
                  </div>
                ) : (
                  <ScrollArea className="h-64 border rounded-md">
                    <div className="p-2 space-y-1">
                      {availableCourses
                        .filter(course => 
                          courseSearchQuery === "" || 
                          course.code.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                          course.name.toLowerCase().includes(courseSearchQuery.toLowerCase())
                        )
                        .map((course) => (
                          <div
                            key={course.id}
                            className={`p-3 rounded-md border cursor-pointer transition-all hover:bg-muted/50 ${
                              selectedCourse?.id === course.id
                                ? 'bg-primary/10 border-primary'
                                : 'border-border'
                            }`}
                            onClick={() => setSelectedCourse(course)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  {course.code} - {course.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {course.credits} credits • {course.sessions} sessions • {getAreaDisplay(course.area)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Type: {course.type_display || course.type}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddCourseModal(false);
                    setSelectedYearForCourse(null);
                    setSelectedCourse(null);
                    setCourseSearchQuery("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleCourseAdded(selectedCourse)}
                  disabled={!selectedCourse}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Course to Year {selectedYearForCourse}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

