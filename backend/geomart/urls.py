"""
URL configuration for geomart project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('apps.accounts.urls_auth')),
    path('api/users/', include('apps.accounts.urls_users')),
    path('api/shops/', include('apps.shops.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/delivery/', include('apps.delivery.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
]

# Support media file uploads and static file serving in local development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
