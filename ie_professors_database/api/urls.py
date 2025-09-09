from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProfessorViewSet, CourseViewSet, SectionViewSet, ProgramViewSet,
    AreaViewSet, UniversityViewSet, DegreeViewSet, IntakeViewSet,
    CourseDeliveryViewSet, ProfessorDegreeViewSet, ProfessorCoursePossibilityViewSet,
    JoinedAcademicYearViewSet, CourseDeliverySectionViewSet,
    CurrentIntakeAPIView, ProgramDeliveryOverviewAPIView, DeliveryOverviewAPIView
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()

# Core university entities
router.register(r"universities", UniversityViewSet)
router.register(r"degrees", DegreeViewSet)
router.register(r"areas", AreaViewSet)
router.register(r"programs", ProgramViewSet)
router.register(r"intakes", IntakeViewSet)
router.register(r"joined-academic-years", JoinedAcademicYearViewSet)
router.register(r"sections", SectionViewSet)
router.register(r"courses", CourseViewSet)
router.register(r"professors", ProfessorViewSet)

# Relationship entities
router.register(r"professor-degrees", ProfessorDegreeViewSet)
router.register(r"professor-course-possibilities", ProfessorCoursePossibilityViewSet)
router.register(r"course-deliveries", CourseDeliveryViewSet)
router.register(r"course-delivery-sections", CourseDeliverySectionViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("current-intakes/", CurrentIntakeAPIView.as_view(), name="current-intakes"),
    path("program-delivery/<int:program_id>/<int:intake_id>/", ProgramDeliveryOverviewAPIView.as_view(), name="program-delivery-overview"),
    path("delivery-overview/", DeliveryOverviewAPIView.as_view(), name="delivery-overview"),
]
