from django.db import models
from django.conf import settings

class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    min_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()

    def __str__(self):
        return f"{self.code} - {self.discount_percent}% off"


class Order(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('PREPARING', 'Preparing'),
        ('OUT_FOR_DELIVERY', 'Out for Delivery'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    )
    
    PAYMENT_METHODS = (
        ('COD', 'Cash on Delivery'),
        ('STRIPE', 'Stripe Card'),
        ('RAZORPAY', 'Razorpay UPI'),
    )
    
    PAYMENT_STATUS = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='customer_orders'
    )
    shop = models.ForeignKey(
        'shops.Shop', 
        on_delete=models.CASCADE, 
        related_name='shop_orders'
    )
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Financial details
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True)
    discount_applied = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Delivery address & Geolocation coordinates (crucial for hyper-local route map rendering)
    delivery_address = models.TextField()
    delivery_latitude = models.DecimalField(max_digits=9, decimal_places=6)
    delivery_longitude = models.DecimalField(max_digits=9, decimal_places=6)
    
    # Payments details
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='COD')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')
    payment_transaction_id = models.CharField(max_length=100, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.customer.email} -> {self.shop.name} ({self.status})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    variant = models.ForeignKey(
        'products.ProductVariant', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    quantity = models.IntegerField(default=1)
    price_at_order = models.DecimalField(max_digits=10, decimal_places=2) # Lock price

    def __str__(self):
        variant_suffix = f" ({self.variant.name})" if self.variant else ""
        return f"{self.quantity} x {self.product.name}{variant_suffix} (Order #{self.order.id})"
