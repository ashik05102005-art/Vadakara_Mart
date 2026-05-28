from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, F
from .models import Product, ProductCategory, ProductVariant
from .serializers import ProductSerializer, ProductCategorySerializer, ProductVariantSerializer
from apps.shops.utils import annotate_distance

class ProductCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ProductCategorySerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        queryset = ProductCategory.objects.all()
        shop_id = self.request.query_params.get('shop')
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        else:
            # Global categories
            queryset = queryset.filter(shop__isnull=True)
        return queryset

    def perform_create(self, serializer):
        # Allow shop owners to create categories for their shop
        serializer.save()


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'search']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Product.objects.filter(is_available=True, shop__is_verified=True, shop__is_active=True)
        
        shop_id = self.request.query_params.get('shop')
        category_id = self.request.query_params.get('category')
        
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        return queryset

    # Advanced Geolocation-Aware Unified Search Engine
    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        query = request.query_params.get('query', '')
        lat = request.query_params.get('latitude')
        lng = request.query_params.get('longitude')
        
        queryset = Product.objects.filter(is_available=True, shop__is_verified=True)
        
        if query:
            # Fuzzy-like simple query match across fields
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(tags__icontains=query) |
                Q(category__name__icontains=query) |
                Q(shop__name__icontains=query)
            )

        if lat and lng:
            # Annotate using custom Haversine helper, pointing lat/lng to shop's coordinates
            queryset = annotate_distance(
                queryset, 
                lat, 
                lng, 
                lat_field='shop__latitude', 
                lng_field='shop__longitude'
            )
            # Filter products whose shops are within their delivery radius
            queryset = queryset.filter(distance__lte=F('shop__delivery_radius_km'))
            # Sort: Proximity first, then by availability, then stock
            queryset = queryset.order_by('distance', '-stock_quantity')
        else:
            queryset = queryset.order_by('-created_at')

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
