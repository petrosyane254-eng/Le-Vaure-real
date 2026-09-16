from django.core.management.base import BaseCommand
from shop.models import SiteSettings, NavigationItem, ProductColor, ProductSize


class Command(BaseCommand):
    help = "Create safe default storefront settings, navigation, colors and sizes."

    def handle(self, *args, **options):
        SiteSettings.objects.get_or_create(pk=1)

        nav = [
            ("SHOP", "/shop", "header", 10),
            ("COLLECTIONS", "/collections", "header", 20),
            ("ABOUT", "/about", "header", 30),
            ("JOURNAL", "/journal", "header", 40),
            ("All products", "/shop", "footer_shop", 10),
            ("Collections", "/collections", "footer_shop", 20),
            ("My account", "/account", "footer_help", 10),
            ("Wishlist", "/wishlist", "footer_help", 20),
            ("About us", "/about", "footer_company", 10),
            ("Journal", "/journal", "footer_company", 20),
        ]
        for label, url, location, order in nav:
            NavigationItem.objects.get_or_create(
                label=label,
                location=location,
                defaults={"url": url, "sort_order": order, "active": True},
            )

        for name, hex_code, order in [
            ("Black", "#111111", 10),
            ("Premium Green", "#0B2F26", 20),
            ("Cream", "#E8E2D5", 30),
            ("White", "#FFFFFF", 40),
        ]:
            ProductColor.objects.get_or_create(name=name, defaults={"hex_code": hex_code, "sort_order": order})

        for order, name in enumerate(["XS", "S", "M", "L", "XL", "XXL"], start=1):
            ProductSize.objects.get_or_create(name=name, defaults={"sort_order": order * 10})

        self.stdout.write(self.style.SUCCESS("Next.js storefront defaults are ready."))
