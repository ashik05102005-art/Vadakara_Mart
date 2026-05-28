from rest_framework import serializers
from .models import DeliveryPartnerProfile, DeliveryAssignment
from apps.accounts.serializers import UserSerializer
from apps.orders.serializers import OrderSerializer

class DeliveryPartnerProfileSerializer(serializers.ModelSerializer):
    partner_details = UserSerializer(source='partner', read_only=True)

    class Meta:
        model = DeliveryPartnerProfile
        fields = ('id', 'partner', 'partner_details', 'is_available', 'vehicle_type', 'is_verified', 'current_latitude', 'current_longitude', 'total_earnings')
        read_only_fields = ('id', 'partner', 'is_verified', 'total_earnings')


class DeliveryAssignmentSerializer(serializers.ModelSerializer):
    order_details = OrderSerializer(source='order', read_only=True)
    partner_details = UserSerializer(source='partner', read_only=True)

    class Meta:
        model = DeliveryAssignment
        fields = ('id', 'order', 'order_details', 'partner', 'partner_details', 'status', 'earnings', 'assigned_at', 'accepted_at', 'picked_up_at', 'delivered_at')
        read_only_fields = ('id', 'partner', 'earnings', 'assigned_at', 'accepted_at', 'picked_up_at', 'delivered_at')
