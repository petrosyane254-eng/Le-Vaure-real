import json
import secrets
from decimal import Decimal, InvalidOperation
from datetime import timedelta

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Q, Min, Max
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST, require_http_methods

from .models import (
    Product, ProductImage, ProductVariant, Collection, SiteSettings,
    NavigationItem, HomeHeroSlide, PromoBanner, EditorialBlock, StorefrontSection, StoreBenefit,
    ShopPageSettings, PageSection, JournalPost,
    Wishlist, CustomerAddress, PasswordResetCode, Order, OrderItem,
    OrderVerificationCode,
)


def _body(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}


def _image_url(request, field):
    try:
        if field and field.url:
            return request.build_absolute_uri(field.url)
    except (ValueError, AttributeError):
        pass
    return ""


def _money(value):
    return str(value if value is not None else Decimal("0"))


def _site_settings():
    obj = SiteSettings.objects.first()
    if obj is None:
        obj = SiteSettings.objects.create()
    return obj


def _settings_json(obj):
    return {
        "brandName": obj.brand_name,
        "brandTagline": obj.brand_tagline,
        "primaryColor": obj.primary_color,
        "accentColor": obj.accent_color,
        "pageBackgroundColor": obj.page_background_color,
        "softBackgroundColor": obj.soft_background_color,
        "textColor": obj.text_color,
        "mutedTextColor": obj.muted_text_color,
        "borderColor": obj.border_color,
        "announcementBackgroundColor": obj.announcement_background_color,
        "announcementTextColor": obj.announcement_text_color,
        "headerBackgroundColor": obj.header_background_color,
        "headerTextColor": obj.header_text_color,
        "footerBackgroundColor": obj.footer_background_color,
        "footerTextColor": obj.footer_text_color,
        "buttonBackgroundColor": obj.button_background_color,
        "buttonTextColor": obj.button_text_color,
        "buttonHoverBackgroundColor": obj.button_hover_background_color,
        "buttonHoverTextColor": obj.button_hover_text_color,
        "announcement": obj.announcement,
        "supportEmail": obj.support_email,
        "supportPhone": obj.support_phone,
        "instagramUrl": obj.instagram_url,
        "facebookUrl": obj.facebook_url,
        "tiktokUrl": obj.tiktok_url,
        "footerNote": obj.footer_note,
        "footerShopTitle": obj.footer_shop_title,
        "footerHelpTitle": obj.footer_help_title,
        "footerCompanyTitle": obj.footer_company_title,
        "footerPaymentTitle": obj.footer_payment_title,
        "footerPaymentLabels": [x.strip() for x in obj.footer_payment_labels.split(",") if x.strip()],
        "footerCopyrightText": obj.footer_copyright_text,
        "productCardImageRatio": obj.product_card_image_ratio,
        "productCardRadius": obj.product_card_radius,
        "productGridGap": obj.product_grid_gap,
        "shippingText": obj.default_shipping_text,
        "returnsText": obj.default_returns_text,
    }


def _product_json(request, product, detailed=False):
    variants = list(
        product.variants.filter(active=True)
        .select_related("color", "size")
        .order_by("color__sort_order", "size__sort_order", "id")
    )
    gallery = [_image_url(request, product.image)] if product.image else []
    gallery += [
        _image_url(request, img.image)
        for img in product.images.all()
        if img.image
    ]
    gallery = [x for x in dict.fromkeys(gallery) if x]

    data = {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "price": _money(product.price),
        "image": gallery[0] if gallery else "",
        "gallery": gallery,
        "stock": sum(v.stock for v in variants) if variants else product.stock,
        "featured": product.featured,
        "category": {
            "name": product.category.name,
            "slug": product.category.slug,
        } if product.category_id else None,
    }
    if detailed:
        data["variants"] = [
            {
                "id": v.id,
                "sku": v.sku,
                "color": {
                    "id": v.color_id,
                    "name": v.color.name,
                    "hex": v.color.hex_code,
                },
                "size": {
                    "id": v.size_id,
                    "name": v.size.name,
                },
                "stock": v.stock,
                "price": _money(v.effective_price),
                "image": _image_url(request, v.image),
                "available": v.stock > 0,
            }
            for v in variants
        ]
    return data


def _cart(request):
    cart = request.session.get("next_cart")
    if not isinstance(cart, dict):
        cart = {}
    return cart


