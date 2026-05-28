from rest_framework import serializers
from .models import Order, OrderItem, Coupon
from apps.products.models import Product, ProductVariant
from apps.shops.serializers import ShopSerializer

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    variant_name = serializers.CharField(source='variant.name', read_only=True, default='')

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'product_image', 'variant', 'variant_name', 'quantity', 'price_at_order')
        read_only_fields = ('id', 'price_at_order')

    def get_product_image(self, obj):
        if obj.product.image:
            return obj.product.image.url
        return None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    shop_details = ShopSerializer(source='shop', read_only=True)
    coupon_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'customer', 'customer_email', 'shop', 'shop_details', 'status', 
            'subtotal', 'delivery_fee', 'coupon', 'coupon_code', 
            'discount_applied', 'total_amount', 'delivery_address', 
            'delivery_latitude', 'delivery_longitude', 'payment_method', 
            'payment_status', 'payment_transaction_id', 'items', 'created_at'
        )
        read_only_fields = (
            'id', 'customer', 'status', 'subtotal', 'delivery_fee', 
            'coupon', 'discount_applied', 'total_amount', 'payment_status', 
            'payment_transaction_id', 'created_at'
        )

    def validate_items(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError("Order must contain at least one item.")
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        coupon_code = validated_data.pop('coupon_code', None)
        
        # Resolve prices & calculate totals
        subtotal = 0.00
        order_items_to_create = []
        
        for item_data in items_data:
            product = item_data['product']
            variant = item_data.get('variant')
            quantity = item_data['quantity']
            
            # Check availability & inventory stock
            if not product.is_available or product.stock_quantity < quantity:
                raise serializers.ValidationError(f"Product '{product.name}' is out of stock or unavailable.")
            
            # Calculate item pricing
            price = float(product.current_price)
            if variant:
                if variant.product != product:
                    raise serializers.ValidationError("Variant does not belong to this product.")
                if not variant.is_available or variant.stock_quantity < quantity:
                    raise serializers.ValidationError(f"Variant '{variant.name}' is out of stock.")
                if variant.price_override is not None:
                    price = float(variant.price_override)
            
            subtotal += price * quantity
            order_items_to_create.append((product, variant, quantity, price))

        # Check and apply Coupon if provided
        discount = 0.00
        coupon = None
        if coupon_code:
            try:
                coupon_obj = Coupon.objects.get(code__iexact=coupon_code, is_active=True)
                # Check order minimum
                if subtotal >= float(coupon_obj.min_order_value):
                    coupon = coupon_obj
                    if coupon_obj.discount_percent > 0:
                        discount = subtotal * (float(coupon_obj.discount_percent) / 100.0)
                    elif coupon_obj.discount_amount > 0:
                        discount = float(coupon_obj.discount_amount)
                    
                    # Cap discount to subtotal
                    discount = min(discount, subtotal)
            except Coupon.DoesNotExist:
                pass # Silent ignore or raise validation error; let's ignore to allow clean checkout fallback

        # Calculate Delivery Fee (flat 15.00 for simulation, or free if order subtotal > 100.00)
        delivery_fee = 0.00 if subtotal >= 100.00 else 15.00
        total_amount = subtotal - discount + delivery_fee
        
        # Save primary order
        order = Order.objects.create(
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            coupon=coupon,
            discount_applied=discount,
            total_amount=total_amount,
            **validated_data
        )

        # Save order items & decrement stock
        for product, variant, quantity, price in order_items_to_create:
            OrderItem.objects.create(
                order=order,
                product=product,
                variant=variant,
                quantity=quantity,
                price_at_order=price
            )
            
            # Update stock quantities
            if variant:
                variant.stock_quantity -= quantity
                if variant.stock_quantity <= 0:
                    variant.is_available = False
                variant.save()
            else:
                product.stock_quantity -= quantity
                if product.stock_quantity <= 0:
                    product.is_available = False
                product.save()

        return order
