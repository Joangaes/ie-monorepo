from django.db import models
from django_countries.fields import CountryField
from django.utils.translation import gettext_lazy as _
from general.models import BaseModel
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth.models import User

class SemesterType(models.TextChoices):
    FALL= "fall", _("Fall")
    SPRING = "spring", _("Spring")

class CampusChoices(models.TextChoices):
    SEGOVIA = "Segovia", _("Segovia")
    MADRID_A = "Madrid A", _("Madrid IE Tower")
    MADRID_MM = "Madrid B", _("Madrid Maria de Molina")

class AvailabilityChoices(models.TextChoices):
    MORNING = "morning", _("Morning")
    AFTERNOON = "afternoon", _("Afternoon")

class Intake(BaseModel):
    name = models.CharField(_("Name"), max_length=100, unique=True)
    start_time = models.DateField(_("Start Time"),db_index=True)
    end_time = models.DateField(_("End Time"))
    semester = models.CharField(_("Semester"), max_length=10,choices=SemesterType.choices)
    active = models.BooleanField(_("Active"),default=True)

    def __str__(self):
        return f"{self.start_time} - {self.end_time} - {self.get_semester_display()}"
    
    @classmethod
    def get_active_at(cls, date):
        return cls.objects.filter(start_time__lte=date, end_time__gte=date)

    class Meta:
        verbose_name = _("Term/Semester")
        verbose_name_plural = _("Intakes")
        ordering = ["-start_time"]

class CurrentIntake(Intake):
    class Meta:
        proxy = True
        verbose_name = _("Current Intake")
        verbose_name_plural = _("Current Intakes")

class JoinedAcademicYear(BaseModel):
    name = models.CharField(_("Name"),max_length=120)
    start_date = models.DateField(_("Start Date"))
    
    def __str__(self):
        return self.name



class Schools(models.TextChoices):
    IE_BUSINESS_SCHOL = "business", _("Business School")
    IE_LAW_SCHOOL = "law", _("Law School")
    IE_SCHOOL_OF_HUMAN_SCIENCE_AND_TECHNOLOGY = "sci_and_tech", _("Science and Technology School")
    IE_SCHOOL_OF_HUMANITIES = "humanities", _("School of Humanities")
    IE_POLITICS_ECONOMICS_AND_GLOBAL_AFFAIRS = "econ_glo_affa", _("Politics, Economics and Global Affairs School")
    IE_SCHOOL_OF_ARCHITECTURE_AND_DESIGN = "arch", _("School of Architecture and Design")

class ProgramTypeChoices(models.TextChoices):
    BACHELORS = "ba", _("Bachelors")
    MASTER = "ma", _("Master")

class Program(BaseModel):
    name = models.CharField(_("Name"), max_length=255)
    school = models.CharField(_("School"), max_length=13,choices=Schools.choices)
    code = models.CharField(_("Code"), max_length=10, unique=True,null=True)
    type = models.CharField(_("Type"), max_length=2,choices = ProgramTypeChoices.choices,default=ProgramTypeChoices.BACHELORS)
    years = models.PositiveIntegerField(_("Years"), default=4, help_text=_("Duration of the program in years"))
    academic_director = models.ForeignKey(User, verbose_name=_("Academic Director"), on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

    class Meta:
        verbose_name = _("Program")
        verbose_name_plural = _("Programs")

class Area(models.Model):
    name = models.CharField(_("Name"), max_length=120)

    def __str__(self):
        return f"{self.name}"
    
    class Meta:
        verbose_name = _("Area")
        verbose_name_plural = _("Areas")
    
class CourseTypes(models.TextChoices):
    BASIC = "BA", _("Basic")
    OBLIGATORY = "OB", _("Obligatory")
    OPTIONAL = "OP", _("Optional")
    COMPLENTARY_ACTIVITY = "CA", _("Complementary Activity")
    ELECTIVES = "EL", _("Electives")
    REGULAR = "RE", _("Regular")
    OTHER_ACTIVITIES = "OACT", _("Other Activities")
    

class Course(models.Model):
    programs = models.ManyToManyField(Program, verbose_name=_("Programs"), blank=True)
    area = models.ForeignKey(Area, verbose_name=_("Area"), null=True,on_delete=models.CASCADE)
    code = models.CharField(_("Abbreviation"), max_length=10, unique=True)
    name = models.CharField(_("Name"), max_length=255)
    course_type = models.CharField(_("Course Type"), max_length=4, choices=CourseTypes.choices, blank=True)
    credits = models.FloatField(_("Credits"))
    sessions = models.IntegerField(_("Sessions"))
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    class Meta:
        verbose_name = _("Course")
        verbose_name_plural = _("Courses")
    
class Section(BaseModel):
    name = models.CharField(_("Name"), max_length=50)
    intake = models.ForeignKey(Intake, verbose_name=_("Intake"), on_delete=models.CASCADE)
    campus = models.CharField(_("Campus"), max_length=50, choices=CampusChoices.choices)
    course_year = models.SmallIntegerField(_("Course Year"), default=1)
    program = models.ForeignKey(Program, verbose_name=_("Program"), on_delete=models.CASCADE, null=True, blank=True)
    joined_academic_year = models.ForeignKey(JoinedAcademicYear, verbose_name=_("Intake"),null=True,on_delete=models.CASCADE)

    def __str__(self):
        joined_year = self.joined_academic_year.name if self.joined_academic_year else "No Academic Year"
        program_code = self.program.code if self.program else "No Program"
        return f"{joined_year} - Section {self.name} - {self.campus} - {program_code}" 
    
    class Meta:
        unique_together = [["name","intake","campus","course_year","program"]]
        ordering = ["-created_at"]
        verbose_name = _("Section")
        verbose_name_plural = _("Sections")
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["intake", "program"]),
            models.Index(fields=["program", "course_year"]),
            models.Index(fields=["campus", "course_year"]),
        ]

