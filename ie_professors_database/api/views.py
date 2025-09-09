from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Count, Q
from collections import defaultdict
from datetime import datetime
from university.models import (
    Professor, Course, Section, Program, Area, University, Degree, 
    Intake, CourseDelivery, ProfessorDegree, ProfessorCoursePossibility,
    JoinedAcademicYear, CourseDeliverySection, CampusChoices, AvailabilityChoices, SemesterType
)
from rest_framework.permissions import IsAuthenticated
from .serializers import (
    ProfessorSerializer, CourseSerializer, SectionSerializer, ProgramSerializer,
    AreaSerializer, UniversitySerializer, DegreeSerializer, IntakeSerializer,
    CourseDeliverySerializer, ProfessorDegreeSerializer, ProfessorCoursePossibilitySerializer,
    JoinedAcademicYearSerializer, ProfessorSimpleSerializer, CourseSimpleSerializer,
    CourseDeliverySectionSerializer
)

class UniversityViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = University.objects.all()
    serializer_class = UniversitySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'country']
    filterset_fields = ['country']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']

class DegreeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Degree.objects.select_related('university').all()
    serializer_class = DegreeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'university__name']
    filterset_fields = ['degree_type', 'university']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']

class AreaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name']
    ordering = ['name']

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    filterset_fields = ['school', 'type']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]

class IntakeViewSet(viewsets.ModelViewSet):
    queryset = Intake.objects.all()
    serializer_class = IntakeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    filterset_fields = ['semester', 'active']
    ordering_fields = ['start_time', 'end_time', 'created_at']
    ordering = ['-start_time']
    permission_classes = [IsAuthenticated]

class JoinedAcademicYearViewSet(viewsets.ModelViewSet):
    queryset = JoinedAcademicYear.objects.all()
    serializer_class = JoinedAcademicYearSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-start_date']
    permission_classes = [IsAuthenticated]

class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.select_related('intake', 'program', 'joined_academic_year').all()
    serializer_class = SectionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'program__name', 'program__code']
    filterset_fields = ['name', 'campus', 'course_year', 'program', 'intake']
    ordering_fields = ['name', 'course_year', 'created_at']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.prefetch_related('programs').select_related('area').all()
    serializer_class = CourseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'area__name']
    filterset_fields = ['course_type', 'area', 'programs']
    ordering_fields = ['name', 'code', 'credits', 'sessions']
    ordering = ['code']
    permission_classes = [IsAuthenticated]


class ProfessorViewSet(viewsets.ModelViewSet):
    queryset = Professor.objects.prefetch_related('degrees', 'courses').all()
    serializer_class = ProfessorSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'last_name', 'email', 'corporate_email']
    filterset_fields = ['professor_type', 'gender', 'accredited', 'joined_year']
    ordering_fields = ['name', 'last_name', 'joined_year', 'created_at']
    ordering = ['last_name', 'name']
    permission_classes = [IsAuthenticated]

class ProfessorDegreeViewSet(viewsets.ModelViewSet):
    queryset = ProfessorDegree.objects.select_related('professor', 'degree', 'degree__university').all()
    serializer_class = ProfessorDegreeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['professor', 'degree', 'degree__degree_type']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]

class ProfessorCoursePossibilityViewSet(viewsets.ModelViewSet):
    queryset = ProfessorCoursePossibility.objects.select_related('professor', 'course').all()
    serializer_class = ProfessorCoursePossibilitySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['professor', 'course']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]

class CourseDeliveryViewSet(viewsets.ModelViewSet):
    queryset = CourseDelivery.objects.select_related('course', 'professor').prefetch_related('sections').all()
    serializer_class = CourseDeliverySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['course__name', 'course__code', 'professor__name', 'professor__last_name']
    filterset_fields = ['course', 'professor']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]

class CourseDeliverySectionViewSet(viewsets.ModelViewSet):
    queryset = CourseDeliverySection.objects.select_related('course_delivery', 'section').all()
    serializer_class = CourseDeliverySectionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['course_delivery', 'section']
    ordering_fields = ['id']
    ordering = ['id']
    permission_classes = [IsAuthenticated]

