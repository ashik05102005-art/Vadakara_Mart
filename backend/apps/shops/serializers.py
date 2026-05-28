from rest_framework import serializers
from django.utils import timezone
from .models import Shop, ShopCategory
from apps.accounts.serializers import UserSerializer

class ShopCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopCategory
        fields = '__all__'


class ShopSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    distance = serializers.DecimalField(max_digits=9, decimal_places=2, read_only=True, required=False)
    is_open = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = (
            'id', 'owner', 'name', 'description', 'banner', 'logo', 
            'category', 'category_name', 'latitude', 'longitude', 
            'delivery_radius_km', 'is_active', 'is_verified', 
            'opening_time', 'closing_time', 'phone', 'address_text', 
            'distance', 'is_open', 'created_at'
        )
        read_only_fields = ('id', 'owner', 'is_verified', 'created_at', 'distance')

    def get_is_open(self, obj):
        # Calculate if shop is currently open based on operational hours and manual override
        if not obj.is_active:
            return False
        
        current_time = timezone.localtime(timezone.now()).time()
        # Handle shops with overnight timings or simple timezone ranges
        if obj.opening_time <= obj.closing_time:
            return obj.opening_time <= current_time <= obj.closing_time
        else: # Overnight shop (e.g. 18:00 to 02:00)
            return current_time >= obj.opening_time or current_time <= obj.closing_time