class University(BaseModel):
    name = models.CharField(_("Name"), max_length=255, unique=True)
    country = CountryField(_("Country"))

    class Meta:
        ordering = ["-name"]
        verbose_name = _("University")
        verbose_name_plural = _("Universities")

    def __str__(self):
        return f"{self.name} - {self.country}" 
    

class DegreeType(models.TextChoices):
    BACHELOR = "b", _("Bachelor")
    MASTER = "m", _("Master")
    DOCTORATE = "d", _("Doctorate")
    OTHER = "o", _("Other")

class Degree(BaseModel):
    name = models.CharField(_("Name"), max_length=255, unique=True)
    university = models.ForeignKey(University, verbose_name=_("University"), on_delete=models.CASCADE)
    degree_type = models.CharField(_("Degree Type"), max_length=1, choices=DegreeType.choices)

    class Meta:
        unique_together = ("name", "university")
        verbose_name = _("Degree")
        verbose_name_plural = _("Degrees")

    def __str__(self):
        return f"{self.name} ({self.get_degree_type_display()})"

class ProfessorType(models.TextChoices):
    FACULTY= "f", _("Faculty")
    ADJUNCT_PROFESSOR="a", _("Adjunct Professor")
    VISITING_PROFESSOR="v", _("Visiting Professor")

class Professor(BaseModel):
    name = models.CharField(_("Name"), max_length=255, db_index=True)
    last_name = models.CharField(_("Last Name"),max_length=120,db_index=True)
    email = models.EmailField(_("Personal Email"),db_index=True)
    corporate_email = models.EmailField(_("Corporate Email"), null=True, unique=True,blank=True)
    phone_number = models.CharField(_("Phone Number"), max_length=20,null=True,blank=True)
    campuses = ArrayField(
    base_field=models.CharField(_("Campus"), max_length=50, choices=CampusChoices.choices),
    default=list,
    blank=True,
)
    availabilities =ArrayField(
        base_field= models.CharField(_("Availability"), max_length=50, choices=AvailabilityChoices.choices),
                             default=list, 
                             blank=True)
    professor_type = models.CharField(_("Professor Type"), max_length=1,choices=ProfessorType.choices, default=ProfessorType.FACULTY)
    minimum_number_of_sessions = models.PositiveIntegerField(_("PDP (required number of sessions)"), default=0)
    birth_year = models.PositiveIntegerField(_("Birth Year"), null=True, blank=True)
    gender = models.CharField(_("Gender"), max_length=1, choices=[("H", _( "Male")), ("M", _( "Female"))], blank=True)
    joined_year = models.PositiveIntegerField(_("Joined Year"), null=True, blank=True)
    linkedin_profile = models.URLField(_("LinkedIn Profile"), null=True, blank=True)
    accredited = models.BooleanField(_("Accredited"), null=True, blank=True)
    
    degrees = models.ManyToManyField(Degree, through='ProfessorDegree')
    courses = models.ManyToManyField(Course, through='ProfessorCoursePossibility')

    def __str__(self):
        return f"{self.name} {self.last_name} - {self.corporate_email}"
    
    class Meta:
        verbose_name = _("Professor")
        verbose_name_plural = _("Professors")
    
class ProfessorDegree(BaseModel):
    professor = models.ForeignKey(Professor, verbose_name=_("Professor"), on_delete=models.CASCADE)
    degree = models.ForeignKey(Degree, verbose_name=_("Degree"), on_delete=models.CASCADE)

    class Meta:
        unique_together = ("professor", "degree")
        verbose_name = _("Professor Degree")
        verbose_name_plural = _("Professor Degrees")

    def __str__(self):
        return f"{self.professor} - {self.degree}"
    
class ProfessorCoursePossibility(BaseModel):
    professor = models.ForeignKey(Professor, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("professor", "course")
        verbose_name = _("Course Possibilitie")

    def __str__(self):
        return f"{self.professor} - {self.course}"


class CourseDeliveryManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related('course', 'professor').prefetch_related('sections')
    
    def with_full_relations(self):
        return self.get_queryset().select_related(
            'course__area',
            'professor'
        ).prefetch_related(
            'sections__intake',
            'sections__program',
            'sections__joined_academic_year'
        )

class CourseDelivery(BaseModel):
    course = models.ForeignKey(Course, verbose_name=_("Course"), on_delete=models.CASCADE,null=True)
    professor = models.ForeignKey(Professor, verbose_name=_("Professor"), on_delete=models.CASCADE,null=True,blank=True)
    sections = models.ManyToManyField(Section, verbose_name=_("Section"))
    
    objects = CourseDeliveryManager()

    def __str__(self):
        return ""
    
    class Meta:
        verbose_name = _("Course Delivery")
        verbose_name_plural = _("Course Deliveries")
        indexes = [
            models.Index(fields=["course", "professor"]),
            models.Index(fields=["professor"]),
            models.Index(fields=["course"]),
            models.Index(fields=["-created_at"]),
        ]

class CourseDeliverySection(models.Model):
    course_delivery = models.ForeignKey(CourseDelivery, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('course_delivery', 'section')