# Business Logic API Views
class CurrentIntakeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    """
    API endpoint for current intake information with missing professors statistics.
    """
    def get(self, request):
        date_param = request.GET.get('date')
        if date_param:
            try:
                selected_date = datetime.strptime(date_param, "%Y-%m-%d").date()
            except ValueError:
                selected_date = timezone.now().date()
        else:
            selected_date = timezone.now().date()

        intakes = (
            Intake.get_active_at(selected_date)
            .annotate(
                missing_professors=Count(
                    "section__coursedelivery",
                    filter=Q(section__coursedelivery__professor__isnull=True),
                    distinct=True
                )
            )
        )

        missing_by_program = (
            CourseDelivery.objects
            .filter(
                professor__isnull=True,
                sections__intake__in=intakes
            )
            .values("sections__intake__id", "course__programs__name")
            .annotate(missing_count=Count("id"))
            .order_by("sections__intake__id", "course__programs__name")
        )

        grouped_by_intake = defaultdict(list)
        for entry in missing_by_program:
            grouped_by_intake[entry["sections__intake__id"]].append(entry)

        # Serialize the data
        intake_data = []
        for intake in intakes:
            intake_info = {
                'id': intake.id,
                'name': intake.name,
                'start_time': intake.start_time,
                'end_time': intake.end_time,
                'semester': intake.semester,
                'semester_display': intake.get_semester_display(),
                'missing_professors': intake.missing_professors,
                'missing_programs': grouped_by_intake.get(intake.id, [])
            }
            intake_data.append(intake_info)

        return Response({
            'selected_date': selected_date,
            'intakes': intake_data
        })


class ProgramDeliveryOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, program_id, intake_id):
        """
        API endpoint for program delivery overview.
        """
        try:
            program = Program.objects.get(pk=program_id)
            intake = Intake.objects.get(pk=intake_id)
        except (Program.DoesNotExist, Intake.DoesNotExist):
            return Response({'error': 'Program or Intake not found'}, status=status.HTTP_404_NOT_FOUND)

        # Get sections for this program and intake
        sections = Section.objects.filter(
            program=program,
            intake=intake
        ).prefetch_related('coursedelivery_set__course', 'coursedelivery_set__professor')

        sections_data = []
        for section in sections:
            course_deliveries = []
            for delivery in section.coursedelivery_set.all():
                course_deliveries.append({
                    'id': delivery.id,
                    'course': {
                        'id': delivery.course.id if delivery.course else None,
                        'name': delivery.course.name if delivery.course else None,
                        'code': delivery.course.code if delivery.course else None,
                    },
                    'professor': {
                        'id': delivery.professor.id if delivery.professor else None,
                        'name': f"{delivery.professor.name} {delivery.professor.last_name}" if delivery.professor else None,
                        'email': delivery.professor.corporate_email if delivery.professor else None,
                    } if delivery.professor else None
                })
            
            sections_data.append({
                'id': section.id,
                'name': section.name,
                'campus': section.campus,
                'campus_display': section.get_campus_display(),
                'course_year': section.course_year,
                'course_deliveries': course_deliveries
            })

        return Response({
            'program': {
                'id': program.id,
                'name': program.name,
                'code': program.code,
                'school': program.school,
                'school_display': program.get_school_display()
            },
            'intake': {
                'id': intake.id,
                'name': intake.name,
                'start_time': intake.start_time,
                'end_time': intake.end_time,
                'semester': intake.semester,
                'semester_display': intake.get_semester_display()
            },
            'sections': sections_data
        })


class DeliveryOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Comprehensive delivery overview endpoint that aggregates data similar to Excel structure.
        Supports filtering by program, intake, and semester.
        """
        # Get query parameters
        program_id = request.GET.get('program')
        intake_id = request.GET.get('intake')
        semester = request.GET.get('semester')
        
        # Base queryset for course deliveries
        deliveries_query = CourseDelivery.objects.select_related(
            'course', 'professor', 'course__area'
        ).prefetch_related(
            'sections__intake', 'sections__program', 'sections__joined_academic_year'
        )
        
        # Apply filters
        if program_id:
            deliveries_query = deliveries_query.filter(sections__program_id=program_id)
        if intake_id:
            deliveries_query = deliveries_query.filter(sections__intake_id=intake_id)
        if semester:
            deliveries_query = deliveries_query.filter(sections__intake__semester=semester)
            
        # Get all deliveries
        deliveries = deliveries_query.distinct()
        
        # Group data by section year and section info for proper organization
        sections_by_year = {}
        
        for delivery in deliveries:
            if not delivery.course:
                continue
                
            # Process each section assignment
            for section in delivery.sections.all():
                year_key = section.course_year
                section_key = f"{section.name}_{section.campus}_{section.intake.id if section.intake else 'no_intake'}"
                
                if year_key not in sections_by_year:
                    sections_by_year[year_key] = {}
                
                if section_key not in sections_by_year[year_key]:
                    sections_by_year[year_key][section_key] = {
                        'section_info': {
                            'name': section.name,
                            'campus': section.campus,
                            'campus_display': section.get_campus_display(),
                            'intake': {
                                'id': section.intake.id if section.intake else None,
                                'name': section.intake.name if section.intake else None,
                                'semester_display': section.intake.get_semester_display() if section.intake else 'Unknown'
                            },
                            'program': {
                                'id': section.program.id if section.program else None,
                                'name': section.program.name if section.program else None,
                                'code': section.program.code if section.program else None,
                            }
                        },
                        'courses': {}
                    }
                
                course_code = delivery.course.code
                if course_code not in sections_by_year[year_key][section_key]['courses']:
                    sections_by_year[year_key][section_key]['courses'][course_code] = {
                        'course': {
                            'id': delivery.course.id,
                            'code': delivery.course.code,
                            'name': delivery.course.name,
                            'type': delivery.course.course_type,
                            'type_display': delivery.course.get_course_type_display() if delivery.course.course_type else '',
                            'credits': delivery.course.credits,
                            'sessions': delivery.course.sessions,
                            'area': {
                                'id': delivery.course.area.id if delivery.course.area else None,
                                'name': delivery.course.area.name if delivery.course.area else '',
                            } if delivery.course.area else None,
                        },
                        'assignments': {
                            'Segovia': {'morning': [], 'afternoon': []},
                            'Madrid A': {'morning': [], 'afternoon': []},
                            'Madrid B': {'morning': [], 'afternoon': []}
                        }
                    }
                
                # Add professor assignment
                if delivery.professor:
                    prof_data = {
                        'id': delivery.professor.id,
                        'name': f"{delivery.professor.name} {delivery.professor.last_name}",
                        'email': delivery.professor.corporate_email or delivery.professor.email,
                        'type': delivery.professor.get_professor_type_display(),
                        'section_name': section.name,
                        'delivery_id': delivery.id
                    }
                    
                    # Check professor's availability to determine time slot
                    time_slot = 'morning'
                    if delivery.professor.availabilities:
                        if 'afternoon' in delivery.professor.availabilities:
                            time_slot = 'afternoon'
                    
                    campus_key = section.campus
                    sections_by_year[year_key][section_key]['courses'][course_code]['assignments'][campus_key][time_slot].append(prof_data)
        
        # Convert sections_by_year to the expected format
        years_data = {}
        for year, sections in sections_by_year.items():
            years_data[year] = {
                'year': year,
                'sections': []
            }
            
            for section_key, section_data in sections.items():
                section_info = {
                    'section_info': section_data['section_info'],
                    'courses': list(section_data['courses'].values())
                }
                years_data[year]['sections'].append(section_info)
        
        # Sort years
        sorted_years = sorted(years_data.items(), key=lambda x: x[0])
        
        # Get available programs for filtering
        programs = Program.objects.all().values('id', 'name', 'code')
        
        # Get available intakes for filtering
        intakes = Intake.objects.all().values('id', 'name', 'semester', 'start_time', 'end_time')
        
        return Response({
            'years': dict(sorted_years),
            'filters': {
                'programs': list(programs),
                'intakes': list(intakes),
                'semesters': [
                    {'value': semester[0], 'display': semester[1]} 
                    for semester in SemesterType.choices
                ],
                'campuses': [
                    {'value': campus[0], 'display': campus[1]} 
                    for campus in CampusChoices.choices
                ],
                'time_slots': [
                    {'value': slot[0], 'display': slot[1]} 
                    for slot in AvailabilityChoices.choices
                ]
            }
        })