def _cart_payload(request):
    cart = _cart(request)
    ids = [int(k) for k in cart.keys() if str(k).isdigit()]
    variants = {
        v.id: v
        for v in ProductVariant.objects.filter(id__in=ids, active=True)
        .select_related("product", "product__category", "color", "size")
    }
    items = []
    total = Decimal("0")
    count = 0
    stale = []
    for key, qty_raw in cart.items():
        if not str(key).isdigit():
            stale.append(key)
            continue
        variant = variants.get(int(key))
        if variant is None:
            stale.append(key)
            continue
        try:
            qty = max(1, min(int(qty_raw), variant.stock))
        except (TypeError, ValueError):
            qty = 1
        if variant.stock <= 0:
            stale.append(key)
            continue
        line = variant.effective_price * qty
        total += line
        count += qty
        items.append({
            "variantId": variant.id,
            "quantity": qty,
            "lineTotal": _money(line),
            "product": _product_json(request, variant.product),
            "variant": {
                "id": variant.id,
                "color": variant.color.name,
                "colorHex": variant.color.hex_code,
                "size": variant.size.name,
                "stock": variant.stock,
                "price": _money(variant.effective_price),
                "image": _image_url(request, variant.image),
            },
        })
    if stale:
        for key in stale:
            cart.pop(str(key), None)
        request.session["next_cart"] = cart
        request.session.modified = True
    return {"items": items, "count": count, "total": _money(total)}


