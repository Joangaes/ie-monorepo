from unfold.contrib.filters.admin import DropdownFilter
from django.utils.translation import gettext_lazy as _
from university.models import Course, Program, Professor


class ActiveIntakeFilterWithDefault(DropdownFilter):
    title = _("Term Status")
    parameter_name = "active_status"

    def lookups(self, request, model_admin):
        return (
            ('active', _('Active')),
            ('inactive', _('Inactive')),
            ('all', _('All')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'active':
            return queryset.filter(sections__intake__active=True).distinct()
        elif self.value() == 'inactive':
            return queryset.filter(sections__intake__active=False).distinct()
        elif self.value() == 'all':
            return queryset.distinct()  # Show all records (both active and inactive)
        else:
            # Default to active when no value is set
            return queryset.filter(sections__intake__active=True).distinct()

    def choices(self, changelist):
        for lookup, title in self.lookup_choices:
            yield {
                'selected': self.value() == lookup if self.value() is not None else lookup == 'active',
                'query_string': changelist.get_query_string({
                    self.parameter_name: lookup,
                }, []),
                'display': title,
            } 