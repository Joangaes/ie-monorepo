from collections import defaultdict, OrderedDict
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils.safestring import mark_safe
from django.views.generic import TemplateView

from unfold.views import UnfoldModelAdminViewMixin
from university.models import Program, CourseDelivery, Intake, Section

class ProgramDeliveryOverviewView(UnfoldModelAdminViewMixin, TemplateView):
    """
    Displays a structured overview of course deliveries for a given program and intake,
    grouped by Intake (start_date), then by year.
    """
    template_name = "admin/program_delivery/overview.html"
    permission_required = "university.view_currentintake"
    title = "Program Delivery Overview"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        program = get_object_or_404(Program, pk=self.kwargs["program_id"])

        # Aggregate all data and columns in one pass
        sections_by_intake_and_year, all_section_keys = self._get_aggregated_data(program)

        context["tables"] = self._build_tables_from_data(sections_by_intake_and_year, all_section_keys)
        context.update({
            "program": program,
            "title": f"{program.name} — Overview",
        })
        return context

    def _get_sections_grouped(self, program):
        """
        Returns:
        - sections_by_intake_and_year: dict of intake -> year -> {course_key: {details, professors dict}}
        - all_section_keys: ordered list of all campus-section keys across all intakes and years
        """
        sections = Section.objects.filter(
            program=program,
            intake__active=True
        ).select_related("intake")

        # We will collect all keys for columns globally
        all_section_keys_set = set()

        # Group sections by intake and year, and also collect courses info
        sections_by_intake_and_year = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: {
            "details": {},
            "professors": defaultdict(list)
        })))

        for section in sections:
            intake = section.intake
            year = section.course_year
            course = getattr(section, 'course', None)
            # Defensive in case course is not set on Section model; else get from delivery
            # If no course on section, we skip - could happen if data incomplete
            if course is None:
                continue

            course_key = course.code
            col_key = f"{section.get_campus_display()} {section.name}"
            all_section_keys_set.add(col_key)

            # Initialize course details if missing
            if not sections_by_intake_and_year[intake][year][course_key]["details"]:
                sections_by_intake_and_year[intake][year][course_key]["details"] = {
                    "name": course.name,
                    "type": course.course_type,
                    "credits": course.credits,
                }

            # Ensure column exists, even if no delivery
            sections_by_intake_and_year[intake][year][course_key]["professors"].setdefault(col_key, [])

        # Sort the section keys globally by campus and name, so columns order is stable
        all_section_keys = sorted(all_section_keys_set)

        return sections_by_intake_and_year, all_section_keys

    def _get_aggregated_data(self, program):
        """
        Build sections_by_intake_and_year structure from CourseDelivery data,
        including course details and professors grouped by intake and year.
        Also returns the set of all campus-section keys.
        """
        sections_prefetch = Prefetch(
            "sections",
            queryset=Section.objects.filter(program=program, intake__active=True).select_related("intake"),
            to_attr="filtered_sections"
        )

        deliveries = CourseDelivery.objects.filter(
            sections__program=program,
            sections__intake__active=True
        ).select_related("course", "professor").prefetch_related(sections_prefetch).distinct()

        all_section_keys_set = set()

        sections_by_intake_and_year = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: {
            "details": {},
            "professors": defaultdict(list)
        })))

        for delivery in deliveries:
            course = delivery.course
            course_key = course.code if course else "UNKNOWN"

            for section in delivery.filtered_sections:
                intake = section.intake
                year = section.course_year
                col_key = f"{section.get_campus_display()} {section.name}"
                all_section_keys_set.add(col_key)

                # Initialize course details if missing
                if not sections_by_intake_and_year[intake][year][course_key]["details"]:
                    sections_by_intake_and_year[intake][year][course_key]["details"] = {
                        "name": course.name if course else "Unknown Course",
                        "type": course.course_type if course else "",
                        "credits": course.credits if course else 0,
                    }

                if delivery.professor:
                    prof_display = f"{delivery.professor.name} {delivery.professor.last_name}"
                else:
                    prof_display = '<span class="text-red-600 font-semibold">🚨 Missing</span>'

                # Assign professor for this section column (replace existing list)
                sections_by_intake_and_year[intake][year][course_key]["professors"][col_key] = [prof_display]

        # Now, fill empty cells (sections without deliveries)
        # Also, get all sections across the program/intakes to add columns with no deliveries
        all_sections = Section.objects.filter(program=program, intake__active=True).select_related("intake")
        for section in all_sections:
            intake = section.intake
            year = section.course_year
            col_key = f"{section.get_campus_display()} {section.name}"
            all_section_keys_set.add(col_key)

            # For all known courses at this intake-year, ensure columns exist (even if empty)
            # but if no delivery for that course yet, we add the details as empty
            # Since we don't know course here, just skip course details init for now

            # To cover all courses at intake and year:
            # We must ensure professors dict for all course keys at that intake-year have col_key:
            # But we don't know all course keys here; so just ensure for existing ones
            if intake in sections_by_intake_and_year and year in sections_by_intake_and_year[intake]:
                for course_key in sections_by_intake_and_year[intake][year]:
                    professors_dict = sections_by_intake_and_year[intake][year][course_key]["professors"]
                    professors_dict.setdefault(col_key, [])

        all_section_keys = sorted(all_section_keys_set)

        return sections_by_intake_and_year, all_section_keys


    def _build_tables_from_data(self, aggregated_data, all_section_keys):
        """
        Build tables grouped first by year ascending, then by intake.start_date ascending.
        """
        base_headers = ["Code", "Course", "Type", "Credits"]
        tables = []

        # Gather all years across all intakes
        years_set = set()
        for intake in aggregated_data:
            years_set.update(aggregated_data[intake].keys())
        years_sorted = sorted(years_set)

        for year in years_sorted:
            # Gather intakes that have this year
            intakes_for_year = [intake for intake in aggregated_data if year in aggregated_data[intake]]

            # Sort intakes by start_date
            intakes_for_year_sorted = sorted(intakes_for_year, key=lambda i: i.start_time)

            for intake in intakes_for_year_sorted:
                courses = aggregated_data[intake][year]
                headers = base_headers + all_section_keys
                rows = []

                for code, data in sorted(courses.items()):
                    row = [
                        code,
                        data["details"]["name"],
                        data["details"]["type"],
                        data["details"]["credits"],
                    ]
                    for col_key in all_section_keys:
                        profs = data["professors"].get(col_key, [])
                        cell = mark_safe("<br>".join(profs)) if profs else "—"
                        row.append(cell)
                    rows.append(row)

                if rows:
                    tables.append({
                        "title": f"Year {year} — Intake {intake.name} ({intake.start_time.strftime('%Y-%m-%d')})",
                        "table_data": {"headers": headers, "rows": rows}
                    })

        return tables

