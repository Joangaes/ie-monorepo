from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Intake, Course, Professor, CourseDelivery, Program,Section, ProfessorDegree,University,Degree,Area,ProfessorCoursePossibility,CampusChoices,AvailabilityChoices,CurrentIntake,JoinedAcademicYear,SemesterType
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.models import User, Group
from modeltranslation.admin import TabbedTranslationAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from unfold.admin import ModelAdmin,TabularInline
from django.http import HttpRequest
from urllib.parse import parse_qs
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from django.shortcuts import redirect
from unfold.decorators import action
from university.views import CurrentIntakeLandingView,ProgramDeliveryOverviewView
from django.urls import path
from unfold.decorators import action
from import_export.admin import ImportExportModelAdmin
from unfold.contrib.import_export.forms import ImportForm, ExportForm, SelectableFieldsExportForm
from simple_history.admin import SimpleHistoryAdmin
from django.contrib.postgres.fields import ArrayField
from unfold.contrib.forms.widgets import ArrayWidget
from django.utils.encoding import force_str
from unfold.contrib.filters.admin import (
    DropdownFilter,
    AutocompleteSelectMultipleFilter
)
from university.inlines import CourseDeliveryInline, CourseDeliveryForCourseInline, ActiveCourseDeliveryInline
from university.filters import (
    ProfessorIsNullFilter, 
    MissingCorporateEmailFilter,
    ActiveIntakeFilterWithDefault,
    WorkingActiveFilter,
    SimpleActiveIntakeFilter,
)
from django.utils.html import format_html
from django.contrib.admin import SimpleListFilter
from django.utils.translation import gettext_lazy as _


admin.site.unregister(User)
admin.site.unregister(Group)


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass

