from django import forms
from unfold.widgets import UnfoldAdminDateWidget
from django.utils.translation import gettext_lazy as _


class IntakeDateFilterForm(forms.Form):
    date = forms.DateField(
        required=False,
        widget=UnfoldAdminDateWidget,
        label=_("Active Date"),
        help_text=_("Select a date to filter active intakes.")
    )

    class Media:
        js = [
            "admin/js/vendor/jquery/jquery.js",
            "admin/js/jquery.init.js",
            "admin/js/calendar.js",
            "admin/js/admin/DateTimeShortcuts.js",
            "admin/js/core.js",
        ]