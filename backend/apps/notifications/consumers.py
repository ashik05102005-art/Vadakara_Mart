import json
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs

class NotificationsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # We can pass user_id or token as query parameters
        query_string = parse_qs(self.scope['query_string'].decode())
        user_id = query_string.get('user_id', [None])[0]
        
        if user_id:
            self.group_name = f"user_{user_id}"
            
            # Join user-specific channel group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()
            
            # Send welcome message
            await self.send(text_data=json.dumps({
                'type': 'welcome',
                'message': f'Connected to real-time notification socket for user {user_id}'
            }))
        else:
            await self.close(code=4003) # Reject anonymous connection if no user ID

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    # Receive message from WebSocket (client sends data to server)
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')
            
            # If the client is a delivery partner streaming their coordinates
            if action == 'location_update':
                lat = data.get('latitude')
                lng = data.get('longitude')
                order_id = data.get('order_id')
                
                # Broadcast this location update to anyone watching this order group
                if order_id:
                    order_group = f"order_{order_id}"
                    await self.channel_layer.group_send(
                        order_group,
                        {
                            'type': 'order_location_broadcast',
                            'latitude': lat,
                            'longitude': lng
                        }
                    )
            
            # Support joining order tracking groups (e.g., when a user views order detail page)
            elif action == 'track_order':
                order_id = data.get('order_id')
                if order_id:
                    self.order_group_name = f"order_{order_id}"
                    await self.channel_layer.group_add(
                        self.order_group_name,
                        self.channel_name
                    )
                    await self.send(text_data=json.dumps({
                        'type': 'info',
                        'message': f'Tracking order {order_id}'
                    }))
                    
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    # Methods to handle broadcasts sent from standard HTTP Django Views / Signals
    async def send_notification(self, event):
        # Send notification object to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'title': event['title'],
            'message': event['message'],
            'notification_type': event.get('notification_type', 'SYSTEM')
        }))

    async def order_update(self, event):
        # Send order status update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'order_status_update',
            'order_id': event['order_id'],
            'status': event['status'],
            'message': event['message']
        }))

    async def order_location_broadcast(self, event):
        # Send live delivery location to client
        await self.send(text_data=json.dumps({
            'type': 'live_location',
            'latitude': event['latitude'],
            'longitude': event['longitude']
        }))
