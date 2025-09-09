"""
URL configuration for ie_professor_management project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from django.views.generic import RedirectView
from django.http import JsonResponse
from general.password_reset.views import (
    CustomPasswordResetView,
    CustomPasswordResetDoneView,
    CustomPasswordResetConfirmView,
    CustomPasswordResetCompleteView,
)

def health(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path('i18n/', include('django.conf.urls.i18n')), 
    path('', RedirectView.as_view(url='/admin/university/coursedelivery/?active_status=active', permanent=False)),  # 👈 Add this line
    path("api/", include("api.urls")),
    path("health/", health, name="health"),
]

urlpatterns += i18n_patterns(
    path('admin/', admin.site.urls),
    path('password_reset/', CustomPasswordResetView.as_view(), name='admin_password_reset'),
    path('password_reset/done/', CustomPasswordResetDoneView.as_view(), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', CustomPasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('reset/done/', CustomPasswordResetCompleteView.as_view(), name='password_reset_complete'),
    prefix_default_language=False,
)
