from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLES = (
        ('CUSTOMER', 'Customer'),
        ('SHOP_OWNER', 'Shop Owner'),
        ('DELIVERY_PARTNER', 'Delivery Partner'),
        ('ADMIN', 'Admin'),
    )
    
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLES, default='CUSTOMER')
    phone = models.CharField(max_length=15, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Use email for authentication instead of username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.role})"


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    title = models.CharField(max_length=100, default='Home') # e.g. Home, Work, Other
    address_line = models.TextField()
    landmark = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=10)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.is_default:
            # Set all other user addresses to not default
            Address.objects.filter(user=self.user).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.user.email}"
