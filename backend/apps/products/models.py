from django.db import models
from django.conf import settings

class ProductCategory(models.Model):
    shop = models.ForeignKey(
        'shops.Shop', 
        on_delete=models.CASCADE, 
        related_name='product_categories',
        null=True, 
        blank=True
    ) # Null means global/system-wide category, otherwise shop-specific category
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Product Categories'
        unique_together = ('shop', 'slug')

    def __str__(self):
        if self.shop:
            return f"{self.name} ({self.shop.name})"
        return f"{self.name} (Global)"


class Product(models.Model):
    shop = models.ForeignKey(
        'shops.Shop', 
        on_delete=models.CASCADE, 
        related_name='products'
    )
    category = models.ForeignKey(
        ProductCategory, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='products'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='product_images/', blank=True, null=True)
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    offer_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True) # Discounted price
    
    # Inventory
    stock_quantity = models.IntegerField(default=10)
    is_available = models.BooleanField(default=True)
    
    # Tags (JSON list or space-separated string, let's use CharField for simplicity and search relevance)
    tags = models.CharField(max_length=255, blank=True, null=True, help_text="Comma-separated keywords for search indexing")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.shop.name}"

    @property
    def current_price(self):
        if self.offer_price is not None:
            return self.offer_price
        return self.price


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='variants'
    )
    name = models.CharField(max_length=100) # e.g. "Size: Large", "Spicy Level: Medium"
    price_override = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True) # If null, uses product price
    stock_quantity = models.IntegerField(default=10)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.product.name} ({self.name})"
