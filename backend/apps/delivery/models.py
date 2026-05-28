from django.db import models
from django.conf import settings

class DeliveryPartnerProfile(models.Model):
    VEHICLE_CHOICES = (
        ('BICYCLE', 'Bicycle'),
        ('MOTORBIKE', 'Motorbike'),
        ('CAR', 'Car'),
    )

    partner = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='delivery_profile'
    )
    is_available = models.BooleanField(default=False)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_CHOICES, default='MOTORBIKE')
    is_verified = models.BooleanField(default=False)
    
    # Real-time Location telemetry
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.partner.email} - Available: {self.is_available}"


class DeliveryAssignment(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Assignment'),
        ('ACCEPTED', 'Accepted'),
        ('PICKED_UP', 'Picked Up'),
        ('DELIVERED', 'Delivered'),
        ('REJECTED', 'Rejected'),
    )

    order = models.ForeignKey(
        'orders.Order', 
        on_delete=models.CASCADE, 
        related_name='delivery_assignments'
    )
    partner = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='deliveries'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    earnings = models.DecimalField(max_digits=10, decimal_places=2, default=15.00) # Base flat rate delivery fee
    
    assigned_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Assignment #{self.id} - Partner: {self.partner.email} for Order #{self.order.id} ({self.status})"
