from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Order, Coupon, OrderItem
from .serializers import OrderSerializer, CouponSerializer
from apps.notifications.models import Notification

class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'apply']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    @action(detail=False, methods=['get'], url_path='validate')
    def validate_coupon(self, request):
        code = request.query_params.get('code')
        subtotal = request.query_params.get('subtotal', 0.00)
        
        if not code:
            return Response({'valid': False, 'message': 'Coupon code is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            coupon = Coupon.objects.get(code__iexact=code, is_active=True)
            # Check validation dates
            now = timezone.now()
            if not (coupon.valid_from <= now <= coupon.valid_to):
                return Response({'valid': False, 'message': 'Coupon has expired.'})
                
            # Check min purchase order
            if float(subtotal) < float(coupon.min_order_value):
                return Response({'valid': False, 'message': f'Minimum order value of {coupon.min_order_value} required.'})
                
            return Response({
                'valid': True,
                'code': coupon.code,
                'discount_percent': float(coupon.discount_percent),
                'discount_amount': float(coupon.discount_amount)
            })
        except Coupon.DoesNotExist:
            return Response({'valid': False, 'message': 'Coupon code not found.'})


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Order.objects.all().order_by('-created_at')
        elif user.role == 'SHOP_OWNER':
            return Order.objects.filter(shop__owner=user).order_by('-created_at')
        elif user.role == 'DELIVERY_PARTNER':
            # Returns orders where they are assigned for delivery
            return Order.objects.filter(delivery_assignments__partner=user).order_by('-created_at')
        else: # CUSTOMER
            return Order.objects.filter(customer=user).order_by('-created_at')

    def perform_create(self, serializer):
        order = serializer.save(customer=self.request.user)
        
        # 1. Save in-app notification record in DB
        Notification.objects.create(
            user=order.shop.owner,
            title="New Order Received!",
            message=f"Order #{order.id} for {order.total_amount} has been placed.",
            notification_type='ORDER_STATUS'
        )

        # 2. Trigger real-time WebSocket alert to the shop owner
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{order.shop.owner.id}",
                {
                    'type': 'send_notification',
                    'title': 'New Incoming Order!',
                    'message': f'Order #{order.id} from {order.customer.email} is pending your approval.',
                    'notification_type': 'ORDER_STATUS'
                }
            )

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        user = request.user
        
        # Authorization checks
        if user.role == 'SHOP_OWNER' and order.shop.owner != user:
            return Response({'detail': 'Not authorized to update this order.'}, status=status.HTTP_403_FORBIDDEN)
        if user.role == 'DELIVERY_PARTNER' and not order.delivery_assignments.filter(partner=user).exists():
            return Response({'detail': 'Not authorized to update this delivery.'}, status=status.HTTP_403_FORBIDDEN)
            
        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'detail': 'Invalid order status value.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Update status
        order.status = new_status
        
        # Simple Payment state trigger: Auto-pay if delivered and COD, or auto-complete Stripe
        if new_status == 'DELIVERED':
            order.payment_status = 'PAID'
            
        order.save()
        
        # 1. Create DB notification log for customer
        Notification.objects.create(
            user=order.customer,
            title=f"Order Status: {new_status.title().replace('_', ' ')}",
            message=f"Your order #{order.id} from {order.shop.name} is now {new_status.lower().replace('_', ' ')}.",
            notification_type='ORDER_STATUS'
        )
        
        # 2. WebSocket Real-time update to Customer & Order group
        channel_layer = get_channel_layer()
        if channel_layer:
            # Broadcast to specific customer channel
            async_to_sync(channel_layer.group_send)(
                f"user_{order.customer.id}",
                {
                    'type': 'order_update',
                    'order_id': order.id,
                    'status': new_status,
                    'message': f"Order is now {new_status}!"
                }
            )
            # Broadcast to open Order detail tracking stream
            async_to_sync(channel_layer.group_send)(
                f"order_{order.id}",
                {
                    'type': 'order_update',
                    'order_id': order.id,
                    'status': new_status,
                    'message': f"Order status changed to {new_status}"
                }
            )

        return Response(OrderSerializer(order).data)
