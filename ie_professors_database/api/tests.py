from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from university.models import (
    University, Degree, Area, Program, Intake, Section, Course, 
    Professor, CourseDelivery, ProfessorDegree, ProfessorCoursePossibility,
    JoinedAcademicYear, CourseDeliverySection
)
from datetime import date

class APITestCase(APITestCase):
    """Base test case with common setup for API tests."""

    def setUp(self):
        # Create test data
        self.university = University.objects.create(
            name="Test University",
            country="US"
        )
        
        self.degree = Degree.objects.create(
            name="Computer Science PhD",
            university=self.university,
            degree_type="d"
        )
        
        self.area = Area.objects.create(name="Computer Science")
        
        self.program = Program.objects.create(
            name="Computer Science Program",
            school="sci_and_tech",
            code="CS",
            type="ba"
        )
        
        self.intake = Intake.objects.create(
            name="Fall 2025",
            start_time=date(2025, 9, 1),
            end_time=date(2025, 12, 15),
            semester="fall"
        )
        
        self.joined_academic_year = JoinedAcademicYear.objects.create(
            name="2025-2026",
            start_date=date(2025, 9, 1)
        )
        
        self.section = Section.objects.create(
            name="A",
            intake=self.intake,
            campus="Segovia",
            course_year=1,
            program=self.program,
            joined_academic_year=self.joined_academic_year
        )
        
        self.course = Course.objects.create(
            code="CS101",
            name="Introduction to Computer Science",
            course_type="BA",
            credits=3.0,
            sessions=12,
            area=self.area
        )
        
        self.professor = Professor.objects.create(
            name="John",
            last_name="Doe",
            email="john.doe@example.com",
            corporate_email="john.doe@university.edu",
            professor_type="f",
            campuses=["Segovia"],
            availabilities=["morning"]
        )

class UniversityAPITest(APITestCase):
    """Test University API endpoints."""

    def test_list_universities(self):
        url = '/api/universities/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_university(self):
        url = '/api/universities/'
        data = {
            'name': 'New University',
            'country': 'UK'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(University.objects.count(), 2)

    def test_retrieve_university(self):
        url = f'/api/universities/{self.university.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test University')

    def test_update_university(self):
        url = f'/api/universities/{self.university.id}/'
        data = {
            'name': 'Updated University',
            'country': 'US'
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.university.refresh_from_db()
        self.assertEqual(self.university.name, 'Updated University')

    def test_delete_university(self):
        url = f'/api/universities/{self.university.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(University.objects.count(), 0)

    def test_search_universities(self):
        url = '/api/universities/?search=Test'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_filter_universities(self):
        url = '/api/universities/?country=US'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

class ProfessorAPITest(APITestCase):
    """Test Professor API endpoints."""

    def test_list_professors(self):
        url = '/api/professors/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_professor(self):
        url = '/api/professors/'
        data = {
            'name': 'Jane',
            'last_name': 'Smith',
            'email': 'jane.smith@example.com',
            'corporate_email': 'jane.smith@university.edu',
            'professor_type': 'a',
            'campuses': ['Madrid A'],
            'availabilities': ['afternoon']
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Professor.objects.count(), 2)

    def test_professor_simple_endpoint(self):
        url = '/api/professors/simple/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_search_professors(self):
        url = '/api/professors/?search=John'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

class CourseAPITest(APITestCase):
    """Test Course API endpoints."""

    def test_list_courses(self):
        url = '/api/courses/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_course(self):
        url = '/api/courses/'
        data = {
            'code': 'CS102',
            'name': 'Data Structures',
            'course_type': 'OB',
            'credits': 4.0,
            'sessions': 15,
            'area': self.area.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Course.objects.count(), 2)

class BusinessLogicAPITest(APITestCase):
    """Test custom business logic API endpoints."""

    def test_current_intakes_endpoint(self):
        url = '/api/current-intakes/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('selected_date', response.data)
        self.assertIn('intakes', response.data)

    def test_current_intakes_with_date_param(self):
        url = '/api/current-intakes/?date=2025-10-01'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['selected_date'], '2025-10-01')

    def test_program_delivery_overview(self):
        url = f'/api/program-delivery/{self.program.id}/{self.intake.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('program', response.data)
        self.assertIn('intake', response.data)
        self.assertIn('sections', response.data)

    def test_program_delivery_overview_not_found(self):
        url = '/api/program-delivery/999/999/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class RelationshipAPITest(APITestCase):
    """Test relationship model API endpoints."""

    def test_professor_degrees_endpoint(self):
        # Create a professor degree relationship
        prof_degree = ProfessorDegree.objects.create(
            professor=self.professor,
            degree=self.degree
        )
        
        url = '/api/professor-degrees/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_course_deliveries_endpoint(self):
        # Create a course delivery
        delivery = CourseDelivery.objects.create(
            course=self.course,
            professor=self.professor
        )
        delivery.sections.add(self.section)
        
        url = '/api/course-deliveries/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

class FilteringAndOrderingTest(APITestCase):
    """Test filtering, searching, and ordering functionality."""

    def setUp(self):
        super().setUp()
        # Create additional test data for filtering
        self.university2 = University.objects.create(
            name="Another University",
            country="UK"
        )

    def test_university_ordering(self):
        url = '/api/universities/?ordering=name'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_university_reverse_ordering(self):
        url = '/api/universities/?ordering=-name'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_pagination(self):
        # Create more universities to test pagination
        for i in range(55):  # More than page size (50)
            University.objects.create(
                name=f"University {i}",
                country="US"
            )
        
        url = '/api/universities/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 50)  # Page size
        self.assertIsNotNone(response.data['next'])  # Next page exists
