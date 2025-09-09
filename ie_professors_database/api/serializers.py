
from rest_framework import serializers
from university.models import (
    Professor, Course, Section, Program, Area, University, Degree, 
    Intake, CourseDelivery, ProfessorDegree, ProfessorCoursePossibility,
    JoinedAcademicYear, CourseDeliverySection
)

class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = '__all__'

class DegreeSerializer(serializers.ModelSerializer):
    # Read-only fields for detailed display
    university = UniversitySerializer(read_only=True)
    degree_type_display = serializers.SerializerMethodField()
    
    # Write-only fields for creating/updating
    university_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Degree
        fields = '__all__'
    
    def get_degree_type_display(self, obj):
        return obj.get_degree_type_display()
    
    def create(self, validated_data):
        university_id = validated_data.pop('university_id', None)
        
        return Degree.objects.create(
            university_id=university_id,
            **validated_data
        )
    
    def update(self, instance, validated_data):
        university_id = validated_data.pop('university_id', None)
        
        if university_id is not None:
            instance.university_id = university_id
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = '__all__'

class ProgramSerializer(serializers.ModelSerializer):
    school_display = serializers.SerializerMethodField()
    type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Program
        fields = '__all__'
    
    def get_school_display(self, obj):
        return obj.get_school_display()
    
    def get_type_display(self, obj):
        return obj.get_type_display()

class IntakeSerializer(serializers.ModelSerializer):
    semester_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Intake
        fields = '__all__'
    
    def get_semester_display(self, obj):
        return obj.get_semester_display()

class JoinedAcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = JoinedAcademicYear
        fields = '__all__'

class SectionSerializer(serializers.ModelSerializer):
    # Read-only fields for detailed display
    intake = IntakeSerializer(read_only=True)
    program = ProgramSerializer(read_only=True)
    joined_academic_year = JoinedAcademicYearSerializer(read_only=True)
    campus_display = serializers.SerializerMethodField()
    
    # Write-only fields for creating/updating
    intake_id = serializers.IntegerField(write_only=True, required=False)
    program_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    joined_academic_year_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Section
        fields = '__all__'
    
    def get_campus_display(self, obj):
        return obj.get_campus_display()
    
    def create(self, validated_data):
        intake_id = validated_data.pop('intake_id', None)
        program_id = validated_data.pop('program_id', None)
        joined_academic_year_id = validated_data.pop('joined_academic_year_id', None)
        
        return Section.objects.create(
            intake_id=intake_id,
            program_id=program_id,
            joined_academic_year_id=joined_academic_year_id,
            **validated_data
        )
    
    def update(self, instance, validated_data):
        intake_id = validated_data.pop('intake_id', None)
        program_id = validated_data.pop('program_id', None)
        joined_academic_year_id = validated_data.pop('joined_academic_year_id', None)
        
        if intake_id is not None:
            instance.intake_id = intake_id
        if program_id is not None:
            instance.program_id = program_id
        if joined_academic_year_id is not None:
            instance.joined_academic_year_id = joined_academic_year_id
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class CourseSerializer(serializers.ModelSerializer):
    # Read-only fields for detailed display
    programs = ProgramSerializer(many=True, read_only=True)
    area = AreaSerializer(read_only=True)
    course_type_display = serializers.SerializerMethodField()
    
    # Write-only fields for creating/updating
    area_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    programs_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = Course
        fields = '__all__'

    def get_course_type_display(self, obj):
        return obj.get_course_type_display()
    
    def create(self, validated_data):
        area_id = validated_data.pop('area_id', None)
        programs_ids = validated_data.pop('programs_ids', [])
        
        course = Course.objects.create(
            area_id=area_id,
            **validated_data
        )
        
        if programs_ids:
            course.programs.set(programs_ids)
        
        return course
    
    def update(self, instance, validated_data):
        area_id = validated_data.pop('area_id', None)
        programs_ids = validated_data.pop('programs_ids', None)
        
        if area_id is not None:
            instance.area_id = area_id
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        if programs_ids is not None:
            instance.programs.set(programs_ids)
        
        return instance

class ProfessorSerializer(serializers.ModelSerializer):
    professor_type_display = serializers.SerializerMethodField()
    gender_display = serializers.SerializerMethodField()
    campuses_display = serializers.SerializerMethodField()
    availabilities_display = serializers.SerializerMethodField()
    degrees = DegreeSerializer(many=True, read_only=True)
    courses = CourseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Professor
        fields = [
            'id', 'name', 'last_name', 'email', 'corporate_email', 'phone_number',
            'campuses', 'campuses_display', 'availabilities', 'availabilities_display',
            'professor_type', 'professor_type_display', 'minimum_number_of_sessions',
            'birth_year', 'gender', 'gender_display', 'joined_year', 'linkedin_profile',
            'accredited', 'degrees', 'courses', 'created_at', 'updated_at'
        ]

    def get_professor_type_display(self, obj):
        return obj.get_professor_type_display()
    
    def get_gender_display(self, obj):
        return obj.get_gender_display()
    
    def get_campuses_display(self, obj):
        return [dict(obj._meta.get_field('campuses').base_field.choices).get(campus, campus) for campus in obj.campuses]
    
    def get_availabilities_display(self, obj):
        return [dict(obj._meta.get_field('availabilities').base_field.choices).get(availability, availability) for availability in obj.availabilities]

