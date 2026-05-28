from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, CouponViewSet

router = DefaultRouter()
router.register(r'coupons', CouponViewSet, basename='coupon')
router.register(r'', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
]
