from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from .models import Address
from apps.delivery.models import DeliveryPartnerProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone', 'is_verified', 'avatar', 'created_at')
        read_only_fields = ('id', 'is_verified', 'created_at')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    username = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'phone')
        
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        # Hash password and save
        validated_data['password'] = make_password(validated_data['password'])
        # Email acts as unique identifier
        username = validated_data.get('username') or validated_data.get('email').split('@')[0]
        validated_data['username'] = username
        
        user = super().create(validated_data)
        
        # If registering as a delivery partner, automatically instantiate delivery profile
        if user.role == 'DELIVERY_PARTNER':
            DeliveryPartnerProfile.objects.create(partner=user)
            
        return user


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        read_only_fields = ('user', 'id', 'created_at')
