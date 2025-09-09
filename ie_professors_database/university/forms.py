from django import forms
from .models import Professor

class ProfessorForm(forms.ModelForm):
    class Meta:
        model = Professor
        fields = [
            'name', 'email', 'corporate_email', 'phone_number', 'birth_year', 'sex',
            'campus', 'availability', 'professor_type', 'minimum_number_of_sessions', 'joined_year',
            'degrees'
        ] 