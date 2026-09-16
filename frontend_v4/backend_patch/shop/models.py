from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.urls import reverse


# =========================================================
# CATEGORY
# =========================================================

class Category(models.Model):
    name = models.CharField(
        max_length=80,
        unique=True,
    )

    slug = models.SlugField(
        max_length=80,
        unique=True,
    )

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


# =========================================================
# MY PRODUCTS / CUSTOM PRODUCTS
# =========================================================

class Product(models.Model):
    name = models.CharField(
        max_length=160,
    )

    slug = models.SlugField(
        max_length=180,
        unique=True,
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )

    description = models.TextField()

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    image = models.ImageField(
        upload_to="products/",
        blank=True,
        null=True,
    )

    stock = models.PositiveIntegerField(
        default=0,
    )

    featured = models.BooleanField(
        default=True,
    )

    active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "My Product"
        verbose_name_plural = "My Products"

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse(
            "product",
            kwargs={"slug": self.slug},
        )


# =========================================================
# MY PRODUCT GALLERY IMAGES
# =========================================================

class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )

    image = models.ImageField(
        upload_to="products/gallery/",
    )

    is_primary = models.BooleanField(
        default=False,
    )

    sort_order = models.PositiveIntegerField(
        default=0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-is_primary",
            "sort_order",
            "id",
        ]

        verbose_name = "Product Image"
        verbose_name_plural = "Product Images"

    def __str__(self):
        return f"{self.product.name} - Image {self.pk}"


# =========================================================
# ORDERS
# =========================================================

class PrintifyProduct(models.Model):
    printify_id = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    active = models.BooleanField(default=True)
    featured = models.BooleanField(default=True)
    sync_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Printify Product"
        verbose_name_plural = "Printify Products"
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title


class PrintifyProductImage(models.Model):
    product = models.ForeignKey(
        PrintifyProduct, on_delete=models.CASCADE, related_name="images"
    )
    printify_url = models.URLField(blank=True)
    custom_image = models.ImageField(upload_to="printify_products/", blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Printify Product Image"
        verbose_name_plural = "Printify Product Images"
        ordering = ["sort_order", "id"]


class PrintifyVariant(models.Model):
    product = models.ForeignKey(
        PrintifyProduct, on_delete=models.CASCADE, related_name="variants"
    )
    printify_variant_id = models.PositiveBigIntegerField(unique=True)
    title = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    production_cost = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    available = models.BooleanField(default=True)
    enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Printify Variant"
        verbose_name_plural = "Printify Variants"
        ordering = ["id"]

    def __str__(self):
        return self.title


class Order(models.Model):
    STATUS = [
        ("new", "New"),
        ("paid", "Paid"),
        ("processing", "Processing"),
        ("shipped", "Shipped"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    full_name = models.CharField(
        max_length=160,
    )

    email = models.EmailField()

    address = models.TextField()

    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="new",
    )

    # PAYMENT

    payment_method = models.CharField(
        max_length=30,
        blank=True,
        default="",
    )


    paid_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    # SHIPPING

    phone = models.CharField(
        max_length=50,
        blank=True,
        default="",
    )

    country = models.CharField(
        max_length=2,
        blank=True,
        default="",
    )

    region = models.CharField(
        max_length=120,
        blank=True,
        default="",
    )

    street = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    apartment = models.CharField(
        max_length=120,
        blank=True,
        default="",
    )

    city = models.CharField(
        max_length=120,
        blank=True,
        default="",
    )

    postal_code = models.CharField(
        max_length=40,
        blank=True,
        default="",
    )

    delivery_notes = models.TextField(
        blank=True,
        default="",
    )

    shipping_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    printify_order_id = models.CharField(
        max_length=120, blank=True, default="", db_index=True
    )
    printify_status = models.CharField(max_length=80, blank=True, default="")
    printify_submitted_at = models.DateTimeField(blank=True, null=True)
    printify_error = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Order"
        verbose_name_plural = "Orders"

    def __str__(self):
        if self.pk:
            return f"SW-{self.pk:06d} — {self.full_name}"

        return self.full_name


# =========================================================
# ORDER ITEMS
# =========================================================

class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
    )

    variant = models.ForeignKey(
        "ProductVariant",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="order_items",
    )

    color_name = models.CharField(max_length=80, blank=True, default="")
    size_name = models.CharField(max_length=40, blank=True, default="")

    quantity = models.PositiveIntegerField()

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    @property
    def subtotal(self):
        if self.quantity is None or self.price is None:
            return 0

        return self.quantity * self.price

    def __str__(self):
        return f"{self.product} x {self.quantity}"


# =========================================================
# EMAIL VERIFICATION
# =========================================================

class PrintifyOrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="printify_items")
    product = models.ForeignKey(
        PrintifyProduct, on_delete=models.PROTECT, related_name="order_items"
    )
    variant = models.ForeignKey(
        PrintifyVariant, on_delete=models.PROTECT, related_name="order_items"
    )
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def subtotal(self):
        if self.quantity is None or self.price is None:
            return 0
        return self.quantity * self.price