class ProfessorDegreeSerializer(serializers.ModelSerializer):
    # Read-only fields for detailed display
    professor = ProfessorSerializer(read_only=True)
    degree = DegreeSerializer(read_only=True)
    
    # Write-only fields for creating/updating
    professor_id = serializers.IntegerField(write_only=True, required=False)
    degree_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = ProfessorDegree
        fields = '__all__'
    
    def create(self, validated_data):
        professor_id = validated_data.pop('professor_id', None)
        degree_id = validated_data.pop('degree_id', None)
        
        return ProfessorDegree.objects.create(
            professor_id=professor_id,
            degree_id=degree_id,
            **validated_data
        )
    
    def update(self, instance, validated_data):
        professor_id = validated_data.pop('professor_id', None)
        degree_id = validated_data.pop('degree_id', None)
        
        if professor_id is not None:
            instance.professor_id = professor_id
        if degree_id is not None:
            instance.degree_id = degree_id
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class ProfessorCoursePossibilitySerializer(serializers.ModelSerializer):
    # Read-only fields for detailed display
    professor = ProfessorSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    
    # Write-only fields for creating/updating
    professor_id = serializers.IntegerField(write_only=True, required=False)
    course_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = ProfessorCoursePossibility
        fields = '__all__'
    
    def create(self, validated_data):
        professor_id = validated_data.pop('professor_id', None)
        course_id = validated_data.pop('course_id', None)
        
        return ProfessorCoursePossibility.objects.create(
            professor_id=professor_id,
            course_id=course_id,
            **validated_data
        )
    
    def update(self, instance, validated_data):
        professor_id = validated_data.pop('professor_id', None)
        course_id = validated_data.pop('course_id', None)
        
        if professor_id is not None:
            instance.professor_id = professor_id
        if course_id is not None:
            instance.course_id = course_id
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class CourseDeliverySerializer(serializers.ModelSerializer):
    # Read-only fields for detailed display
    course = CourseSerializer(read_only=True)
    professor = ProfessorSerializer(read_only=True)
    sections = SectionSerializer(many=True, read_only=True)
    
    # Write-only fields for creating/updating
    course_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    professor_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    sections_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = CourseDelivery
        fields = '__all__'
    
    def create(self, validated_data):
        # Extract write-only fields
        course_id = validated_data.pop('course_id', None)
        professor_id = validated_data.pop('professor_id', None)
        sections_ids = validated_data.pop('sections_ids', [])
        
        # Create the course delivery instance
        course_delivery = CourseDelivery.objects.create(
            course_id=course_id,
            professor_id=professor_id,
            **validated_data
        )
        
        # Set sections if provided
        if sections_ids:
            course_delivery.sections.set(sections_ids)
        
        return course_delivery
    
    def update(self, instance, validated_data):
        # Extract write-only fields
        course_id = validated_data.pop('course_id', None)
        professor_id = validated_data.pop('professor_id', None)
        sections_ids = validated_data.pop('sections_ids', None)
        
        # Update the instance
        if course_id is not None:
            instance.course_id = course_id
        if professor_id is not None:
            instance.professor_id = professor_id
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Update sections if provided
        if sections_ids is not None:
            instance.sections.set(sections_ids)
        
        return instance

# Simplified serializers for nested relationships (to avoid circular references)
class ProfessorSimpleSerializer(serializers.ModelSerializer):
    professor_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Professor
        fields = ['id', 'name', 'last_name', 'email', 'corporate_email', 'professor_type', 'professor_type_display']
    
    def get_professor_type_display(self, obj):
        return obj.get_professor_type_display()

class CourseSimpleSerializer(serializers.ModelSerializer):
    course_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'code', 'name', 'course_type', 'course_type_display', 'credits', 'sessions']
    
    def get_course_type_display(self, obj):
        return obj.get_course_type_display()

class CourseDeliverySectionSerializer(serializers.ModelSerializer):
    course_delivery = CourseDeliverySerializer(read_only=True)
    section = SectionSerializer(read_only=True)
    
    class Meta:
        model = CourseDeliverySection
        fields = '__all__'