import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'geomart.settings')
django.setup() # Initialize Django models and setup

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import apps.notifications.routing

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            apps.notifications.routing.websocket_urlpatterns
        )
    ),
})
