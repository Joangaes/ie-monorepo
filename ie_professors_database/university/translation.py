from modeltranslation.translator import translator, TranslationOptions
from university.models import Area, Course
from simple_history import register

class AreaTranslationOptions(TranslationOptions):  
    fields = ('name',)

class CourseTranslationOptions(TranslationOptions):  
    fields = ('name',)

translator.register(Area, AreaTranslationOptions)
translator.register(Course, CourseTranslationOptions)