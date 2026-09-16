from django.db import migrations, models


def seed_full_designer(apps, schema_editor):
    Shop = apps.get_model('shop', 'ShopPageSettings')
    PageSection = apps.get_model('shop', 'PageSection')
    Shop.objects.get_or_create(id=1)
    defaults = [
        ('about', 'hero', 'OUR STORY', 'CLOTHING WITH A PURPOSE', 'LE VAURÉ brings Armenian identity into a clean, modern wardrobe.', 'banner', 10, '#111111', '#FFFFFF'),
        ('about', 'values', 'OUR VALUES', 'MADE TO MEAN SOMETHING', 'Thoughtful design, cultural memory and everyday wearability.', 'text', 20, '#FFFFFF', '#111111'),
        ('account', 'hero', 'MY LE VAURÉ', 'ACCOUNT', 'Orders, addresses and saved pieces in one place.', 'text', 10, '#F5F5F2', '#111111'),
        ('collections', 'hero', 'DISCOVER', 'COLLECTIONS', 'Explore LE VAURÉ stories, graphics and seasonal edits.', 'text', 10, '#F5F5F2', '#111111'),
        ('collections', 'story', 'EDITORIAL', 'WEAR THE STORY', 'Collections shaped by Armenian places, memory and modern life.', 'image_right', 30, '#111111', '#FFFFFF'),
        ('journal', 'hero', 'STORIES', 'JOURNAL', 'Campaigns, people and ideas behind LE VAURÉ.', 'text', 10, '#F5F5F2', '#111111'),
        ('wishlist', 'hero', 'SAVED FOR LATER', 'MY WISHLIST', 'Keep your favorite pieces close.', 'text', 10, '#FFFFFF', '#111111'),
        ('cart', 'hero', 'YOUR BAG', 'SHOPPING CART', 'Review your pieces before checkout.', 'text', 10, '#FFFFFF', '#111111'),
        ('checkout', 'hero', 'SECURE CHECKOUT', 'CHECKOUT', 'Shipping details and order review.', 'text', 10, '#FFFFFF', '#111111'),
    ]
    for page, key, eyebrow, title, body, layout, order, bg, text in defaults:
        PageSection.objects.get_or_create(
            page=page, key=key,
            defaults={
                'eyebrow': eyebrow, 'title': title, 'body': body,
                'layout': layout, 'sort_order': order,
                'background_color': bg, 'text_color': text,
            },
        )


