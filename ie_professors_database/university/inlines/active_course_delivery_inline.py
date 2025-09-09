from unfold.admin import TabularInline
from university.models import CourseDelivery
from django.utils.translation import gettext_lazy as _

class ActiveCourseDeliveryInline(TabularInline):
    model = CourseDelivery
    tab = True
    extra = 0
    can_delete = False
    readonly_fields = ['get_course_name', 'get_course_code', 'get_course_type', 'get_course_area', 'get_sections_info', 'get_programs_info', 'get_course_credits']
    fields = ['get_course_name', 'get_course_code', 'get_course_type', 'get_course_area', 'get_sections_info', 'get_programs_info', 'get_course_credits']
    verbose_name = _("Active Course")
    verbose_name_plural = _("Active Courses")
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.filter(
            sections__intake__active=True
        ).distinct().select_related('course', 'course__area').prefetch_related('sections__program', 'sections__intake')
    
    def has_add_permission(self, request, obj=None):
        return False
    
    def get_course_name(self, obj):
        if obj.course:
            # Return just the course name without any additional formatting
            return obj.course.name
        return "-"
    get_course_name.short_description = _("Course Name")
    
    def get_course_code(self, obj):
        if obj.course:
            # Return just the course code without any additional formatting
            return obj.course.code
        return "-"
    get_course_code.short_description = _("Code")
    
    def get_course_type(self, obj):
        if obj.course and obj.course.course_type:
            return obj.course.get_course_type_display()
        return "-"
    get_course_type.short_description = _("Type")
    
    def get_course_area(self, obj):
        return obj.course.area.name if obj.course and obj.course.area else "-"
    get_course_area.short_description = _("Area")
    
    def get_sections_info(self, obj):
        if not obj.pk:
            return "-"
        sections = obj.sections.filter(intake__active=True)
        return ", ".join([f"{section.name} ({section.get_campus_display()})" for section in sections])
    get_sections_info.short_description = _("Sections")
    
    def get_programs_info(self, obj):
        if not obj.pk:
            return "-"
        sections = obj.sections.filter(intake__active=True)
        programs = {f"{section.program.name} - Year {section.course_year}" for section in sections if section.program}
        return ", ".join(sorted(programs))
    get_programs_info.short_description = _("Programs & Year")
    
    def get_course_credits(self, obj):
        if obj.course:
            return obj.course.credits
        return "-"
    get_course_credits.short_description = _("Credits") 