@ensure_csrf_cookie
@require_GET
def csrf(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_GET
def bootstrap(request):
    settings = _site_settings()
    nav = list(NavigationItem.objects.filter(active=True).order_by("location", "sort_order", "id"))
    grouped = {}
    for item in nav:
        grouped.setdefault(item.location, []).append({
            "label": item.label,
            "url": item.url,
            "newTab": item.open_new_tab,
        })
    shop = ShopPageSettings.objects.first()
    shop_json = {
        "eyebrow": shop.eyebrow, "title": shop.title, "subtitle": shop.subtitle,
        "breadcrumbHomeLabel": shop.breadcrumb_home_label,
        "searchPlaceholder": shop.search_placeholder,
        "categoryHeading": shop.category_heading, "sizeHeading": shop.size_heading,
        "colorHeading": shop.color_heading, "priceHeading": shop.price_heading,
        "clearFiltersLabel": shop.clear_filters_label, "allProductsLabel": shop.all_products_label,
        "emptyText": shop.empty_text, "loadingText": shop.loading_text,
        "showSidebar": shop.show_sidebar, "showSearch": shop.show_search,
        "showCategoryFilter": shop.show_category_filter, "showSizeFilter": shop.show_size_filter,
        "showColorFilter": shop.show_color_filter, "showPriceFilter": shop.show_price_filter,
        "productsPerRow": shop.products_per_row,
        "heroBackgroundColor": shop.hero_background_color, "heroTextColor": shop.hero_text_color,
        "sidebarBackgroundColor": shop.sidebar_background_color, "cardBackgroundColor": shop.card_background_color,
    } if shop else {}
    page_sections = {}
    for x in PageSection.objects.filter(active=True).order_by("page", "sort_order", "id"):
        page_sections.setdefault(x.page, []).append({
            "key": x.key, "eyebrow": x.eyebrow, "title": x.title, "body": x.body,
            "image": _image_url(request, x.image), "buttonLabel": x.button_label, "buttonUrl": x.button_url,
            "backgroundColor": x.background_color, "textColor": x.text_color,
            "mutedTextColor": x.muted_text_color, "buttonBackgroundColor": x.button_background_color,
            "buttonTextColor": x.button_text_color, "layout": x.layout,
            "imagePosition": x.image_position, "minHeight": x.min_height, "sortOrder": x.sort_order,
        })
    return JsonResponse({
        "settings": _settings_json(settings),
        "navigation": grouped,
        "shop": shop_json,
        "pageSections": page_sections,
        "user": {
            "authenticated": request.user.is_authenticated,
            "username": request.user.username if request.user.is_authenticated else "",
            "email": request.user.email if request.user.is_authenticated else "",
        },
        "cartCount": _cart_payload(request)["count"],
        "wishlistCount": Wishlist.objects.filter(user=request.user).count() if request.user.is_authenticated else 0,
    })


@require_GET
def home(request):
    heroes = [
        {
            "id": x.id,
            "eyebrow": x.eyebrow,
            "title": x.title,
            "subtitle": x.subtitle,
            "image": _image_url(request, x.image),
            "mobileImage": _image_url(request, x.mobile_image),
            "buttonLabel": x.button_label,
            "buttonUrl": x.button_url,
            "secondaryButtonLabel": x.secondary_button_label,
            "secondaryButtonUrl": x.secondary_button_url,
            "textColor": x.text_color,
            "buttonBackgroundColor": x.button_background_color,
            "buttonTextColor": x.button_text_color,
            "overlayColor": x.overlay_color,
            "backgroundPosition": x.background_position,
            "desktopHeight": x.desktop_height,
            "mobileHeight": x.mobile_height,
            "textPosition": x.text_position,
            "overlayOpacity": x.overlay_opacity,
        }
        for x in HomeHeroSlide.objects.filter(active=True).order_by("sort_order", "id")
    ]
    promos = [
        {
            "id": x.id,
            "eyebrow": x.eyebrow,
            "title": x.title,
            "subtitle": x.subtitle,
            "image": _image_url(request, x.image),
            "buttonLabel": x.button_label,
            "buttonUrl": x.button_url,
            "textColor": x.text_color,
            "buttonBackgroundColor": x.button_background_color,
            "buttonTextColor": x.button_text_color,
            "overlayColor": x.overlay_color,
            "overlayOpacity": x.overlay_opacity,
            "textPosition": x.text_position,
            "backgroundPosition": x.background_position,
            "desktopHeight": x.desktop_height,
            "mobileHeight": x.mobile_height,
            "placement": x.placement,
        }
        for x in PromoBanner.objects.filter(active=True, placement__startswith="home").order_by("placement", "sort_order", "id")
    ]
    editorials = [
        {
            "id": x.id,
            "eyebrow": x.eyebrow,
            "title": x.title,
            "body": x.body,
            "image": _image_url(request, x.image),
            "buttonLabel": x.button_label,
            "buttonUrl": x.button_url,
            "placement": x.placement,
            "imageSide": x.image_side,
            "backgroundColor": x.background_color,
            "textColor": x.text_color,
            "mutedTextColor": x.muted_text_color,
            "imagePosition": x.image_position,
        }
        for x in EditorialBlock.objects.filter(active=True, placement="home").order_by("sort_order", "id")
    ]
    collections = [
        {
            "name": x.name,
            "slug": x.slug,
            "subtitle": x.subtitle,
            "image": _image_url(request, x.image),
        }
        for x in Collection.objects.filter(active=True, featured=True).order_by("sort_order", "name")[:8]
    ]
    products = [
        _product_json(request, p)
        for p in Product.objects.filter(active=True, featured=True)
        .select_related("category").prefetch_related("images", "variants")[:8]
    ]
    journal = [
        {
            "title": p.title,
            "slug": p.slug,
            "excerpt": p.excerpt,
            "coverImage": _image_url(request, p.cover_image),
            "publishedAt": p.published_at.isoformat() if p.published_at else None,
        }
        for p in JournalPost.objects.filter(active=True).order_by("-featured", "-published_at", "-id")[:4]
    ]
    sections = {
        x.key: {
            "key": x.key,
            "eyebrow": x.eyebrow,
            "title": x.title,
            "body": x.body,
            "buttonLabel": x.button_label,
            "buttonUrl": x.button_url,
            "backgroundColor": x.background_color,
            "textColor": x.text_color,
            "active": x.active,
            "sortOrder": x.sort_order,
        }
        for x in StorefrontSection.objects.all().order_by("sort_order", "id")
    }
    benefits = [
        {"id": x.id, "icon": x.icon, "title": x.title, "text": x.text}
        for x in StoreBenefit.objects.filter(active=True).order_by("sort_order", "id")
    ]
    return JsonResponse({
        "heroes": heroes,
        "promos": promos,
        "editorials": editorials,
        "collections": collections,
        "featuredProducts": products,
        "journal": journal,
        "sections": sections,
        "benefits": benefits,
    })


@require_GET
def editorial_blocks(request, placement):
    rows = EditorialBlock.objects.filter(active=True, placement=placement).order_by("sort_order", "id")
    return JsonResponse({"results": [{
        "id": x.id, "eyebrow": x.eyebrow, "title": x.title, "body": x.body,
        "image": _image_url(request, x.image), "buttonLabel": x.button_label,
        "buttonUrl": x.button_url, "imageSide": x.image_side,
        "backgroundColor": x.background_color, "textColor": x.text_color,
        "mutedTextColor": x.muted_text_color, "imagePosition": x.image_position,
    } for x in rows]})


@require_GET
def products(request):
    qs = Product.objects.filter(active=True).select_related("category").prefetch_related("images", "variants__color", "variants__size")
    q = request.GET.get("q", "").strip()
    category = request.GET.get("category", "").strip()
    collection = request.GET.get("collection", "").strip()
    color = request.GET.get("color", "").strip()
    size = request.GET.get("size", "").strip()
    if q:
        qs = qs.filter(Q(name__icontains=q) | Q(description__icontains=q))
    if category:
        qs = qs.filter(category__slug=category)
    if collection:
        qs = qs.filter(collections__slug=collection)
    if color:
        qs = qs.filter(variants__color__name__iexact=color, variants__active=True)
    if size:
        qs = qs.filter(variants__size__name__iexact=size, variants__active=True)
    try:
        min_price = Decimal(request.GET.get("min_price", ""))
        qs = qs.filter(price__gte=min_price)
    except (InvalidOperation, TypeError):
        pass
    try:
        max_price = Decimal(request.GET.get("max_price", ""))
        qs = qs.filter(price__lte=max_price)
    except (InvalidOperation, TypeError):
        pass
    sort = request.GET.get("sort", "new")
    ordering = {
        "price_asc": "price",
        "price_desc": "-price",
        "name": "name",
        "new": "-created_at",
    }.get(sort, "-created_at")
    qs = qs.order_by(ordering).distinct()
    data = [_product_json(request, p) for p in qs]
    return JsonResponse({"results": data, "count": len(data)})


@require_GET
def product_detail(request, slug):
    p = get_object_or_404(
        Product.objects.filter(active=True).select_related("category").prefetch_related("images", "variants__color", "variants__size"),
        slug=slug,
    )
    data = _product_json(request, p, detailed=True)
    data["wishlisted"] = Wishlist.objects.filter(user=request.user, product=p).exists() if request.user.is_authenticated else False
    return JsonResponse(data)


@require_GET
def collections_list(request):
    rows = Collection.objects.filter(active=True).order_by("sort_order", "name")
    return JsonResponse({"results": [{
        "name": x.name, "slug": x.slug, "subtitle": x.subtitle,
        "description": x.description, "image": _image_url(request, x.image),
        "featured": x.featured,
    } for x in rows]})


@require_GET
def collection_detail(request, slug):
    collection = get_object_or_404(Collection, slug=slug, active=True)
    products_qs = collection.products.filter(active=True).select_related("category").prefetch_related("images", "variants")
    return JsonResponse({
        "collection": {
            "name": collection.name,
            "slug": collection.slug,
            "subtitle": collection.subtitle,
            "description": collection.description,
            "image": _image_url(request, collection.image),
        },
        "products": [_product_json(request, p) for p in products_qs],
    })


@require_GET
def journal_list(request):
    rows = JournalPost.objects.filter(active=True, published_at__lte=timezone.now()).order_by("-featured", "-published_at")
    return JsonResponse({"results": [{
        "title": x.title, "slug": x.slug, "excerpt": x.excerpt,
        "coverImage": _image_url(request, x.cover_image), "author": x.author_name,
        "publishedAt": x.published_at.isoformat() if x.published_at else None,
    } for x in rows]})


@require_GET
def journal_detail(request, slug):
    x = get_object_or_404(JournalPost, slug=slug, active=True)
    return JsonResponse({
        "title": x.title, "slug": x.slug, "excerpt": x.excerpt, "body": x.body,
        "coverImage": _image_url(request, x.cover_image), "author": x.author_name,
        "publishedAt": x.published_at.isoformat() if x.published_at else None,
    })


def _verification_email_html(code, first_name, email):
    display_name = first_name or "there"

    return f"""
    <!doctype html>
    <html>
    <body style="margin:0;padding:0;background:#f3f1ec;font-family:Arial,Helvetica,sans-serif;color:#111111;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
             style="width:100%;background:#f3f1ec;">
        <tr>
          <td align="center" style="padding:40px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                   style="max-width:620px;background:#ffffff;border:1px solid #e7e1d7;border-radius:18px;overflow:hidden;">
              <tr>
                <td align="center" style="background:#111111;padding:36px 24px;">
                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.1;
                              letter-spacing:5px;color:#ffffff;">
                    LE VAURÉ
                  </div>
                  <div style="margin-top:11px;font-size:10px;letter-spacing:3px;color:#c8b58e;">
                    PRIVATE ACCESS
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding:46px 42px 18px 42px;">
                  <div style="font-size:11px;letter-spacing:2.4px;color:#927f5d;margin-bottom:16px;">
                    EMAIL VERIFICATION
                  </div>

                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.25;
                              color:#111111;margin-bottom:18px;">
                    Welcome, {display_name}.
                  </div>

                  <div style="font-size:15px;line-height:1.75;color:#626262;">
                    Use the verification code below to confirm
                    <strong style="color:#111111;">{email}</strong>
                    and complete your LE VAURÉ account.
                  </div>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding:22px 42px 30px 42px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td align="center"
                          style="background:#f8f5ef;border:1px solid #ded4c3;border-radius:14px;padding:24px 34px;">
                        <div style="font-size:10px;letter-spacing:2.4px;color:#927f5d;margin-bottom:12px;">
                          YOUR VERIFICATION CODE
                        </div>
                        <div style="font-family:'Courier New',monospace;font-size:38px;font-weight:700;
                                    letter-spacing:8px;color:#111111;">
                          {code}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 42px 42px 42px;">
                  <div style="font-size:13px;line-height:1.75;color:#777777;">
                    This code expires in <strong style="color:#111111;">15 minutes</strong>.
                  </div>
                  <div style="margin-top:8px;font-size:13px;line-height:1.75;color:#777777;">
                    If you did not request this account, you can safely ignore this email.
                  </div>
                </td>
              </tr>

              <tr>
                <td style="border-top:1px solid #eee9e1;padding:26px 42px 30px 42px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="font-family:Georgia,'Times New Roman',serif;font-size:14px;
                                 letter-spacing:2px;color:#111111;">
                        LE VAURÉ
                      </td>
                      <td align="right" style="font-size:11px;color:#999999;">
                        Secure account verification
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <div style="max-width:620px;margin:18px auto 0 auto;font-size:10px;
                        line-height:1.6;color:#999999;text-align:center;">
              This is an automated security email from LE VAURÉ.
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """


def _send_registration_code(email, first_name, code):
    send_mail(
        "Your LE VAURÉ verification code",
        (
            f"Your verification code is {code}. "
            "It expires in 15 minutes."
        ),
        None,
        [email],
        fail_silently=False,
        html_message=_verification_email_html(
            code,
            first_name,
            email,
        ),
    )


@csrf_protect
@require_POST
def register(request):
    data = _body(request)
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    first_name = str(data.get("firstName", "")).strip()
    last_name = str(data.get("lastName", "")).strip()

    if not email or "@" not in email:
        return JsonResponse(
            {"error": "Enter a valid email."},
            status=400,
        )

    if len(password) < 8:
        return JsonResponse(
            {"error": "Password must be at least 8 characters."},
            status=400,
        )

    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse(
            {"error": "An account with this email already exists."},
            status=400,
        )

    code = f"{secrets.randbelow(1000000):06d}"
    now = timezone.now()

    pending = {
        "email": email,
        "password_hash": make_password(password),
        "first_name": first_name,
        "last_name": last_name,
        "code_hash": make_password(code),
        "expires_at": (
            now + timedelta(minutes=15)
        ).isoformat(),
        "attempts": 0,
        "last_sent_at": now.isoformat(),
    }

    try:
        _send_registration_code(
            email,
            first_name,
            code,
        )
    except Exception as exc:
        print("VERIFICATION EMAIL ERROR:", repr(exc))
        return JsonResponse(
            {
                "error": (
                    f"Could not send verification email: {exc}"
                )
            },
            status=500,
        )

    # Account is still NOT created here.
    request.session["pending_registration"] = pending
    request.session.modified = True

    return JsonResponse(
        {
            "ok": True,
            "message": "Verification code sent.",
            "email": email,
        }
    )


@csrf_protect
@require_POST
def resend_verification(request):
    pending = request.session.get("pending_registration")

    if not isinstance(pending, dict):
        return JsonResponse(
            {
                "error": (
                    "Verification session expired. "
                    "Please create your account again."
                )
            },
            status=400,
        )

    email = str(pending.get("email", "")).strip().lower()
    first_name = str(
        pending.get("first_name", "")
    ).strip()

    if not email:
        request.session.pop("pending_registration", None)
        request.session.modified = True
        return JsonResponse(
            {"error": "Verification session is invalid."},
            status=400,
        )

    if User.objects.filter(email__iexact=email).exists():
        request.session.pop("pending_registration", None)
        request.session.modified = True
        return JsonResponse(
            {"error": "An account with this email already exists."},
            status=400,
        )

    now = timezone.now()
    last_sent_raw = str(
        pending.get("last_sent_at", "")
    ).strip()

    if last_sent_raw:
        try:
            last_sent_at = timezone.datetime.fromisoformat(
                last_sent_raw
            )
            if timezone.is_naive(last_sent_at):
                last_sent_at = timezone.make_aware(
                    last_sent_at
                )

            elapsed = (
                now - last_sent_at
            ).total_seconds()

            if elapsed < 30:
                retry_after = max(
                    1,
                    int(30 - elapsed),
                )
                return JsonResponse(
                    {
                        "error": (
                            "Please wait before requesting "
                            "another code."
                        ),
                        "retryAfter": retry_after,
                    },
                    status=429,
                )
        except (TypeError, ValueError):
            pass

    code = f"{secrets.randbelow(1000000):06d}"

    try:
        _send_registration_code(
            email,
            first_name,
            code,
        )
    except Exception as exc:
        print("RESEND VERIFICATION ERROR:", repr(exc))
        return JsonResponse(
            {
                "error": (
                    f"Could not resend verification email: "
                    f"{exc}"
                )
            },
            status=500,
        )

    pending["code_hash"] = make_password(code)
    pending["expires_at"] = (
        now + timedelta(minutes=15)
    ).isoformat()
    pending["attempts"] = 0
    pending["last_sent_at"] = now.isoformat()

    request.session["pending_registration"] = pending
    request.session.modified = True

    return JsonResponse(
        {
            "ok": True,
            "message": "A new verification code was sent.",
            "email": email,
        }
    )


@csrf_protect
@require_POST
def verify_email(request):
    data = _body(request)
    code = str(data.get("code", "")).strip()

    pending = request.session.get("pending_registration")
    if not isinstance(pending, dict):
        return JsonResponse(
            {
                "error": (
                    "Verification session expired. "
                    "Please register again."
                )
            },
            status=400,
        )

    email = str(pending.get("email", "")).strip().lower()
    password_hash = str(pending.get("password_hash", ""))
    code_hash = str(pending.get("code_hash", ""))
    first_name = str(pending.get("first_name", "")).strip()
    last_name = str(pending.get("last_name", "")).strip()

    try:
        expires_at = timezone.datetime.fromisoformat(
            str(pending.get("expires_at", ""))
        )
        if timezone.is_naive(expires_at):
            expires_at = timezone.make_aware(expires_at)
    except (TypeError, ValueError):
        request.session.pop("pending_registration", None)
        request.session.modified = True
        return JsonResponse(
            {
                "error": (
                    "Verification session is invalid. "
                    "Please register again."
                )
            },
            status=400,
        )

    if expires_at < timezone.now():
        request.session.pop("pending_registration", None)
        request.session.modified = True
        return JsonResponse(
            {"error": "Verification code expired."},
            status=400,
        )

    attempts = int(pending.get("attempts", 0) or 0)

    if attempts >= 8:
        request.session.pop("pending_registration", None)
        request.session.modified = True
        return JsonResponse(
            {"error": "Too many attempts. Please register again."},
            status=429,
        )

    if not check_password(code, code_hash):
        pending["attempts"] = attempts + 1
        request.session["pending_registration"] = pending
        request.session.modified = True
        return JsonResponse(
            {"error": "Incorrect verification code."},
            status=400,
        )

    if User.objects.filter(email__iexact=email).exists():
        request.session.pop("pending_registration", None)
        request.session.modified = True
        return JsonResponse(
            {"error": "An account with this email already exists."},
            status=400,
        )

    # Account is created ONLY after successful email verification.
    user = User(
        username=email,
        email=email,
        first_name=first_name,
        last_name=last_name,
        is_active=True,
        password=password_hash,
    )
    user.save()

    request.session.pop("pending_registration", None)
    request.session.modified = True

    login(request, user)

    return JsonResponse(
        {
            "ok": True,
            "user": {
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
            },
        }
    )


@csrf_protect
@require_POST
def login_api(request):
    data = _body(request)
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    user_obj = User.objects.filter(email__iexact=email).first()
    username = user_obj.username if user_obj else email
    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"error": "Invalid email or password."}, status=400)
    if not user.is_active:
        return JsonResponse({"error": "Verify your email first."}, status=403)
    login(request, user)
    return JsonResponse({"ok": True, "user": {"email": user.email, "firstName": user.first_name, "lastName": user.last_name}})


