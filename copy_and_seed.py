import os
import shutil
import django

# Setup Django environment
sys_path_dir = os.path.dirname(os.path.abspath(__file__))
import sys
sys.path.append(os.path.join(sys_path_dir, 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'geomart.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from apps.shops.models import Shop, ShopCategory
from apps.products.models import Product, ProductCategory, ProductVariant

User = get_user_model()

def copy_images():
    print("Creating backend media directories...")
    media_root = os.path.join(sys_path_dir, 'backend', 'media')
    
    logos_dir = os.path.join(media_root, 'shop_logos')
    banners_dir = os.path.join(media_root, 'shop_banners')
    products_dir = os.path.join(media_root, 'product_images')
    
    os.makedirs(logos_dir, exist_ok=True)
    os.makedirs(banners_dir, exist_ok=True)
    os.makedirs(products_dir, exist_ok=True)
    
    # Generate copying map
    src_dir = r"C:\Users\ASHIK\.gemini\antigravity-ide\brain\293ae1e6-70a6-4273-a9bc-86493ea28cba"
    
    shutil.copy2(
        os.path.join(src_dir, "honey_cake_bakery_1779902410674.png"),
        os.path.join(logos_dir, "honey_cake_bakery.png")
    )
    shutil.copy2(
        os.path.join(src_dir, "honey_cake_bakery_1779902410674.png"),
        os.path.join(banners_dir, "honey_cake_bakery.png")
    )
    
    product_mapping = {
        "classic_honey_cake_1779902435032.png": "classic_honey_cake.png",
        "russian_honey_cake_1779902455780.png": "russian_honey_cake.png",
        "chocolate_honey_cake_1779902476417.png": "chocolate_honey_cake.png",
        "red_velvet_cake_1779902496429.png": "red_velvet_cake.png",
        "jar_cakes_1779902516801.png": "jar_cakes.png",
        "pastries_1779902538232.png": "pastries.png",
        "birthday_cakes_1779902558809.png": "birthday_cakes.png"
    }
    
    for src_name, dest_name in product_mapping.items():
        src_path = os.path.join(src_dir, src_name)
        dest_path = os.path.join(products_dir, dest_name)
        if os.path.exists(src_path):
            shutil.copy2(src_path, dest_path)
            print(f"Copied {src_name} -> {dest_name}")
        else:
            print(f"Warning: {src_path} not found!")

def seed_cake_shop():
    print("Seeding cake shop data into Django database...")
    pw = make_password("password123")
    
    # 1. Create User
    owner, created = User.objects.get_or_create(
        email="cake@geomart.com",
        defaults={
            "username": "cake_queen",
            "role": "SHOP_OWNER",
            "is_verified": True,
            "password": pw
        }
    )
    if not created:
        owner.password = pw
        owner.save()
        print("Updated cake store owner account.")
    else:
        print("Created cake store owner account.")
        
    # 2. Get/Create ShopCategory
    cat_bakery, _ = ShopCategory.objects.get_or_create(
        slug="bakery",
        defaults={
            "name": "Bakery & Desserts",
            "description": "Sweet treats and fresh breads",
            "icon": "Cake"
        }
    )
    
    # 3. Create Shop
    shop, created = Shop.objects.get_or_create(
        owner=owner,
        name="Honey Special Cake",
        defaults={
            "description": "Vibrant bakery offering premium layered honey cakes, jar cakes, and custom pastries",
            "category": cat_bakery,
            "latitude": 11.687200,
            "longitude": 75.654800,
            "delivery_radius_km": 10.00,
            "is_active": True,
            "is_verified": True,
            "opening_time": "08:00:00",
            "closing_time": "22:00:00",
            "phone": "9876543212",
            "address_text": "Nadapuram Town Center, Kozhikode, Kerala",
            "logo": "shop_logos/honey_cake_bakery.png",
            "banner": "shop_banners/honey_cake_bakery.png"
        }
    )
    if not created:
        shop.latitude = 11.687200
        shop.longitude = 75.654800
        shop.logo = "shop_logos/honey_cake_bakery.png"
        shop.banner = "shop_banners/honey_cake_bakery.png"
        shop.save()
        print("Updated existing cake shop coordinates and images.")
    else:
        print("Created Honey Special Cake shop at Nadapuram.")
        
    # 4. Create Product Categories
    pcat_honey, _ = ProductCategory.objects.get_or_create(shop=shop, name="Honey Cakes", slug="honey-cakes")
    pcat_cakes, _ = ProductCategory.objects.get_or_create(shop=shop, name="Cakes & Tarts", slug="cakes-tarts")
    pcat_servings, _ = ProductCategory.objects.get_or_create(shop=shop, name="Individual Servings", slug="individual-servings")
    
    # 5. Create Products
    products_to_seed = [
        {
            "category": pcat_honey,
            "name": "Classic Honey Cake",
            "description": "Vibrant multi-layered sponge with caramelized honey and delicate sour cream frosting.",
            "price": 150.00,
            "image": "product_images/classic_honey_cake.png",
            "tags": "honey, cake, sweet, medovik, classic"
        },
        {
            "category": pcat_honey,
            "name": "Russian Honey Cake",
            "description": "Traditional Medovik cake with golden layers, fresh honey, and cake crumbs dusting.",
            "price": 160.00,
            "image": "product_images/russian_honey_cake.png",
            "tags": "honey, cake, russian, medovik, sweet"
        },
        {
            "category": pcat_honey,
            "name": "Chocolate Honey Cake",
            "description": "Layered chocolate sponge infused with golden honey and dark chocolate curls on top.",
            "price": 180.00,
            "image": "product_images/chocolate_honey_cake.png",
            "tags": "chocolate, honey, cake, sweet, dessert"
        },
        {
            "category": pcat_cakes,
            "name": "Red Velvet Cake",
            "description": "Vibrant crimson layered cake with premium white cream cheese frosting.",
            "price": 170.00,
            "image": "product_images/red_velvet_cake.png",
            "tags": "redvelvet, velvet, cake, sweet, cheese"
        },
        {
            "category": pcat_servings,
            "name": "Jar Cakes",
            "description": "Fun cake layers inside a beautiful glass jar, available in strawberry, cookie and chocolate.",
            "price": 90.00,
            "image": "product_images/jar_cakes.png",
            "tags": "jarcake, jar, cake, sweet, single"
        },
        {
            "category": pcat_servings,
            "name": "Pastries",
            "description": "Gourmet pastries featuring fresh fruit tarts, eclairs, and layered mille-feuille.",
            "price": 60.00,
            "image": "product_images/pastries.png",
            "tags": "pastry, sweet, tart, eclair"
        },
        {
            "category": pcat_cakes,
            "name": "Birthday Cakes",
            "description": "Custom beautiful birthday cakes with pastel frosting, sugar flowers, and sprinkles.",
            "price": 500.00,
            "image": "product_images/birthday_cakes.png",
            "tags": "birthday, cake, custom, sweet, celebration"
        }
    ]
    
    for p_data in products_to_seed:
        prod, p_created = Product.objects.get_or_create(
            shop=shop,
            name=p_data["name"],
            defaults={
                "category": p_data["category"],
                "description": p_data["description"],
                "price": p_data["price"],
                "image": p_data["image"],
                "stock_quantity": 50,
                "is_available": True,
                "tags": p_data["tags"]
            }
        )
        if not p_created:
            prod.image = p_data["image"]
            prod.price = p_data["price"]
            prod.description = p_data["description"]
            prod.save()
            print(f"Updated product: {prod.name}")
        else:
            print(f"Created product: {prod.name}")

if __name__ == "__main__":
    copy_images()
    seed_cake_shop()
    print("All tasks completed successfully!")
