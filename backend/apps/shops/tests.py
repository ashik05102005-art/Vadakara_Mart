from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.shops.models import Shop, ShopCategory
from apps.shops.utils import annotate_distance

User = get_user_model()

class ShopDistanceTestCase(TestCase):
    def setUp(self):
        # Create standard test users & categories
        self.owner = User.objects.create_user(
            username='shopowner', 
            email='owner@test.com', 
            password='testpassword'
        )
        self.category = ShopCategory.objects.create(
            name='Test Category', 
            slug='test'
        )
        
        # Coordinates for Shop (Bangalore MG Road - 12.971598, 77.594562)
        self.shop = Shop.objects.create(
            owner=self.owner,
            name='Bangalore MG Road Shop',
            category=self.category,
            latitude=12.971598,
            longitude=77.594562,
            delivery_radius_km=5.00,
            is_active=True,
            is_verified=True,
            address_text='MG Road Bangalore'
        )

    def test_distance_calculation(self):
        # User is located nearby (Bangalore Richmond Road - 12.969876, 77.592345)
        # Real geographical distance is roughly ~0.3 km
        user_lat = 12.969876
        user_lng = 77.592345
        
        shops_with_distance = annotate_distance(
            Shop.objects.all(), 
            user_lat, 
            user_lng
        )
        
        test_shop = shops_with_distance.first()
        self.assertIsNotNone(test_shop.distance)
        self.assertLess(test_shop.distance, 1.0) # Check proximity is under 1 km
        self.assertGreater(test_shop.distance, 0.0) # Proximity is above 0 km