@csrf_protect
@require_POST
def logout_api(request):
    logout(request)
    return JsonResponse({"ok": True})


@require_GET
def me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False})
    return JsonResponse({
        "authenticated": True,
        "id": request.user.id,
        "email": request.user.email,
        "firstName": request.user.first_name,
        "lastName": request.user.last_name,
    })


@csrf_protect
@require_POST
def forgot_password(request):
    data = _body(request)
    email = str(data.get("email", "")).strip().lower()
    user = User.objects.filter(email__iexact=email, is_active=True).first()
    if user:
        code = f"{secrets.randbelow(1000000):06d}"
        PasswordResetCode.objects.update_or_create(
            user=user,
            defaults={"code_hash": make_password(code), "expires_at": timezone.now() + timedelta(minutes=15), "attempts": 0},
        )
        send_mail("Reset your LE VAURÉ password", f"Your password reset code is {code}. It expires in 15 minutes.", None, [email], fail_silently=False)
    return JsonResponse({"ok": True, "message": "If that email exists, a reset code has been sent."})


@csrf_protect
@require_POST
def reset_password(request):
    data = _body(request)
    email = str(data.get("email", "")).strip().lower()
    code = str(data.get("code", "")).strip()
    password = str(data.get("password", ""))
    if len(password) < 8:
        return JsonResponse({"error": "Password must be at least 8 characters."}, status=400)
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return JsonResponse({"error": "Invalid code."}, status=400)
    reset = PasswordResetCode.objects.filter(user=user).first()
    if not reset or reset.expires_at < timezone.now() or reset.attempts >= 8:
        return JsonResponse({"error": "Code expired or invalid."}, status=400)
    if not check_password(code, reset.code_hash):
        reset.attempts += 1
        reset.save(update_fields=["attempts"])
        return JsonResponse({"error": "Invalid code."}, status=400)
    user.set_password(password)
    user.save(update_fields=["password"])
    reset.delete()
    return JsonResponse({"ok": True})


