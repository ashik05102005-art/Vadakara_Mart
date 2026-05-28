from rest_framework import serializers
from .models import Product, ProductCategory, ProductVariant

class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = '__all__'


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = '__all__'
        read_only_fields = ('product',)


class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, required=False)
    category_name = serializers.CharField(source='category.name', read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'shop', 'shop_name', 'category', 'category_name', 
            'name', 'description', 'image', 'price', 'offer_price', 
            'current_price', 'stock_quantity', 'is_available', 
            'tags', 'variants', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'current_price')

    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        product = Product.objects.create(**validated_data)
        for variant_data in variants_data:
            ProductVariant.objects.create(product=product, **variant_data)
        return product

    def update(self, instance, validated_data):
        variants_data = validated_data.pop('variants', None)
        
        # Standard update
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update variants if provided
        if variants_data is not None:
            # Simple approach: clear old variants and write new ones
            instance.variants.all().delete()
            for variant_data in variants_data:
                ProductVariant.objects.create(product=instance, **variant_data)
                
        return instance
