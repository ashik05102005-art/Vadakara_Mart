from django.db import models
from django.conf import settings

class ShopCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, default='Store') # Lucide Icon name for React frontend
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Shop Categories'

    def __str__(self):
        return self.name


class Shop(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='owned_shops'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    banner = models.ImageField(upload_to='shop_banners/', blank=True, null=True)
    logo = models.ImageField(upload_to='shop_logos/', blank=True, null=True)
    category = models.ForeignKey(
        ShopCategory, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='shops'
    )
    
    # Geolocation fields
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    delivery_radius_km = models.DecimalField(max_digits=4, decimal_places=2, default=5.00) # coverage radius
    
    # Operational controls
    is_active = models.BooleanField(default=True) # Shop currently open
    is_verified = models.BooleanField(default=False) # Admin verification
    opening_time = models.TimeField(default='09:00:00')
    closing_time = models.TimeField(default='21:00:00')
    
    # Contact info
    phone = models.CharField(max_length=15, blank=True, null=True)
    address_text = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.address_text[:30]}"