class EmailVerification(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="email_verification",
    )

    code_hash = models.CharField(
        max_length=200,
    )

    expires_at = models.DateTimeField()

    attempts = models.PositiveIntegerField(
        default=0,
    )

    last_sent_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"Email verification for {self.user.username}"


# =========================================================
# WISHLIST
# =========================================================

class Wishlist(models.Model):
    printify_product = models.ForeignKey(
        PrintifyProduct,
        on_delete=models.CASCADE,
        related_name="wishlisted_by",
        blank=True,
        null=True,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="wishlisted_by",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["user", "printify_product"],
                name="unique_user_wishlist_printify_product",
            ),
            models.UniqueConstraint(
                fields=[
                    "user",
                    "product",
                ],
                name="unique_user_wishlist_product",
            ),
        ]

    def __str__(self):
        if self.product:
            return (
                f"{self.user.username} — "
                f"{self.product.name}"
            )

        return (
            f"{self.user.username} — "
            "Wishlist item"
        )


# =========================================================
# SITE ACCESS / PRIVATE SHOP
# =========================================================

class SiteAccessSettings(models.Model):
    maintenance_mode = models.BooleanField(
        default=True,
        verbose_name="Private shop enabled",
    )

    access_password = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Access password",
        help_text=(
            "Visitors must enter this password while "
            "private shop mode is enabled."
        ),
    )

    class Meta:
        verbose_name = "Site Access"
        verbose_name_plural = "Site Access"

    def __str__(self):
        return "LE VAURÉ Site Access"

    def set_access_password(self, raw_password):
        if raw_password:
            self.access_password = make_password(raw_password)
        else:
            self.access_password = ""

    def check_access_password(self, raw_password):
        if not self.access_password:
            return False

        return check_password(
            raw_password,
            self.access_password,
        )


# =========================================================
# NEXT.JS STOREFRONT / ADMIN-MANAGED COMMERCE CONTENT
# =========================================================

