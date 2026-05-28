from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import timedelta
from apps.shops.models import Shop, ShopCategory
from apps.products.models import Product, ProductCategory, ProductVariant
from apps.delivery.models import DeliveryPartnerProfile
from apps.orders.models import Coupon

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds initial database records for local commerce testing"

    def handle(self, *args, **options):
        self.stdout.write("Deleting existing records...")
        User.objects.all().delete()
        ShopCategory.objects.all().delete()
        Shop.objects.all().delete()
        ProductCategory.objects.all().delete()
        Product.objects.all().delete()
        ProductVariant.objects.all().delete()
        Coupon.objects.all().delete()

        self.stdout.write("Creating users...")
        pw = make_password("password123")
        
        admin_user = User.objects.create(email="admin@geomart.com", username="admin", role="ADMIN", is_staff=True, is_superuser=True, is_verified=True, password=pw)
        customer_user = User.objects.create(email="user@geomart.com", username="customer", role="CUSTOMER", is_verified=True, password=pw)
        shop_owner_1 = User.objects.create(email="shop1@geomart.com", username="burger_boss", role="SHOP_OWNER", is_verified=True, password=pw)
        shop_owner_2 = User.objects.create(email="shop2@geomart.com", username="grocer_green", role="SHOP_OWNER", is_verified=True, password=pw)
        shop_owner_3 = User.objects.create(email="cake@geomart.com", username="cake_queen", role="SHOP_OWNER", is_verified=True, password=pw)
        shop_owner_4 = User.objects.create(email="shop4@geomart.com", username="biriyani_king", role="SHOP_OWNER", is_verified=True, password=pw)
        shop_owner_5 = User.objects.create(email="shop5@geomart.com", username="spice_merchant", role="SHOP_OWNER", is_verified=True, password=pw)
        shop_owner_6 = User.objects.create(email="shop6@geomart.com", username="halwa_master", role="SHOP_OWNER", is_verified=True, password=pw)
        shop_owner_7 = User.objects.create(email="shop7@geomart.com", username="metro_pharmacist", role="SHOP_OWNER", is_verified=True, password=pw)
        shop_owner_8 = User.objects.create(email="shop8@geomart.com", username="nadapuram_baker", role="SHOP_OWNER", is_verified=True, password=pw)
        rider_user = User.objects.create(email="delivery@geomart.com", username="john_rider", role="DELIVERY_PARTNER", is_verified=True, password=pw)

        self.stdout.write("Creating delivery profile...")
        DeliveryPartnerProfile.objects.create(
            partner=rider_user,
            is_available=True,
            is_verified=True,
            vehicle_type="MOTORBIKE",
            current_latitude=11.610000,
            current_longitude=75.591000
        )

        self.stdout.write("Creating shop categories...")
        cat_restaurant = ShopCategory.objects.create(name="Restaurants & Cafes", slug="restaurants", description="Delicious local eateries", icon="Utensils")
        cat_grocery = ShopCategory.objects.create(name="Grocery & Supermarket", slug="grocery", description="Fresh essentials delivered fast", icon="ShoppingCart")
        cat_pharmacy = ShopCategory.objects.create(name="Pharmacy", slug="pharmacy", description="Medicines and wellness", icon="Pills")
        cat_bakery = ShopCategory.objects.create(name="Bakery & Desserts", slug="bakery", description="Sweet treats and fresh breads", icon="Cake")

        self.stdout.write("Creating shops...")
        # Coordinates focused around Vadakara center
        shop_burger = Shop.objects.create(
            owner=shop_owner_1,
            name="Burger House Bistro",
            description="Premium gourmet burgers and hand-cut fries",
            category=cat_restaurant,
            latitude=11.611500,
            longitude=75.593000,
            delivery_radius_km=5.00,
            is_active=True,
            is_verified=True,
            opening_time="09:00:00",
            closing_time="23:30:00",
            phone="9876543210",
            address_text="Cooperative Hospital Road, Vadakara, Kerala"
        )
        
        shop_grocer = Shop.objects.create(
            owner=shop_owner_2,
            name="Green Fields Organic",
            description="Fresh farm-to-table groceries and organic dairy",
            category=cat_grocery,
            latitude=11.609500,
            longitude=75.589500,
            delivery_radius_km=7.50,
            is_active=True,
            is_verified=True,
            opening_time="07:00:00",
            closing_time="21:00:00",
            phone="9876543211",
            address_text="Edodi Junction, Vadakara, Kerala"
        )
        
        shop_cake = Shop.objects.create(
            owner=shop_owner_3,
            name="Honey Special Cake",
            description="Vibrant bakery offering premium layered honey cakes, jar cakes, and custom pastries",
            category=cat_bakery,
            latitude=11.618500,
            longitude=75.598500,
            delivery_radius_km=10.00,
            is_active=True,
            is_verified=True,
            opening_time="08:00:00",
            closing_time="22:00:00",
            phone="9876543212",
            address_text="Nadapuram Road, Vadakara, Kozhikode, Kerala",
            logo="shop_logos/honey_cake_bakery.png",
            banner="shop_banners/honey_cake_bakery.png"
        )

        # 1. Malabar Plaza Restaurant
        shop_malabar = Shop.objects.create(
            owner=shop_owner_4,
            name="Malabar Plaza Restaurant",
            description="Authentic traditional Malabar delicacies and multi-cuisine specialties",
            category=cat_restaurant,
            latitude=11.611000,
            longitude=75.590500,
            delivery_radius_km=6.00,
            is_active=True,
            is_verified=True,
            opening_time="11:00:00",
            closing_time="22:30:00",
            phone="9876543213",
            address_text="Edodi Road, Vadakara, Kerala"
        )

        # 2. Nadapuram Spice Bazar
        shop_spices = Shop.objects.create(
            owner=shop_owner_5,
            name="Nadapuram Spice Bazar",
            description="Pure local farm-grown spices, premium dry fruits, and handpicked tea powders",
            category=cat_grocery,
            latitude=11.686500,
            longitude=75.653500,
            delivery_radius_km=15.00,
            is_active=True,
            is_verified=True,
            opening_time="08:00:00",
            closing_time="20:30:00",
            phone="9876543214",
            address_text="Town Center, Nadapuram, Kozhikode, Kerala"
        )

        # 3. Calicut Halwa House
        shop_halwa = Shop.objects.create(
            owner=shop_owner_6,
            name="Calicut Halwa House",
            description="Famous Kozhikodan halwas, direct-sourced coconut oil chips, and traditional snacks",
            category=cat_bakery,
            latitude=11.608000,
            longitude=75.588000,
            delivery_radius_km=8.00,
            is_active=True,
            is_verified=True,
            opening_time="09:00:00",
            closing_time="21:30:00",
            phone="9876543215",
            address_text="Link Road, Vadakara, Kerala"
        )

        # 4. Metro Care Pharmacy
        shop_pharmacy = Shop.objects.create(
            owner=shop_owner_7,
            name="Metro Care Pharmacy",
            description="All critical medicines, personal care, and emergency healthcare needs",
            category=cat_pharmacy,
            latitude=11.612500,
            longitude=75.592500,
            delivery_radius_km=5.00,
            is_active=True,
            is_verified=True,
            opening_time="00:00:00",
            closing_time="23:59:59",
            phone="9876543216",
            address_text="Near New Bus Stand, Vadakara, Kerala"
        )

        # 5. Nadapuram Bakers & Cafe
        shop_nad_bakery = Shop.objects.create(
            owner=shop_owner_8,
            name="Nadapuram Bakers & Cafe",
            description="Freshly baked hot puffs, cream buns, signature cakes, and hot tea/coffee",
            category=cat_bakery,
            latitude=11.688000,
            longitude=75.656000,
            delivery_radius_km=15.00,
            is_active=True,
            is_verified=True,
            opening_time="07:30:00",
            closing_time="22:00:00",
            phone="9876543217",
            address_text="Kuttiady Road, Nadapuram, Kozhikode, Kerala"
        )

        self.stdout.write("Creating product categories...")
        pcat_burger = ProductCategory.objects.create(shop=shop_burger, name="Gourmet Burgers", slug="burgers")
        pcat_sides = ProductCategory.objects.create(shop=shop_burger, name="Sides & Munchies", slug="sides")
        
        pcat_produce = ProductCategory.objects.create(shop=shop_grocer, name="Fresh Produce", slug="produce")
        pcat_dairy = ProductCategory.objects.create(shop=shop_grocer, name="Dairy & Eggs", slug="dairy")
        
        pcat_honey = ProductCategory.objects.create(shop=shop_cake, name="Honey Cakes", slug="honey-cakes")
        pcat_cakes = ProductCategory.objects.create(shop=shop_cake, name="Cakes & Tarts", slug="cakes-tarts")
        pcat_servings = ProductCategory.objects.create(shop=shop_cake, name="Individual Servings", slug="individual-servings")
        
        pcat_malabar = ProductCategory.objects.create(shop=shop_malabar, name="Malabar Specials", slug="malabar-specials")
        pcat_spices = ProductCategory.objects.create(shop=shop_spices, name="Spices & Condiments", slug="spices-condiments")
        pcat_halwa = ProductCategory.objects.create(shop=shop_halwa, name="Signature Halwa", slug="signature-halwa")
        pcat_pharmacy_meds = ProductCategory.objects.create(shop=shop_pharmacy, name="Prescription Medicines", slug="prescription-medicines")
        pcat_nad_bakes = ProductCategory.objects.create(shop=shop_nad_bakery, name="Hot Snacks & Bakes", slug="hot-snacks-bakes")

        self.stdout.write("Creating products and variants...")
        # Burger house products
        p1 = Product.objects.create(
            shop=shop_burger,
            category=pcat_burger,
            name="Classic Cheeseburger",
            description="Juicy flame-grilled beef patty, melted cheddar, crisp lettuce, tomato and house sauce.",
            price=120.00,
            offer_price=99.00,
            stock_quantity=50,
            is_available=True,
            tags="burger, cheese, cheeseburger, fastfood"
        )
        
        ProductVariant.objects.create(product=p1, name="Single Patty", price_override=None, stock_quantity=30)
        ProductVariant.objects.create(product=p1, name="Double Patty", price_override=149.00, stock_quantity=20)

        Product.objects.create(
            shop=shop_burger,
            category=pcat_burger,
            name="Spicy Chicken Wrap",
            description="Crispy chicken tenders, spicy mayo, and crunchy cabbage wrapped in a warm tortilla.",
            price=150.00,
            stock_quantity=25,
            is_available=True,
            tags="wrap, chicken, spicy"
        )
        
        Product.objects.create(
            shop=shop_burger,
            category=pcat_sides,
            name="Peri Peri French Fries",
            description="Golden salted French fries sprinkled with premium fiery peri-peri seasoning.",
            price=80.00,
            stock_quantity=100,
            is_available=True,
            tags="fries, sides, chips, peri-peri"
        )

        # Grocer products
        Product.objects.create(
            shop=shop_grocer,
            category=pcat_produce,
            name="Organic Red Apples (1kg)",
            description="Crisp and sweet organic Himalayan red apples.",
            price=180.00,
            offer_price=160.00,
            stock_quantity=15,
            is_available=True,
            tags="apple, fruit, fresh, organic"
        )
        
        Product.objects.create(
            shop=shop_grocer,
            category=pcat_dairy,
            name="Farm Fresh Organic Milk (1L)",
            description="Pasteurized whole milk sourced directly from local organic farms.",
            price=60.00,
            stock_quantity=40,
            is_available=True,
            tags="milk, dairy, fresh"
        )
        
        # Honey Special Cake products
        Product.objects.create(
            shop=shop_cake,
            category=pcat_honey,
            name="Classic Honey Cake",
            description="Vibrant multi-layered sponge with caramelized honey and delicate sour cream frosting.",
            price=150.00,
            image="product_images/classic_honey_cake.png",
            stock_quantity=50,
            is_available=True,
            tags="honey, cake, sweet, medovik, classic"
        )
        Product.objects.create(
            shop=shop_cake,
            category=pcat_honey,
            name="Russian Honey Cake",
            description="Traditional Medovik cake with golden layers, fresh honey, and cake crumbs dusting.",
            price=160.00,
            image="product_images/russian_honey_cake.png",
            stock_quantity=50,
            is_available=True,
            tags="honey, cake, russian, medovik, sweet"
        )
        Product.objects.create(
            shop=shop_cake,
            category=pcat_honey,
            name="Chocolate Honey Cake",
            description="Layered chocolate sponge infused with golden honey and dark chocolate curls on top.",
            price=180.00,
            image="product_images/chocolate_honey_cake.png",
            stock_quantity=50,
            is_available=True,
            tags="chocolate, honey, cake, sweet, dessert"
        )
        Product.objects.create(
            shop=shop_cake,
            category=pcat_cakes,
            name="Red Velvet Cake",
            description="Vibrant crimson layered cake with premium white cream cheese frosting.",
            price=170.00,
            image="product_images/red_velvet_cake.png",
            stock_quantity=50,
            is_available=True,
            tags="redvelvet, velvet, cake, sweet, cheese"
        )
        Product.objects.create(
            shop=shop_cake,
            category=pcat_servings,
            name="Jar Cakes",
            description="Fun cake layers inside a beautiful glass jar, available in strawberry, cookie and chocolate.",
            price=90.00,
            image="product_images/jar_cakes.png",
            stock_quantity=50,
            is_available=True,
            tags="jarcake, jar, cake, sweet, single"
        )
        Product.objects.create(
            shop=shop_cake,
            category=pcat_servings,
            name="Pastries",
            description="Gourmet pastries featuring fresh fruit tarts, eclairs, and layered mille-feuille.",
            price=60.00,
            image="product_images/pastries.png",
            stock_quantity=50,
            is_available=True,
            tags="pastry, sweet, tart, eclair"
        )
        Product.objects.create(
            shop=shop_cake,
            category=pcat_cakes,
            name="Birthday Cakes",
            description="Custom beautiful birthday cakes with pastel frosting, sugar flowers, and sprinkles.",
            price=500.00,
            image="product_images/birthday_cakes.png",
            stock_quantity=50,
            is_available=True,
            tags="birthday, cake, custom, sweet, celebration"
        )

        # Products and Variants for new shops
        
        # 1. Malabar Plaza Restaurant Products
        p_biriyani = Product.objects.create(
            shop=shop_malabar,
            category=pcat_malabar,
            name="Malabar Chicken Biriyani",
            description="Aromatic Kaima rice cooked with tender spiced chicken, premium ghee, and saffron, served with raitha and pickle.",
            price=190.00,
            stock_quantity=80,
            is_available=True,
            tags="biriyani, chicken, malabar, rice, lunch"
        )
        ProductVariant.objects.create(product=p_biriyani, name="Single / Half", price_override=130.00, stock_quantity=40)
        ProductVariant.objects.create(product=p_biriyani, name="Full Double", price_override=240.00, stock_quantity=40)

        Product.objects.create(
            shop=shop_malabar,
            category=pcat_malabar,
            name="Kerala Porotta with Beef Roast",
            description="Flaky layered Kerala porotta (2 pcs) served with traditional slow-roasted spicy beef curry.",
            price=160.00,
            stock_quantity=60,
            is_available=True,
            tags="porotta, beef, curry, classic, dinner"
        )

        # 2. Nadapuram Spice Bazar Products
        Product.objects.create(
            shop=shop_spices,
            category=pcat_spices,
            name="Wayanad Black Pepper (250g)",
            description="Premium bold black pepper handpicked from organic farms of Wayanad, sun-dried to perfection.",
            price=180.00,
            stock_quantity=100,
            is_available=True,
            tags="pepper, spice, organic, grocery"
        )
        Product.objects.create(
            shop=shop_spices,
            category=pcat_spices,
            name="Green Cardamom Bold (100g)",
            description="Highly aromatic premium green cardamom pods (8mm+ size) for standard culinary and tea brewing.",
            price=290.00,
            stock_quantity=50,
            is_available=True,
            tags="cardamom, elakka, spice, grocery"
        )

        # 3. Calicut Halwa House Products
        p_halwa_item = Product.objects.create(
            shop=shop_halwa,
            category=pcat_halwa,
            name="Kozhikodan Black Halwa (500g)",
            description="Traditional legendary black halwa made of pure coconut oil, jaggery, double-filtered wheat starch, and cardamom.",
            price=150.00,
            stock_quantity=40,
            is_available=True,
            tags="halwa, sweet, kozhikode, dessert, classic"
        )
        ProductVariant.objects.create(product=p_halwa_item, name="Original Jaggery", price_override=None, stock_quantity=20)
        ProductVariant.objects.create(product=p_halwa_item, name="Ghee Special", price_override=180.00, stock_quantity=20)

        Product.objects.create(
            shop=shop_halwa,
            category=pcat_halwa,
            name="Nendran Banana Chips (250g)",
            description="Ultra-thin crispy banana chips sliced from raw Nendran bananas and fried in fresh local coconut oil.",
            price=90.00,
            stock_quantity=120,
            is_available=True,
            tags="chips, snacks, banana, coconut-oil"
        )

        # 4. Metro Care Pharmacy Products
        Product.objects.create(
            shop=shop_pharmacy,
            category=pcat_pharmacy_meds,
            name="Paracetamol 650mg Tablets (Strip of 15)",
            description="Rapid pain relief and fever reduction tables. Dosage as directed by physician.",
            price=30.00,
            stock_quantity=200,
            is_available=True,
            tags="medicine, fever, paracetamol, painkiller"
        )
        Product.objects.create(
            shop=shop_pharmacy,
            category=pcat_pharmacy_meds,
            name="First Aid Kit Essential",
            description="Compact first aid bundle containing medical tape, sterile gauze pads, band-aids, scissors, and antiseptic lotion.",
            price=250.00,
            stock_quantity=30,
            is_available=True,
            tags="first-aid, health, bandage, emergency"
        )

        # 5. Nadapuram Bakers & Cafe Products
        Product.objects.create(
            shop=shop_nad_bakery,
            category=pcat_nad_bakes,
            name="Hot Chicken Puffs (2 Pcs)",
            description="Golden, crispy, light flaky puff pastry stuffed with spicy, seasoned chicken masala filling.",
            price=40.00,
            stock_quantity=40,
            is_available=True,
            tags="puffs, bakery, snacks, chicken, hot"
        )
        Product.objects.create(
            shop=shop_nad_bakery,
            category=pcat_nad_bakes,
            name="Nadapuram Special Cream Bun",
            description="Traditional sweet soft bun sliced and loaded with fluffy vanilla butter cream and glazed cherry on top.",
            price=25.00,
            stock_quantity=60,
            is_available=True,
            tags="creambun, sweet, bun, bakery, snacks"
        )

        self.stdout.write("Creating coupons...")
        now = timezone.now()
        Coupon.objects.create(
            code="WELCOME10",
            discount_percent=10.00,
            min_order_value=100.00,
            is_active=True,
            valid_from=now - timedelta(days=1),
            valid_to=now + timedelta(days=30)
        )
        
        Coupon.objects.create(
            code="FREEDEL",
            discount_amount=15.00,
            min_order_value=50.00,
            is_active=True,
            valid_from=now - timedelta(days=1),
            valid_to=now + timedelta(days=30)
        )

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
