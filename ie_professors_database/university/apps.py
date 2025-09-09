from django.apps import AppConfig


class UniversityConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'university'

    def ready(self):
        import university.translation  # noqa
        
        from simple_history import register
        from university.models import Course,Area

        register(
            Course,
            inherit=True,
            excluded_fields=[] 
        )
        register(
            Area,
            inherit=True,
            excluded_fields=[] 
        )