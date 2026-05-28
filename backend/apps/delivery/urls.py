from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryAssignmentViewSet

router = DefaultRouter()
router.register(r'', DeliveryAssignmentViewSet, basename='delivery')

urlpatterns = [
    path('', include(router.urls)),
]
