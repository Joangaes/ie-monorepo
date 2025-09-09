from unfold.contrib.filters.admin import (
    DropdownFilter,
)

class ProfessorIsNullFilter(DropdownFilter):
    title = "Missing Professor"
    parameter_name = "missing_professor"

    def lookups(self, request, model_admin):
        return (
            ('true', 'Missing'),
            ('false', 'Assigned'),
        )

    def queryset(self, request, queryset):
        value = self.value()
        if value == 'true':
            return queryset.filter(professor__isnull=True)
        if value == 'false':
            return queryset.filter(professor__isnull=False)
        return queryset