from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import F
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import DeliveryAssignment, DeliveryPartnerProfile
from .serializers import DeliveryAssignmentSerializer, DeliveryPartnerProfileSerializer
from apps.orders.models import Order
from apps.notifications.models import Notification
from apps.shops.utils import annotate_distance

class DeliveryAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = DeliveryAssignmentSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return DeliveryAssignment.objects.all()
        return DeliveryAssignment.objects.filter(partner=user)

    # Fetch profile of the logged-in delivery partner
    @action(detail=False, methods=['get', 'put'], url_path='profile')
    def my_profile(self, request):
        profile, created = DeliveryPartnerProfile.objects.get_or_create(partner=request.user)
        
        if request.method == 'GET':
            serializer = DeliveryPartnerProfileSerializer(profile)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = DeliveryPartnerProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    # 1. Available deliveries nearby (Orders with status 'ACCEPTED' that have no active assignment)
    @action(detail=False, methods=['get'], url_path='available')
    def available_deliveries(self, request):
        lat = request.query_params.get('latitude')
        lng = request.query_params.get('longitude')
        
        # Select active orders that have been accepted by shop but are not yet assigned/picked up
        orders = Order.objects.filter(status='ACCEPTED').exclude(
            delivery_assignments__status__in=['ACCEPTED', 'PICKED_UP', 'DELIVERED']
        )
        
        # Sort by distance if delivery partner coordinates are provided
        if lat and lng:
            orders = annotate_distance(
                orders, 
                lat, 
                lng, 
                lat_field='shop__latitude', 
                lng_field='shop__longitude'
            )
            orders = orders.order_by('distance')
            
        # Serialize list of orders available for delivery pickup
        from apps.orders.serializers import OrderSerializer
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    # 2. Accept order for delivery
    @action(detail=True, methods=['post'], url_path='accept')
    def accept_delivery(self, request, pk=None):
        # pk is the Order ID to accept
        try:
            order = Order.objects.get(id=pk, status='ACCEPTED')
        except Order.DoesNotExist:
            return Response({'detail': 'Order is not available for delivery assignment.'}, status=status.HTTP_404_NOT_FOUND)
            
        # Check if already assigned
        if DeliveryAssignment.objects.filter(order=order, status__in=['ACCEPTED', 'PICKED_UP']).exists():
            return Response({'detail': 'This order has already been claimed by another delivery partner.'}, status=status.HTTP_400_BAD_REQUEST)
            
        profile, _ = DeliveryPartnerProfile.objects.get_or_create(partner=request.user)
        if not profile.is_verified:
            return Response({'detail': 'Your delivery partner account is pending admin verification.'}, status=status.HTTP_403_FORBIDDEN)
            
        # Create assignment
        assignment = DeliveryAssignment.objects.create(
            order=order,
            partner=request.user,
            status='ACCEPTED',
            accepted_at=timezone.now()
        )
        
        # Transition Order status to PREPARING (or dispatch prep)
        order.status = 'PREPARING'
        order.save()
        
        # Notify customer
        Notification.objects.create(
            user=order.customer,
            title="Delivery Agent Assigned",
            message=f"Delivery Partner {request.user.username} has accepted your order and is heading to the shop.",
            notification_type='ORDER_STATUS'
        )
        
        # WS update
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{order.customer.id}",
                {
                    'type': 'order_update',
                    'order_id': order.id,
                    'status': 'PREPARING',
                    'message': f"Delivery partner has accepted your order!"
                }
            )
            
        return Response(DeliveryAssignmentSerializer(assignment).data)

    # 3. Transition Delivery/Order Statuses
    @action(detail=True, methods=['post'], url_path='update-delivery-status')
    def update_delivery_status(self, request, pk=None):
        # pk is the Assignment ID
        assignment = self.get_object()
        new_status = request.data.get('status') # PICKED_UP or DELIVERED
        
        if assignment.partner != request.user:
            return Response({'detail': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
            
        if new_status == 'PICKED_UP':
            assignment.status = 'PICKED_UP'
            assignment.picked_up_at = timezone.now()
            assignment.save()
            
            # Transition order to OUT_FOR_DELIVERY
            order = assignment.order
            order.status = 'OUT_FOR_DELIVERY'
            order.save()
            
            Notification.objects.create(
                user=order.customer,
                title="Order Out for Delivery",
                message=f"Your order #{order.id} is out for delivery! Track it live.",
                notification_type='ORDER_STATUS'
            )
            
            # WS update
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"user_{order.customer.id}",
                    {
                        'type': 'order_update',
                        'order_id': order.id,
                        'status': 'OUT_FOR_DELIVERY',
                        'message': "Your order is on the way!"
                    }
                )
                
        elif new_status == 'DELIVERED':
            assignment.status = 'DELIVERED'
            assignment.delivered_at = timezone.now()
            assignment.save()
            
            # Transition order to DELIVERED and mark Paid
            order = assignment.order
            order.status = 'DELIVERED'
            order.payment_status = 'PAID'
            order.save()
            
            # Record payouts earnings in partner profile
            profile, _ = DeliveryPartnerProfile.objects.get_or_create(partner=request.user)
            profile.total_earnings = F('total_earnings') + assignment.earnings
            profile.save()
            
            Notification.objects.create(
                user=order.customer,
                title="Order Delivered Successfully",
                message=f"Your order #{order.id} from {order.shop.name} has been delivered. Enjoy!",
                notification_type='ORDER_STATUS'
            )
            
            # WS update
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"user_{order.customer.id}",
                    {
                        'type': 'order_update',
                        'order_id': order.id,
                        'status': 'DELIVERED',
                        'message': "Order delivered! Thank you for choosing Vadakara Mart."
                    }
                )
                
        return Response(DeliveryAssignmentSerializer(assignment).data)

    # 4. Stream Active Geolocation tracking coordinate packets
    @action(detail=True, methods=['post'], url_path='telemetry')
    def telemetry(self, request, pk=None):
        # pk is the Assignment ID
        assignment = self.get_object()
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        
        if assignment.partner != request.user:
            return Response({'detail': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
            
        if not lat or not lng:
            return Response({'detail': 'Latitude and Longitude required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Update current database profile coordinates
        profile, _ = DeliveryPartnerProfile.objects.get_or_create(partner=request.user)
        profile.current_latitude = lat
        profile.current_longitude = lng
        profile.save()
        
        # Broadcast coordinate update packet to Order group subscribers in real time
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"order_{assignment.order.id}",
                {
                    'type': 'order_location_broadcast',
                    'latitude': float(lat),
                    'longitude': float(lng)
                }
            )
            
        return Response({'status': 'Location streamed successfully.'})
