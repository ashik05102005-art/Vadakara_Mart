from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from ..delivery.models import DeliveryPartnerProfile

User = get_user_model()

class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('token_obtain_pair')
        self.profile_url = reverse('user_profile')

        self.user_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'password123',
            'phone': '1234567890',
            'role': 'CUSTOMER'
        }

    def test_user_registration_success(self):
        """Test registering a standard customer user successfully."""
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], self.user_data['email'])
        self.assertEqual(response.data['user']['role'], 'CUSTOMER')
        
        # Verify user is saved in DB
        self.assertTrue(User.objects.filter(email=self.user_data['email']).exists())

    def test_delivery_partner_registration_creates_profile(self):
        """Test registering as a delivery partner automatically instantiates a DeliveryPartnerProfile."""
        data = self.user_data.copy()
        data['email'] = 'rider@example.com'
        data['username'] = 'rider'
        data['role'] = 'DELIVERY_PARTNER'

        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        user = User.objects.get(email='rider@example.com')
        self.assertEqual(user.role, 'DELIVERY_PARTNER')
        
        # Verify DeliveryPartnerProfile exists for the user
        self.assertTrue(DeliveryPartnerProfile.objects.filter(partner=user).exists())

    def test_registration_duplicate_email(self):
        """Test that registering with an already existing email returns a validation error."""
        # Register first user
        self.client.post(self.register_url, self.user_data, format='json')
        
        # Try to register second user with same email
        data2 = {
            'username': 'anotheruser',
            'email': 'testuser@example.com',
            'password': 'password456',
            'phone': '0987654321',
            'role': 'CUSTOMER'
        }
        response = self.client.post(self.register_url, data2, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_registration_dynamic_unique_username(self):
        """Test that missing or duplicate username requests auto-generate a unique username."""
        # Create a user with username 'test'
        User.objects.create_user(
            username='test',
            email='existing@example.com',
            password='password123'
        )

        # Register user with email test@example.com and no username (falls back to email prefix 'test')
        data = {
            'email': 'test@example.com',
            'password': 'password123',
            'phone': '1234567890',
            'role': 'CUSTOMER'
        }
        
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['username'], 'test1') # Checks unique fallback generator

    def test_login_success(self):
        """Test logging in with correct credentials returns SimpleJWT tokens."""
        # First register the user
        self.client.post(self.register_url, self.user_data, format='json')
        
        # Login using email as the identifier
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_failed_credentials(self):
        """Test logging in with incorrect credentials fails."""
        # First register the user
        self.client.post(self.register_url, self.user_data, format='json')
        
        # Login with incorrect password
        login_data = {
            'email': self.user_data['email'],
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_retrieval_authorized(self):
        """Test that sending the Bearer token in headers successfully retrieves user profile."""
        # Register user
        register_response = self.client.post(self.register_url, self.user_data, format='json')
        access_token = register_response.data['access']
        
        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Request profile
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user_data['email'])

    def test_profile_retrieval_unauthorized(self):
        """Test that requesting profile without token is rejected with 401."""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
