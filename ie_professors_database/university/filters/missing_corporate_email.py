from unfold.contrib.filters.admin import DropdownFilter

class MissingCorporateEmailFilter(DropdownFilter):
    title = "Corporate Email"
    parameter_name = "corporate_email_missing"

    def lookups(self, request, model_admin):
        return [
            ("missing", "Missing corporate email"),
            ("present", "Has corporate email"),
        ]

    def queryset(self, request, queryset):
        if self.value() == "missing":
            return queryset.filter(corporate_email__isnull=True) | queryset.filter(corporate_email="")
        if self.value() == "present":
            return queryset.exclude(corporate_email__isnull=True).exclude(corporate_email="")
        return queryset
