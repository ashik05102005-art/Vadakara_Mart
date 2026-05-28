from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, UserProfileView, AddressViewSet

router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')

urlpatterns = [
    # Auth routing
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile & settings
    path('auth/profile/', UserProfileView.as_view(), name='user_profile'),
    
    # Nested ViewSets
    path('', include(router.urls)),
]
