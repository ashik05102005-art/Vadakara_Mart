from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPE_CHOICES = (
        ('ORDER_STATUS', 'Order Status Update'),
        ('EARNINGS', 'Earnings Alert'),
        ('ADMIN_ALERT', 'Admin Broadcast'),
        ('CHAT_MESSAGE', 'Chat Message Alert'),
        ('SYSTEM', 'System Alert'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='SYSTEM')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification to {self.user.email} - {self.title} (Read: {self.is_read})"
