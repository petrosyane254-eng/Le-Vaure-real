from django.db import migrations, models


def seed_designer(apps, schema_editor):
    Section = apps.get_model("shop", "StorefrontSection")
    Benefit = apps.get_model("shop", "StoreBenefit")
    defaults = [
        ("home_categories", "DISCOVER", "SHOP BY CATEGORY", "", "SHOP ALL", "/shop", "#FFFFFF", "#111111", 10),
        ("home_featured", "LE VAURÉ ESSENTIALS", "BUILT FOR EVERY DAY", "", "VIEW ALL", "/shop", "#FFFFFF", "#111111", 20),
        ("home_feature_cards", "DISCOVER", "FEATURED STORIES", "", "", "", "#FFFFFF", "#111111", 30),
        ("home_latest", "MORE TO EXPLORE", "THE LATEST", "", "SHOP ALL", "/shop", "#F5F5F2", "#111111", 40),
        ("home_story", "CLOTHING WITH A PURPOSE", "DESIGNED TO MEAN SOMETHING", "LE VAURÉ brings Armenian identity into a clean, modern wardrobe.", "READ OUR STORY", "/about", "#111111", "#FFFFFF", 50),
        ("home_services", "", "", "", "", "", "#FFFFFF", "#111111", 60),
        ("home_newsletter", "LE VAURÉ COMMUNITY", "STAY CLOSE TO THE STORY.", "New drops, campaigns and special releases — straight to your inbox.", "JOIN US", "", "#F5F5F2", "#111111", 70),
    ]
    for key, eyebrow, title, body, label, url, bg, text, order in defaults:
        Section.objects.get_or_create(key=key, defaults={"eyebrow": eyebrow, "title": title, "body": body, "button_label": label, "button_url": url, "background_color": bg, "text_color": text, "sort_order": order})
    benefits = [
        ("delivery", "FREE DELIVERY", "Across Armenia on qualifying orders", 10),
        ("returns", "EASY RETURNS", "Simple returns within 14 days", 20),
        ("secure", "SECURE CHECKOUT", "Your information stays protected", 30),
        ("quality", "LE VAURÉ QUALITY", "Made to be worn again and again", 40),
    ]
    for icon, title, text, order in benefits:
        Benefit.objects.get_or_create(title=title, defaults={"icon": icon, "text": text, "sort_order": order})


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0012_nextjs_storefront"),
    ]

    operations = [
        migrations.AddField(model_name="sitesettings", name="page_background_color", field=models.CharField(default="#FFFFFF", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="soft_background_color", field=models.CharField(default="#F5F5F2", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="text_color", field=models.CharField(default="#111111", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="muted_text_color", field=models.CharField(default="#6F716E", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="border_color", field=models.CharField(default="#E8E8E5", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="announcement_background_color", field=models.CharField(default="#111111", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="announcement_text_color", field=models.CharField(default="#FFFFFF", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="header_background_color", field=models.CharField(default="#FFFFFF", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="header_text_color", field=models.CharField(default="#111111", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="footer_background_color", field=models.CharField(default="#111111", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="footer_text_color", field=models.CharField(default="#FFFFFF", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="button_background_color", field=models.CharField(default="#111111", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="button_text_color", field=models.CharField(default="#FFFFFF", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="button_hover_background_color", field=models.CharField(default="#0B2F26", max_length=7)),
        migrations.AddField(model_name="sitesettings", name="button_hover_text_color", field=models.CharField(default="#FFFFFF", max_length=7)),

        migrations.AddField(model_name="homeheroslide", name="secondary_button_label", field=models.CharField(blank=True, default="EXPLORE COLLECTIONS", max_length=60)),
        migrations.AddField(model_name="homeheroslide", name="secondary_button_url", field=models.CharField(blank=True, default="/collections", max_length=220)),
        migrations.AddField(model_name="homeheroslide", name="text_color", field=models.CharField(default="#FFFFFF", max_length=7)),
        migrations.AddField(model_name="homeheroslide", name="button_background_color", field=models.CharField(default="#FFFFFF", max_length=7)),
        migrations.AddField(model_name="homeheroslide", name="button_text_color", field=models.CharField(default="#111111", max_length=7)),
        migrations.AddField(model_name="homeheroslide", name="overlay_color", field=models.CharField(default="#000000", max_length=7)),
        migrations.AddField(model_name="homeheroslide", name="background_position", field=models.CharField(default="center center", max_length=40)),
        migrations.AddField(model_name="homeheroslide", name="desktop_height", field=models.PositiveIntegerField(default=700, help_text="Hero height in pixels on desktop")),
        migrations.AddField(model_name="homeheroslide", name="mobile_height", field=models.PositiveIntegerField(default=650, help_text="Hero height in pixels on mobile")),

        migrations.AddField(model_name="promobanner", name="eyebrow", field=models.CharField(blank=True, default="", max_length=80)),
        migrations.AddField(model_name="promobanner", name="text_color", field=models.CharField(default="#FFFFFF", max_length=7)),
        migrations.AddField(model_name="promobanner", name="button_background_color", field=models.CharField(default="#FFFFFF", max_length=7)),
        migrations.AddField(model_name="promobanner", name="button_text_color", field=models.CharField(default="#111111", max_length=7)),
        migrations.AddField(model_name="promobanner", name="overlay_color", field=models.CharField(default="#000000", max_length=7)),
        migrations.AddField(model_name="promobanner", name="overlay_opacity", field=models.PositiveSmallIntegerField(default=38, help_text="0-80")),
        migrations.AddField(model_name="promobanner", name="text_position", field=models.CharField(choices=[("left", "Left"), ("center", "Center"), ("right", "Right")], default="left", max_length=20)),
        migrations.AddField(model_name="promobanner", name="background_position", field=models.CharField(default="center center", max_length=40)),
        migrations.AddField(model_name="promobanner", name="desktop_height", field=models.PositiveIntegerField(default=650)),
        migrations.AddField(model_name="promobanner", name="mobile_height", field=models.PositiveIntegerField(default=560)),

        migrations.AddField(model_name="editorialblock", name="background_color", field=models.CharField(default="#111111", max_length=7)),
        migrations.AddField(model_name="editorialblock", name="text_color", field=models.CharField(default="#FFFFFF", max_length=7)),
        migrations.AddField(model_name="editorialblock", name="muted_text_color", field=models.CharField(default="#D4D4D0", max_length=7)),
        migrations.AddField(model_name="editorialblock", name="image_position", field=models.CharField(default="center center", max_length=40)),

        migrations.CreateModel(
            name="StorefrontSection",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(choices=[("home_categories", "Home / Shop by category"), ("home_featured", "Home / Featured products"), ("home_feature_cards", "Home / Feature cards"), ("home_latest", "Home / Latest products"), ("home_story", "Home / Story"), ("home_services", "Home / Service benefits"), ("home_newsletter", "Home / Newsletter")], max_length=40, unique=True)),
                ("eyebrow", models.CharField(blank=True, default="", max_length=100)),
                ("title", models.CharField(blank=True, default="", max_length=180)),
                ("body", models.TextField(blank=True, default="")),
                ("button_label", models.CharField(blank=True, default="", max_length=80)),
                ("button_url", models.CharField(blank=True, default="", max_length=220)),
                ("background_color", models.CharField(default="#FFFFFF", max_length=7)),
                ("text_color", models.CharField(default="#111111", max_length=7)),
                ("active", models.BooleanField(default=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
            ],
            options={"verbose_name": "Storefront section", "verbose_name_plural": "Storefront sections", "ordering": ["sort_order", "id"]},
        ),
        migrations.CreateModel(
            name="StoreBenefit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("icon", models.CharField(choices=[("delivery", "Delivery"), ("returns", "Returns"), ("secure", "Secure checkout"), ("quality", "Quality"), ("support", "Support")], default="delivery", max_length=20)),
                ("title", models.CharField(max_length=100)),
                ("text", models.CharField(blank=True, default="", max_length=220)),
                ("active", models.BooleanField(default=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
            ],
            options={"ordering": ["sort_order", "id"]},
        ),
        migrations.RunPython(seed_designer, migrations.RunPython.noop),
    ]
