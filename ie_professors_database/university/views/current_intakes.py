from django.views.generic import TemplateView
from unfold.views import UnfoldModelAdminViewMixin
from university.models import Intake,CourseDelivery
from django.utils import timezone
from django.db.models import Count, Q
from collections import defaultdict
from datetime import datetime
from university.forms.intake_date_filter_form import IntakeDateFilterForm

class CurrentIntakeLandingView(UnfoldModelAdminViewMixin, TemplateView):
    title = "Current Intake"
    permission_required = ()
    template_name = "admin/intakes/current_intake_landing.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        request = self.request
        date_str = request.GET.get('date')
        if date_str:
            try:
                selected_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                selected_date = timezone.now().date()
        else:
            selected_date = timezone.now().date()

        date_form = IntakeDateFilterForm(initial={'date': selected_date})

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

        course_deliveries = (
            CourseDelivery.objects
            .filter(professor__isnull=True, sections__intake__in=intakes)
            .select_related("course")
            .prefetch_related("sections__intake", "sections__program")
            .distinct()
        )

        # Map intake.id → { program_id → { program, total_missing, sections } }
        grouped_by_intake = defaultdict(lambda: defaultdict(lambda: {
            "program": None,
            "total_missing": 0,
            "sections": defaultdict(lambda: {
                "section_name": "",
                "course_year": "",
                "campus": "",
                "missing_count": 0,
            })
        }))

        for cd in course_deliveries:
            for section in cd.sections.all():
                intake = section.intake
                program = section.program
                program_data = grouped_by_intake[intake.id][program.id]
                program_data["program"] = program
                program_data["total_missing"] += 1

                section_key = (section.name, section.course_year, section.campus)
                program_data["sections"][section_key].update({
                    "section_name": section.name,
                    "course_year": section.course_year,
                    "campus": section.campus,
                })
                program_data["sections"][section_key]["missing_count"] += 1

        for intake in intakes:
            missing_programs = []
            complete_programs = []

            all_programs = set(s.program for s in intake.section_set.all())

            missing_program_dict = grouped_by_intake.get(intake.id, {})

            for program in all_programs:
                if program.id in missing_program_dict:
                    data = missing_program_dict[program.id]
                    sections = list(data["sections"].values())
                    missing_programs.append({
                        "program": program,
                        "total_missing": data["total_missing"],
                        "sections": sections,
                    })
                else:
                    complete_programs.append(program)

            intake.missing_programs = missing_programs
            intake.complete_programs = complete_programs

        context.update({
            "intakes": intakes,
            "selected_date": selected_date,
            "date_form": date_form,
        })
        return context