class Migration(migrations.Migration):
    dependencies = [('shop', '0013_storefront_designer')]

    operations = [
        migrations.AddField(model_name='sitesettings', name='footer_shop_title', field=models.CharField(default='SHOP', max_length=80)),
        migrations.AddField(model_name='sitesettings', name='footer_help_title', field=models.CharField(default='HELP', max_length=80)),
        migrations.AddField(model_name='sitesettings', name='footer_company_title', field=models.CharField(default='COMPANY', max_length=80)),
        migrations.AddField(model_name='sitesettings', name='footer_payment_title', field=models.CharField(default='WE ACCEPT', max_length=80)),
        migrations.AddField(model_name='sitesettings', name='footer_payment_labels', field=models.CharField(default='VISA,MC,Idram,Telcell', help_text='Comma-separated labels', max_length=240)),
        migrations.AddField(model_name='sitesettings', name='footer_copyright_text', field=models.CharField(blank=True, default='LE VAURÉ. All rights reserved.', max_length=220)),
        migrations.AddField(model_name='sitesettings', name='product_card_image_ratio', field=models.CharField(default='4 / 5', help_text='CSS aspect-ratio, e.g. 4 / 5 or 1 / 1', max_length=20)),
        migrations.AddField(model_name='sitesettings', name='product_card_radius', field=models.PositiveIntegerField(default=0, help_text='Product image/card corner radius in pixels')),
        migrations.AddField(model_name='sitesettings', name='product_grid_gap', field=models.PositiveIntegerField(default=24, help_text='Gap between product cards in pixels')),
        migrations.CreateModel(
            name='ShopPageSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(default='SHOP T-SHIRTS', max_length=160)),
                ('eyebrow', models.CharField(blank=True, default='SHOP', max_length=100)),
                ('subtitle', models.CharField(blank=True, default='Premium pieces inspired by Armenia, people and places.', max_length=260)),
                ('breadcrumb_home_label', models.CharField(default='Home', max_length=60)),
                ('search_placeholder', models.CharField(default='Search products...', max_length=120)),
                ('category_heading', models.CharField(default='CATEGORY', max_length=80)),
                ('size_heading', models.CharField(default='SIZE', max_length=80)),
                ('color_heading', models.CharField(default='COLOR', max_length=80)),
                ('price_heading', models.CharField(default='PRICE', max_length=80)),
                ('clear_filters_label', models.CharField(default='CLEAR FILTERS', max_length=80)),
                ('all_products_label', models.CharField(default='All Products', max_length=80)),
                ('empty_text', models.CharField(default='No products found.', max_length=160)),
                ('loading_text', models.CharField(default='Loading collection…', max_length=160)),
                ('show_sidebar', models.BooleanField(default=True)),
                ('show_search', models.BooleanField(default=True)),
                ('show_category_filter', models.BooleanField(default=True)),
                ('show_size_filter', models.BooleanField(default=True)),
                ('show_color_filter', models.BooleanField(default=True)),
                ('show_price_filter', models.BooleanField(default=True)),
                ('products_per_row', models.PositiveSmallIntegerField(default=3, help_text='Desktop columns, recommended 2-4')),
                ('hero_background_color', models.CharField(default='#F5F5F2', max_length=7)),
                ('hero_text_color', models.CharField(default='#111111', max_length=7)),
                ('sidebar_background_color', models.CharField(default='#FFFFFF', max_length=7)),
                ('card_background_color', models.CharField(default='#FFFFFF', max_length=7)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'verbose_name': 'Shop page settings', 'verbose_name_plural': 'Shop page settings'},
        ),
        migrations.CreateModel(
            name='PageSection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('page', models.CharField(choices=[('about','About'),('account','Account'),('collections','Collections'),('shop','Shop'),('journal','Journal'),('wishlist','Wishlist'),('cart','Cart'),('checkout','Checkout')], max_length=30)),
                ('key', models.SlugField(help_text='Stable section key, e.g. hero, story, values, support', max_length=80)),
                ('eyebrow', models.CharField(blank=True, default='', max_length=100)),
                ('title', models.CharField(blank=True, default='', max_length=180)),
                ('body', models.TextField(blank=True, default='')),
                ('image', models.ImageField(blank=True, null=True, upload_to='pages/sections/')),
                ('button_label', models.CharField(blank=True, default='', max_length=80)),
                ('button_url', models.CharField(blank=True, default='', max_length=220)),
                ('background_color', models.CharField(default='#FFFFFF', max_length=7)),
                ('text_color', models.CharField(default='#111111', max_length=7)),
                ('muted_text_color', models.CharField(default='#6F716E', max_length=7)),
                ('button_background_color', models.CharField(default='#111111', max_length=7)),
                ('button_text_color', models.CharField(default='#FFFFFF', max_length=7)),
                ('layout', models.CharField(choices=[('text','Text only'),('image_left','Image left'),('image_right','Image right'),('banner','Full-width banner'),('cards','Card section')], default='text', max_length=20)),
                ('image_position', models.CharField(default='center center', max_length=40)),
                ('min_height', models.PositiveIntegerField(default=0, help_text='0 = automatic height')),
                ('active', models.BooleanField(default=True)),
                ('sort_order', models.PositiveIntegerField(default=0)),
            ],
            options={'ordering': ['page','sort_order','id'], 'verbose_name': 'Page section', 'verbose_name_plural': 'Page sections'},
        ),
        migrations.AddConstraint(model_name='pagesection', constraint=models.UniqueConstraint(fields=('page','key'), name='unique_page_section_key')),
        migrations.RunPython(seed_full_designer, migrations.RunPython.noop),
    ]
