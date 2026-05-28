from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F, Sum, Avg, Count
from .models import Shop, ShopCategory
from .serializers import ShopSerializer, ShopCategorySerializer
from .utils import annotate_distance
from apps.orders.models import Order

class ShopCategoryViewSet(viewsets.ModelViewSet):
    queryset = ShopCategory.objects.filter(is_active=True)
    serializer_class = ShopCategorySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class ShopViewSet(viewsets.ModelViewSet):
    serializer_class = ShopSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Shop.objects.filter(is_verified=True, is_active=True)
        
        # Hyperlocal Geolocation filter
        lat = self.request.query_params.get('latitude')
        lng = self.request.query_params.get('longitude')
        radius = self.request.query_params.get('radius') # Custom radius in KM
        category_slug = self.request.query_params.get('category')
        
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        if lat and lng:
            queryset = annotate_distance(queryset, lat, lng)
            if radius:
                try:
                    queryset = queryset.filter(distance__lte=float(radius))
                except ValueError:
                    pass
            else:
                # Default: Filter shops within their own delivery radius
                queryset = queryset.filter(distance__lte=F('delivery_radius_km'))
            
            # Sort by proximity
            queryset = queryset.order_by('distance')
            
        return queryset

    # Shop Owner specific dashboard operations
    @action(detail=False, methods=['get', 'put', 'post'], url_path='my-shop')
    def my_shop(self, request):
        # A shop owner should have a singular shop (or primary shop)
        shop = Shop.objects.filter(owner=request.user).first()
        
        if request.method == 'GET':
            if not shop:
                return Response({'detail': 'No shop found for this user.'}, status=status.HTTP_404_NOT_FOUND)
            serializer = self.get_serializer(shop)
            return Response(serializer.data)
            
        elif request.method == 'POST':
            if shop:
                return Response({'detail': 'Shop already exists for this user.'}, status=status.HTTP_400_BAD_REQUEST)
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        elif request.method == 'PUT':
            if not shop:
                return Response({'detail': 'No shop found to update.'}, status=status.HTTP_404_NOT_FOUND)
            serializer = self.get_serializer(shop, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    # Earnings & Dashboard Analytics for Shop Owners
    @action(detail=True, methods=['get'], url_path='analytics')
    def analytics(self, request, pk=None):
        shop = self.get_object()
        if shop.owner != request.user and not request.user.is_staff:
            return Response({'detail': 'Permission Denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        completed_orders = Order.objects.filter(shop=shop, status='DELIVERED')
        
        total_revenue = completed_orders.aggregate(revenue=Sum('total_amount'))['revenue'] or 0.00
        orders_count = completed_orders.count()
        avg_order_value = completed_orders.aggregate(avg=Avg('total_amount'))['avg'] or 0.00
        
        # Calculate recent monthly metrics or dynamic summary
        recent_orders = Order.objects.filter(shop=shop).order_by('-created_at')[:10]
        
        return Response({
            'total_revenue': float(total_revenue),
            'orders_count': orders_count,
            'avg_order_value': float(avg_order_value),
            'recent_orders_count': recent_orders.count()
        })
