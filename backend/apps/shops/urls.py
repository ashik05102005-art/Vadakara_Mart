from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShopViewSet, ShopCategoryViewSet

router = DefaultRouter()
router.register(r'categories', ShopCategoryViewSet, basename='shop-category')
router.register(r'', ShopViewSet, basename='shop')

urlpatterns = [
    path('', include(router.urls)),
]
