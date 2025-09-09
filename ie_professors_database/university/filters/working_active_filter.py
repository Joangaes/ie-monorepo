from django.contrib.admin import SimpleListFilter
from django.utils.translation import gettext_lazy as _


class WorkingActiveFilter(SimpleListFilter):
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
            return queryset.distinct()
        else:
            # Default to active when no value is set
            return queryset.filter(sections__intake__active=True).distinct()

    def choices(self, changelist):
        for lookup, title in self.lookup_choices:
            # Force 'active' as default when no value is set
            is_selected = self.value() == lookup if self.value() is not None else lookup == 'active'
            yield {
                'selected': is_selected,
                'query_string': changelist.get_query_string({
                    self.parameter_name: lookup,
                }, []),
                'display': title,
            }

    def value(self):
        # Override to ensure we have a default value
        value = super().value()
        if value is None:
            return 'active'  # Default to active
        return value 