@require_GET
def cart_get(request):
    return JsonResponse(_cart_payload(request))


@csrf_protect
@require_POST
def cart_add(request):
    data = _body(request)
    variant = get_object_or_404(ProductVariant.objects.select_related("product"), pk=data.get("variantId"), active=True, product__active=True)
    if variant.stock <= 0:
        return JsonResponse({"error": "This option is sold out."}, status=400)
    try:
        qty = max(1, int(data.get("quantity", 1)))
    except (TypeError, ValueError):
        qty = 1
    cart = _cart(request)
    key = str(variant.id)
    cart[key] = min(int(cart.get(key, 0)) + qty, variant.stock)
    request.session["next_cart"] = cart
    request.session.modified = True
    return JsonResponse(_cart_payload(request))


@csrf_protect
@require_http_methods(["POST", "DELETE"])
def cart_item(request, variant_id):
    cart = _cart(request)
    key = str(variant_id)
    if request.method == "DELETE":
        cart.pop(key, None)
    else:
        data = _body(request)
        variant = get_object_or_404(ProductVariant, pk=variant_id, active=True)
        try:
            qty = int(data.get("quantity", 1))
        except (TypeError, ValueError):
            qty = 1
        if qty <= 0 or variant.stock <= 0:
            cart.pop(key, None)
        else:
            cart[key] = min(qty, variant.stock)
    request.session["next_cart"] = cart
    request.session.modified = True
    return JsonResponse(_cart_payload(request))