@admin.register(Intake)
class IntakeAdmin(SimpleHistoryAdmin,ModelAdmin,ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ("name", "start_time", "end_time", "semester","active")
    search_fields = ("name",)
    actions_row = ["view_sections_action"]
    list_per_page = 50
    show_full_result_count = False
    
    fieldsets = (
        (None, {
            'fields': (('name',"active"), 'start_time', 'end_time', 'semester')
        }),
    )

    @action(
        description=_("Sections"),
        permissions=[],
        url_path="intake-section-row-action",
        attrs={"target": "_blank"}
    )
    def view_sections_action(self, request: HttpRequest, object_id: int):
        url = (
            reverse("admin:university_section_changelist") +
            f"?intake__id__exact={object_id}"
        )
        return redirect(url)
    
    def get_urls(self):
        return super().get_urls() + [
            path(
                "programs/<int:program_id>/overview", 
            ProgramDeliveryOverviewView.as_view(model_admin=self), name="program_delivery_overview"
            ),
        ]

    
    
    
@admin.register(CurrentIntake)
class CurrentIntakeAdmin(ModelAdmin,ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ("name", "start_time", "end_time", "semester")
    def get_urls(self):
        return super().get_urls() + [
            path(
                "dashboard/current-intake-landing", 
            CurrentIntakeLandingView.as_view(model_admin=self)
        , name="university_intake_current_intake_landing"
            ),
        ]


@admin.register(Course)
class CourseAdmin(ModelAdmin,TabbedTranslationAdmin,ImportExportModelAdmin,SimpleHistoryAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    inlines = [CourseDeliveryForCourseInline]
    list_display = ("name","area", "code","course_type", "credits", "sessions")
    search_fields = ("code", "name")
    autocomplete_fields = ["programs","area"]
    list_select_related = ["area"]
    list_filter = [
        "coursedelivery__professor",
        "coursedelivery__professor__degrees",
        "coursedelivery__sections__intake__semester",
        "coursedelivery__sections__joined_academic_year",
        "area",
        "programs",
        "course_type",
    ]
    list_filter_submit = True
    list_per_page = 25  # Reduce for better performance with many-to-many relationships
    show_full_result_count = False
    
    fieldsets = (
        (None, {
            'fields': ('code', 'name', 'area', 'course_type', 'credits', 'sessions')
        }),
        (_("Programs"), {
            'fields': ('programs',),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('area').prefetch_related(
            'programs',
            'coursedelivery_set__professor',
            'coursedelivery_set__sections__program',
            'coursedelivery_set__sections__intake'
        )
    

@admin.register(University)
class UniversityAdmin(ModelAdmin,SimpleHistoryAdmin,ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ("name", "country")
    search_fields = ("name",)
    
    fieldsets = (
        (None, {
            'fields': ('name', 'country')
        }),
    )

@admin.register(Degree)
class DegreeAdmin(ModelAdmin,SimpleHistoryAdmin,ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ("name", "degree_type", "university")
    list_filter = ("degree_type", "university")
    search_fields = ("name", "university__name")
    autocomplete_fields = ["university"]
    
    fieldsets = (
        (None, {
            'fields': ('name', 'university', 'degree_type')
        }),
    )

class ProfessorDegreeInline(TabularInline):
    model = ProfessorDegree
    extra = 1
    autocomplete_fields = ['degree']
    tab=True

class ProfessorCoursePossibilityInLine(TabularInline):
    model = ProfessorCoursePossibility
    extra = 1
    autocomplete_fields = ['course']
    tab=True

@admin.register(Professor)
class ProfessorAdmin(ModelAdmin,ImportExportModelAdmin,SimpleHistoryAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm

    inlines = [ProfessorDegreeInline, ProfessorCoursePossibilityInLine, ActiveCourseDeliveryInline]
    list_display = ("name","last_name", "email", "get_campuses", "professor_type")
    search_fields = ("name", "email", "last_name","corporate_email")
    list_filter = [
        "professor_type",
        "accredited",
        "joined_year",
        "degrees",
        "courses",
        "coursedelivery__sections__program",
        "coursedelivery__sections__intake__semester",
        "coursedelivery__sections__joined_academic_year",
        "coursedelivery__sections__campus",
        "campuses",
        ProfessorIsNullFilter,
        MissingCorporateEmailFilter,
    ]
    list_filter_submit = True
    list_per_page = 50  # Reduce pagination load
    show_full_result_count = False  # Avoid expensive COUNT(*) queries
    
    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related(
            'degrees__degree__university',
            'courses__area',
            'coursedelivery_set__course',
            'coursedelivery_set__sections__program',
            'coursedelivery_set__sections__intake'
        )

    def get_campuses(self, obj:Professor):
        if not obj.campuses:
            return "-"
        choices_dict = dict(CampusChoices.choices)
        return ", ".join(force_str(choices_dict.get(c, c)) for c in obj.campuses)
    get_campuses.short_description = "Campuses"

    def get_availabilities(self, obj:Professor):
        if not obj.availabilities:
            return "-"
        choices_dict = dict(AvailabilityChoices.choices)
        return ", ".join(force_str(choices_dict.get(c, c)) for c in obj.availabilities)
    get_availabilities.short_description = "Availability"

    fieldsets = (
        (_("Personal Information"), {
            'fields': (
                ('name','last_name'),
                ('birth_year', 'joined_year', 'gender'),
            ),
            'classes': ('wide',),
        }),
        (_("Professional Information"), {
            'fields': (
                ('campuses', 'minimum_number_of_sessions',),
                ('availabilities','professor_type','accredited'),
            ),
            'classes': ('wide',),
        }),
        (_("Contact Information"), {
            'fields': (
                ('email', 'corporate_email'),
                ('phone_number','linkedin_profile'),
            ),
            'classes': ('wide',),
        }),
    )

    formfield_overrides = {
        ArrayField: {
            "widget": ArrayWidget,
        }
    }

    def get_form(self, request, obj=None, change=False, **kwargs):
        form = super().get_form(request, obj, change, **kwargs)
        form.base_fields["campuses"].widget = ArrayWidget(choices=CampusChoices.choices)
        form.base_fields["availabilities"].widget = ArrayWidget(choices=AvailabilityChoices.choices)
        return form

@admin.register(CourseDelivery)
class CourseDeliveryAdmin(ModelAdmin,SimpleHistoryAdmin,ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ("course","get_programs", "professor")
    search_fields = ("course__name", "professor__name",)
    autocomplete_fields = ("course", "professor", "sections")
    # Remove list_select_related since we're handling it in get_queryset
    list_filter = [
        WorkingActiveFilter,
        ("sections__intake__semester"),
        SimpleActiveIntakeFilter,
        ("course",AutocompleteSelectMultipleFilter),
        ("sections__program",AutocompleteSelectMultipleFilter),
        ("professor",AutocompleteSelectMultipleFilter),
    ]
    # Disable list_editable completely to eliminate N+1 queries
    # list_editable = ["professor"]
    list_filter_submit = True
    list_per_page = 25  # Reduce page size for better performance
    show_full_result_count = False

    fieldsets = (
        (None, {
            'fields': ('course','sections','professor')
        }),
    )

    def get_queryset(self, request):
        # Completely remove the active filtering that causes complex JOINs
        # Users can filter manually if needed
        return CourseDelivery.objects.select_related(
            'course', 
            'course__area', 
            'professor'
        ).prefetch_related(
            'sections',
            'sections__intake',
            'sections__program',
            'sections__joined_academic_year'
        ).all()
    
    @admin.display(description="Programs")
    def get_programs(self, obj: CourseDelivery):
        # Use prefetched data to avoid N+1 queries
        if hasattr(obj, '_prefetched_objects_cache') and 'sections' in obj._prefetched_objects_cache:
            sections = obj._prefetched_objects_cache['sections']
        else:
            sections = obj.sections.all()
            
        programs = {
            f"{section.program.name} – Year {section.course_year} - {section.get_campus_display()}"
            for section in sections
            if section.program
        }
        return format_html("<br>".join(sorted(programs)))
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "professor":
            # Use optimized queryset for professor field to avoid N+1 queries
            kwargs["queryset"] = Professor.objects.select_related().all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Program)
class ProgramAdmin(ModelAdmin,SimpleHistoryAdmin,ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ("name", "school","type", "academic_director")
    search_fields = ("name","code")
    list_filter = ("school",)
    autocomplete_fields = ["academic_director"]
    list_per_page = 50
    show_full_result_count = False
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('academic_director')

@admin.register(Section)
class SectionAdmin(ModelAdmin,SimpleHistoryAdmin,ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ("course_year","name", "intake", "campus", "program")
    search_fields = ("name","campus")
    list_filter = ("campus", "intake")
    list_per_page = 50
    show_full_result_count = False
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'intake', 'program', 'joined_academic_year'
        ).prefetch_related(
            'coursedelivery_set__course',
            'coursedelivery_set__professor'
        )
    autocomplete_fields = ["intake",'program',"joined_academic_year"]
    inlines = [CourseDeliveryInline]
    list_select_related = ["intake", "program"]
    
    fieldsets = (
        (None, {
            'fields': ('name', 'intake', 'campus', 'course_year','program','joined_academic_year')
        }),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if not obj and "_changelist_filters" in request.GET:
            raw_filters = request.GET.get("_changelist_filters")
            parsed_filters = parse_qs(raw_filters)
            intake_id = (
                parsed_filters.get("intake__id__exact") or 
                parsed_filters.get("intake")
            )
            if intake_id:
                form.base_fields["intake"].initial = intake_id[0]
        return form
    
@admin.register(Area)
class AreaAdmin(ModelAdmin,TabbedTranslationAdmin,SimpleHistoryAdmin,ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ["name"]
    search_fields = ["name"]
    
    fieldsets = (
        (None, {
            'fields': ('name',)
        }),
    ) 

@admin.register(JoinedAcademicYear)
class JoinedAcademicYearAdmin(ModelAdmin,SimpleHistoryAdmin,ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ["name","start_date"]
    search_fields = ["name","start_date"]
    list_per_page = 50
    show_full_result_count = False
