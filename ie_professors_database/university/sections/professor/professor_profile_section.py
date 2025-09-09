from django.utils.translation import gettext_lazy as _
from django.template.loader import render_to_string
from unfold.sections import BaseSection

class ProfessorProfileSection(BaseSection):
    verbose_name = _("Professor Profile")

    def render(self):
        professor = self.instance
        context = {
            "professor": professor,
            "degrees": professor.degrees.all(),
        }
        return render_to_string("university/sections/professor_profile.html", context, request=self.request) 