class ProductColor(models.Model):
    name = models.CharField(max_length=50, unique=True)
    hex_code = models.CharField(max_length=7, default="#111111")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class ProductSize(models.Model):
    name = models.CharField(max_length=20, unique=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    color = models.ForeignKey(ProductColor, on_delete=models.PROTECT, related_name="variants")
    size = models.ForeignKey(ProductSize, on_delete=models.PROTECT, related_name="variants")
    sku = models.CharField(max_length=80, blank=True, default="", db_index=True)
    stock = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    image = models.ImageField(upload_to="products/variants/", blank=True, null=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["color__sort_order", "size__sort_order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["product", "color", "size"],
                name="unique_product_color_size",
            )
        ]

    @property
    def effective_price(self):
        return self.price if self.price is not None else self.product.price

    def __str__(self):
        return f"{self.product.name} / {self.color.name} / {self.size.name}"


class Collection(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    subtitle = models.CharField(max_length=220, blank=True, default="")
    description = models.TextField(blank=True, default="")
    image = models.ImageField(upload_to="collections/", blank=True, null=True)
    products = models.ManyToManyField(Product, blank=True, related_name="collections")
    featured = models.BooleanField(default=False)
    active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class SiteSettings(models.Model):
    brand_name = models.CharField(max_length=80, default="LE VAURÉ")
    brand_tagline = models.CharField(max_length=180, default="CLOTHING WITH A PURPOSE")
    primary_color = models.CharField(max_length=7, default="#0B2F26")
    accent_color = models.CharField(max_length=7, default="#C9A96E")
    page_background_color = models.CharField(max_length=7, default="#FFFFFF")
    soft_background_color = models.CharField(max_length=7, default="#F5F5F2")
    text_color = models.CharField(max_length=7, default="#111111")
    muted_text_color = models.CharField(max_length=7, default="#6F716E")
    border_color = models.CharField(max_length=7, default="#E8E8E5")
    announcement_background_color = models.CharField(max_length=7, default="#111111")
    announcement_text_color = models.CharField(max_length=7, default="#FFFFFF")
    header_background_color = models.CharField(max_length=7, default="#FFFFFF")
    header_text_color = models.CharField(max_length=7, default="#111111")
    footer_background_color = models.CharField(max_length=7, default="#111111")
    footer_text_color = models.CharField(max_length=7, default="#FFFFFF")
    button_background_color = models.CharField(max_length=7, default="#111111")
    button_text_color = models.CharField(max_length=7, default="#FFFFFF")
    button_hover_background_color = models.CharField(max_length=7, default="#0B2F26")
    button_hover_text_color = models.CharField(max_length=7, default="#FFFFFF")
    announcement = models.CharField(max_length=220, default="FREE DELIVERY ALL OVER ARMENIA ON ORDERS OVER 12,000 ֏")
    support_email = models.EmailField(blank=True, default="")
    support_phone = models.CharField(max_length=40, blank=True, default="")
    instagram_url = models.URLField(blank=True, default="")
    facebook_url = models.URLField(blank=True, default="")
    tiktok_url = models.URLField(blank=True, default="")
    footer_note = models.CharField(max_length=220, blank=True, default="Made with ♥ in Armenia")
    default_shipping_text = models.CharField(max_length=220, default="Fast delivery across Armenia")
    default_returns_text = models.CharField(max_length=220, default="Easy returns within 14 days")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Storefront settings"
        verbose_name_plural = "Storefront settings"

    def __str__(self):
        return self.brand_name


class NavigationItem(models.Model):
    label = models.CharField(max_length=80)
    url = models.CharField(max_length=220)
    location = models.CharField(
        max_length=20,
        choices=[("header", "Header"), ("footer_shop", "Footer / Shop"), ("footer_help", "Footer / Help"), ("footer_company", "Footer / Company")],
        default="header",
    )
    sort_order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    open_new_tab = models.BooleanField(default=False)

    class Meta:
        ordering = ["location", "sort_order", "id"]

    def __str__(self):
        return f"{self.location}: {self.label}"


class HomeHeroSlide(models.Model):
    eyebrow = models.CharField(max_length=80, blank=True, default="NEW COLLECTION")
    title = models.CharField(max_length=180)
    subtitle = models.TextField(blank=True, default="")
    image = models.ImageField(upload_to="home/heroes/")
    mobile_image = models.ImageField(upload_to="home/heroes/mobile/", blank=True, null=True)
    button_label = models.CharField(max_length=60, default="SHOP NOW")
    button_url = models.CharField(max_length=220, default="/shop")
    secondary_button_label = models.CharField(max_length=60, blank=True, default="EXPLORE COLLECTIONS")
    secondary_button_url = models.CharField(max_length=220, blank=True, default="/collections")
    text_color = models.CharField(max_length=7, default="#FFFFFF")
    button_background_color = models.CharField(max_length=7, default="#FFFFFF")
    button_text_color = models.CharField(max_length=7, default="#111111")
    overlay_color = models.CharField(max_length=7, default="#000000")
    background_position = models.CharField(max_length=40, default="center center")
    desktop_height = models.PositiveIntegerField(default=700, help_text="Hero height in pixels on desktop")
    mobile_height = models.PositiveIntegerField(default=650, help_text="Hero height in pixels on mobile")
    text_position = models.CharField(max_length=20, choices=[("left", "Left"), ("center", "Center"), ("right", "Right")], default="left")
    overlay_opacity = models.PositiveSmallIntegerField(default=18, help_text="0-80")
    sort_order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.title


class PromoBanner(models.Model):
    eyebrow = models.CharField(max_length=80, blank=True, default="")
    title = models.CharField(max_length=180)
    subtitle = models.TextField(blank=True, default="")
    image = models.ImageField(upload_to="home/promos/")
    button_label = models.CharField(max_length=60, blank=True, default="SHOP NOW")
    button_url = models.CharField(max_length=220, blank=True, default="/shop")
    text_color = models.CharField(max_length=7, default="#FFFFFF")
    button_background_color = models.CharField(max_length=7, default="#FFFFFF")
    button_text_color = models.CharField(max_length=7, default="#111111")
    overlay_color = models.CharField(max_length=7, default="#000000")
    overlay_opacity = models.PositiveSmallIntegerField(default=38, help_text="0-80")
    text_position = models.CharField(max_length=20, choices=[("left", "Left"), ("center", "Center"), ("right", "Right")], default="left")
    background_position = models.CharField(max_length=40, default="center center")
    desktop_height = models.PositiveIntegerField(default=650)
    mobile_height = models.PositiveIntegerField(default=560)
    placement = models.CharField(max_length=30, choices=[("home_mid", "Home / middle"), ("home_bottom", "Home / bottom"), ("shop", "Shop"), ("collection", "Collection")], default="home_mid")
    active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["placement", "sort_order", "id"]

    def __str__(self):
        return self.title


class EditorialBlock(models.Model):
    title = models.CharField(max_length=180)
    eyebrow = models.CharField(max_length=80, blank=True, default="")
    body = models.TextField(blank=True, default="")
    image = models.ImageField(upload_to="editorial/")
    button_label = models.CharField(max_length=60, blank=True, default="")
    button_url = models.CharField(max_length=220, blank=True, default="")
    placement = models.CharField(max_length=30, choices=[("home", "Home"), ("about", "About"), ("shop", "Shop")], default="home")
    image_side = models.CharField(max_length=10, choices=[("left", "Left"), ("right", "Right")], default="left")
    background_color = models.CharField(max_length=7, default="#111111")
    text_color = models.CharField(max_length=7, default="#FFFFFF")
    muted_text_color = models.CharField(max_length=7, default="#D4D4D0")
    image_position = models.CharField(max_length=40, default="center center")
    active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["placement", "sort_order", "id"]

    def __str__(self):
        return self.title


class StorefrontSection(models.Model):
    SECTION_CHOICES = [
        ("home_categories", "Home / Shop by category"),
        ("home_featured", "Home / Featured products"),
        ("home_feature_cards", "Home / Feature cards"),
        ("home_latest", "Home / Latest products"),
        ("home_story", "Home / Story"),
        ("home_services", "Home / Service benefits"),
        ("home_newsletter", "Home / Newsletter"),
    ]
    key = models.CharField(max_length=40, choices=SECTION_CHOICES, unique=True)
    eyebrow = models.CharField(max_length=100, blank=True, default="")
    title = models.CharField(max_length=180, blank=True, default="")
    body = models.TextField(blank=True, default="")
    button_label = models.CharField(max_length=80, blank=True, default="")
    button_url = models.CharField(max_length=220, blank=True, default="")
    background_color = models.CharField(max_length=7, default="#FFFFFF")
    text_color = models.CharField(max_length=7, default="#111111")
    active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Storefront section"
        verbose_name_plural = "Storefront sections"

    def __str__(self):
        return self.get_key_display()


class StoreBenefit(models.Model):
    ICON_CHOICES = [
        ("delivery", "Delivery"),
        ("returns", "Returns"),
        ("secure", "Secure checkout"),
        ("quality", "Quality"),
        ("support", "Support"),
    ]
    icon = models.CharField(max_length=20, choices=ICON_CHOICES, default="delivery")
    title = models.CharField(max_length=100)
    text = models.CharField(max_length=220, blank=True, default="")
    active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.title


class JournalPost(models.Model):
    title = models.CharField(max_length=180)
    slug = models.SlugField(max_length=190, unique=True)
    excerpt = models.TextField(blank=True, default="")
    body = models.TextField()
    cover_image = models.ImageField(upload_to="journal/")
    author_name = models.CharField(max_length=100, default="LE VAURÉ")
    published_at = models.DateTimeField(blank=True, null=True)
    active = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)

    class Meta:
        ordering = ["-published_at", "-id"]

    def __str__(self):
        return self.title


class CustomerAddress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    label = models.CharField(max_length=40, default="Home")
    full_name = models.CharField(max_length=160)
    phone = models.CharField(max_length=50)
    country = models.CharField(max_length=80, default="Armenia")
    region = models.CharField(max_length=120, blank=True, default="")
    city = models.CharField(max_length=120)
    street = models.CharField(max_length=255)
    apartment = models.CharField(max_length=120, blank=True, default="")
    postal_code = models.CharField(max_length=40, blank=True, default="")
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.label}"


class PasswordResetCode(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="password_reset_code")
    code_hash = models.CharField(max_length=200)
    expires_at = models.DateTimeField()
    attempts = models.PositiveIntegerField(default=0)
    last_sent_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Password reset for {self.user.email}"


class OrderVerificationCode(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="verification")
    code_hash = models.CharField(max_length=200)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(blank=True, null=True)
    attempts = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Order verification SW-{self.order_id:06d}"