@require_GET
def wishlist_get(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)
    rows = Wishlist.objects.filter(user=request.user, product__isnull=False).select_related("product", "product__category")
    return JsonResponse({"results": [_product_json(request, x.product) for x in rows if x.product]})


@csrf_protect
@require_POST
def wishlist_toggle(request, product_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)
    product = get_object_or_404(Product, pk=product_id, active=True)
    obj = Wishlist.objects.filter(user=request.user, product=product).first()
    if obj:
        obj.delete()
        active = False
    else:
        Wishlist.objects.create(user=request.user, product=product)
        active = True
    return JsonResponse({"ok": True, "active": active, "count": Wishlist.objects.filter(user=request.user).count()})


@require_http_methods(["GET", "POST"])
@csrf_protect
def addresses(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)
    if request.method == "POST":
        data = _body(request)
        if data.get("isDefault"):
            CustomerAddress.objects.filter(user=request.user).update(is_default=False)
        CustomerAddress.objects.create(
            user=request.user,
            label=str(data.get("label", "Home"))[:40],
            full_name=str(data.get("fullName", ""))[:160],
            phone=str(data.get("phone", ""))[:50],
            country=str(data.get("country", "Armenia"))[:80],
            region=str(data.get("region", ""))[:120],
            city=str(data.get("city", ""))[:120],
            street=str(data.get("street", ""))[:255],
            apartment=str(data.get("apartment", ""))[:120],
            postal_code=str(data.get("postalCode", ""))[:40],
            is_default=bool(data.get("isDefault")),
        )
    rows = CustomerAddress.objects.filter(user=request.user)
    return JsonResponse({"results": [{
        "id": x.id, "label": x.label, "fullName": x.full_name, "phone": x.phone,
        "country": x.country, "region": x.region, "city": x.city, "street": x.street,
        "apartment": x.apartment, "postalCode": x.postal_code, "isDefault": x.is_default,
    } for x in rows]})


