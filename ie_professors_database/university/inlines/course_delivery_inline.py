from unfold.contrib.inlines.admin import NonrelatedTabularInline
from unfold.admin import TabularInline
from university.models import CourseDelivery
from django.utils.translation import gettext_lazy as _

class CourseDeliveryInline(NonrelatedTabularInline):
    model = CourseDelivery
    tab = True
    extra = 1
    autocomplete_fields = ['professor', 'course']
    exclude = ['sections'] 

    def get_form_queryset(self, obj):
        return self.model.objects.filter(sections=obj)

    def save_new_instance(self, parent, instance):
        instance.save()
        instance.sections.add(parent)


class CourseDeliveryForCourseInline(TabularInline):
    model = CourseDelivery
    tab = True
    extra = 0
    can_delete = False
    readonly_fields = [
        'get_professor_name', 
        'get_professor_email', 
        'get_course_credits', 
        'get_semester_info', 
        'get_year_info', 
        'get_campus_info'
    ]
    fields = [
        'get_professor_name', 
        'get_professor_email', 
        'get_course_credits', 
        'get_semester_info', 
        'get_year_info', 
        'get_campus_info'
    ]
    verbose_name = _("Course Delivery")
    verbose_name_plural = _("Course Deliveries")
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        # Filter by the current course instance
        if hasattr(self, 'parent_instance') and self.parent_instance:
            queryset = queryset.filter(course=self.parent_instance)
        return queryset.select_related('professor', 'course').prefetch_related('sections__intake')
    
    def has_add_permission(self, request, obj=None):
        return False
    
    def get_professor_name(self, obj):
        if obj.professor:
            return f"{obj.professor.name} {obj.professor.last_name}"
        return "-"
    get_professor_name.short_description = _("Professor")
    
    def get_professor_email(self, obj):
        if obj.professor:
            return obj.professor.corporate_email or obj.professor.email
        return "-"
    get_professor_email.short_description = _("Professor Email")
    
    def get_course_credits(self, obj):
        if obj.course:
            return obj.course.credits
        return "-"
    get_course_credits.short_description = _("Credits")
    
    def get_semester_info(self, obj):
        if not obj.pk:
            return "-"
        sections = obj.sections.all()
        semesters = {section.intake.get_semester_display() for section in sections if section.intake}
        return ", ".join(sorted(semesters))
    get_semester_info.short_description = _("Semester")
    
    def get_year_info(self, obj):
        if not obj.pk:
            return "-"
        sections = obj.sections.all()
        years = {str(section.course_year) for section in sections}
        return ", ".join(sorted(years))
    get_year_info.short_description = _("Year")
    
    def get_campus_info(self, obj):
        if not obj.pk:
            return "-"
        sections = obj.sections.all()
        campuses = {section.get_campus_display() for section in sections}
        return ", ".join(sorted(campuses))
    get_campus_info.short_description = _("Campus")
