# IE University Management System API

This Django project provides a comprehensive REST API for managing IE University's academic data including professors, courses, programs, and more.

## API Endpoints

The API is available at `/api/` and provides the following endpoints:

### Core University Entities

- **Universities**: `/api/universities/`
  - GET, POST, PUT, PATCH, DELETE operations
  - Search by name, country
  - Filter by country

- **Degrees**: `/api/degrees/`
  - GET, POST, PUT, PATCH, DELETE operations
  - Search by name, university name
  - Filter by degree_type, university

- **Areas**: `/api/areas/`
  - GET, POST, PUT, PATCH, DELETE operations
  - Search by name

- **Programs**: `/api/programs/`
  - GET, POST, PUT, PATCH, DELETE operations
  - Search by name, code
  - Filter by school, type

- **Intakes**: `/api/intakes/`
  - GET, POST, PUT, PATCH, DELETE operations
  - Search by name
  - Filter by semester, active status

- **Sections**: `/api/sections/`
  - GET, POST, PUT, PATCH, DELETE operations
  - Search by name, program name/code
  - Filter by name, campus, course_year, program, intake

- **Courses**: `/api/courses/`
  - GET, POST, PUT, PATCH, DELETE operations
  - Search by name, code, area name
  - Filter by course_type, area, programs

- **Professors**: `/api/professors/`
  - GET, POST, PUT, PATCH, DELETE operations
  - Search by name, last_name, email, corporate_email
  - Filter by professor_type, gender, accredited, joined_year
  - Special endpoints:
    - `/api/professors/simple/` - Simplified list for dropdowns
    - `/api/professors/{id}/courses/` - Get courses for a specific professor
    - `/api/professors/{id}/degrees/` - Get degrees for a specific professor

### Relationship Entities

- **Professor Degrees**: `/api/professor-degrees/`
  - Manage professor-degree relationships
  - Filter by professor, degree, degree_type

- **Professor Course Possibilities**: `/api/professor-course-possibilities/`
  - Manage which courses professors can teach
  - Filter by professor, course

- **Course Deliveries**: `/api/course-deliveries/`
  - Manage actual course assignments
  - Search by course name/code, professor name
  - Filter by course, professor

- **Course Delivery Sections**: `/api/course-delivery-sections/`
  - Manage course delivery to section relationships
  - Filter by course_delivery, section

### Business Logic Endpoints

- **Current Intakes**: `/api/current-intakes/`
  - Get current intake information with missing professors statistics
  - Optional date parameter: `?date=YYYY-MM-DD`
  - Returns intake data with missing professor counts

- **Program Delivery Overview**: `/api/program-delivery/{program_id}/{intake_id}/`
  - Get detailed overview of course deliveries for a specific program and intake
  - Returns program info, intake info, and sections with their course deliveries

## Features

- **Pagination**: All list endpoints support pagination (50 items per page by default)
- **Filtering**: Use query parameters to filter results
- **Searching**: Use `?search=query` to search across relevant fields
- **Ordering**: Use `?ordering=field_name` or `?ordering=-field_name` for desc
- **Browsable API**: Visit endpoints in your browser for an interactive interface

## Example Usage

```bash
# Get all professors
curl http://127.0.0.1:8000/api/professors/

# Search for professors
curl "http://127.0.0.1:8000/api/professors/?search=john"

# Filter professors by type
curl "http://127.0.0.1:8000/api/professors/?professor_type=f"

# Get courses with pagination
curl "http://127.0.0.1:8000/api/courses/?page=2"

# Get simplified professor list
curl http://127.0.0.1:8000/api/professors/simple/

# Get current intakes with missing professors
curl "http://127.0.0.1:8000/api/current-intakes/"

# Get current intakes for specific date
curl "http://127.0.0.1:8000/api/current-intakes/?date=2025-10-01"

# Get program delivery overview
curl "http://127.0.0.1:8000/api/program-delivery/1/1/"
```

## Setup

1. Install dependencies: `poetry install`
2. Run migrations: `poetry run python manage.py migrate`
3. Create superuser: `poetry run python manage.py createsuperuser`
4. Run server: `poetry run python manage.py runserver`
5. Visit `http://127.0.0.1:8000/api/` to explore the API

## Admin Interface

Access the Django admin at `http://127.0.0.1:8000/admin/` to manage data through a web interface.