@require_GET
def orders(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)
    rows = Order.objects.filter(user=request.user).prefetch_related("items", "items__product").order_by("-created_at")
    return JsonResponse({"results": [{
        "id": x.id,
        "number": f"LV-{x.id:06d}",
        "status": x.status,
        "total": _money(x.total),
        "createdAt": x.created_at.isoformat(),
        "items": [{"name": i.product.name, "quantity": i.quantity, "price": _money(i.price), "color": i.color_name, "size": i.size_name} for i in x.items.all()],
    } for x in rows]})


@csrf_protect
@require_POST
def checkout(request):
    data = _body(request)
    cart = _cart_payload(request)
    if not cart["items"]:
        return JsonResponse({"error": "Your cart is empty."}, status=400)
    required = ["fullName", "email", "phone", "city", "street"]
    missing = [k for k in required if not str(data.get(k, "")).strip()]
    if missing:
        return JsonResponse({"error": "Complete all required shipping fields."}, status=400)
    variant_ids = [x["variantId"] for x in cart["items"]]
    with transaction.atomic():
        locked = {
            v.id: v
            for v in ProductVariant.objects.select_for_update().filter(id__in=variant_ids, active=True).select_related("product", "color", "size")
        }
        total = Decimal("0")
        for item in cart["items"]:
            v = locked.get(item["variantId"])
            if v is None or v.stock < item["quantity"]:
                return JsonResponse({"error": f"Stock changed for {item['product']['name']}. Please review your cart."}, status=409)
            total += v.effective_price * item["quantity"]
        order = Order.objects.create(
            user=request.user if request.user.is_authenticated else None,
            full_name=str(data["fullName"])[:160],
            email=str(data["email"]).strip().lower(),
            address=f"{data.get('street','')} {data.get('apartment','')}, {data.get('city','')} {data.get('postalCode','')}, {data.get('country','Armenia')}",
            total=total,
            status="new",
            payment_method="manual",
            phone=str(data.get("phone", ""))[:50],
            country=("AM" if str(data.get("country", "Armenia")).lower() == "armenia" else str(data.get("country", "AM"))[:2].upper()),
            region=str(data.get("region", ""))[:120],
            city=str(data.get("city", ""))[:120],
            street=str(data.get("street", ""))[:255],
            apartment=str(data.get("apartment", ""))[:120],
            postal_code=str(data.get("postalCode", ""))[:40],
            shipping_total=Decimal("0"),
        )
        for item in cart["items"]:
            v = locked[item["variantId"]]
            OrderItem.objects.create(
                order=order,
                product=v.product,
                variant=v,
                color_name=v.color.name,
                size_name=v.size.name,
                quantity=item["quantity"],
                price=v.effective_price,
            )
            v.stock -= item["quantity"]
            v.save(update_fields=["stock"])
        code = f"{secrets.randbelow(1000000):06d}"
        OrderVerificationCode.objects.create(
            order=order,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(hours=24),
        )
    send_mail(
        f"Confirm order LV-{order.id:06d}",
        f"Thank you for your order. Your confirmation code is {code}. Order total: {order.total} ֏.",
        None,
        [order.email],
        fail_silently=False,
    )
    request.session["next_cart"] = {}
    request.session.modified = True
    return JsonResponse({"ok": True, "orderId": order.id, "orderNumber": f"LV-{order.id:06d}", "needsVerification": True})


@csrf_protect
@require_POST
def verify_order(request, order_id):
    data = _body(request)
    code = str(data.get("code", "")).strip()
    order = get_object_or_404(Order, pk=order_id)
    verification = get_object_or_404(OrderVerificationCode, order=order)
    if verification.verified_at:
        return JsonResponse({"ok": True})
    if verification.expires_at < timezone.now() or verification.attempts >= 8:
        return JsonResponse({"error": "Code expired or locked."}, status=400)
    if not check_password(code, verification.code_hash):
        verification.attempts += 1
        verification.save(update_fields=["attempts"])
        return JsonResponse({"error": "Incorrect code."}, status=400)
    verification.verified_at = timezone.now()
    verification.save(update_fields=["verified_at"])
    return JsonResponse({"ok": True})
