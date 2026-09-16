import resend

from decimal import Decimal
import logging
import secrets
import requests
import json
import os

from datetime import datetime, timedelta

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import User
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.http import JsonResponse, HttpResponse
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils.text import get_valid_filename
from django.urls import reverse
from django.template.loader import render_to_string
from django.utils import timezone
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

from .forms import RegistrationForm
from .models import (
    Category,
    Product,
    Order,
    OrderItem,
    Wishlist,
    SiteAccessSettings,
    PrintifyProduct,
    PrintifyProductImage,
    PrintifyVariant,
    PrintifyOrderItem,
    SiteDesign,
)


logger = logging.getLogger(__name__)


def _new_verification_code():
    return f"{secrets.randbelow(1_000_000):06d}"


def _safe_int(value, default=0, minimum=None):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default

    if minimum is not None:
        return max(minimum, parsed)

    return parsed


# =========================================================
# CART HELPERS
# =========================================================

def _printify_cart_data(request):
    cart_data = request.session.get("printify_cart", {})
    return cart_data if isinstance(cart_data, dict) else {}


def _build_cart_items(request):
    items = []
    total = Decimal("0.00")

    # -----------------------------------------------------
    # LOCAL PRODUCTS
    # -----------------------------------------------------

    cart_data = request.session.get(
        "cart",
        {},
    )

    local_products = (
        Product.objects
        .filter(
            pk__in=cart_data.keys(),
            active=True,
        )
        .select_related("category")
    )

    for product_item in local_products:
        quantity = _safe_int(
            cart_data.get(
                str(product_item.pk),
                0,
            ),
            default=0,
            minimum=0,
        )

        quantity = min(
            quantity,
            product_item.stock,
        )

        if quantity <= 0:
            continue

        subtotal = (
            product_item.price
            * quantity
        )

        items.append(
            {
                "source": "local",
                "product": product_item,
                "variant": None,
                "title": product_item.name,
                "variant_title": "",
                "image": (
                    product_item.image.url
                    if product_item.image
                    else ""
                ),
                "url": reverse(
                    "product",
                    args=[product_item.slug],
                ),
                "quantity": quantity,
                "max_quantity": product_item.stock,
                "unit_price": product_item.price,
                "subtotal": subtotal,
                "update_url": reverse(
                    "update_cart",
                    args=[product_item.pk],
                ),
            }
        )

        total += subtotal

    return items, total


def _cart_json_payload(
    request,
    product_item=None,
):
    items, cart_total = _build_cart_items(
        request
    )

    cart_count = sum(
        item["quantity"]
        for item in items
    )

    payload = {
        "ok": True,
        "cart_count": cart_count,
        "cart_total": f"{cart_total:.2f}",
    }

    if product_item is not None:
        cart_data = request.session.get(
            "cart",
            {},
        )

        quantity = cart_data.get(
            str(product_item.pk),
            0,
        )

        payload["product"] = {
            "id": product_item.pk,
            "name": product_item.name,
            "price": f"{product_item.price:.2f}",
            "quantity": quantity,
            "stock": product_item.stock,
            "image": (
                product_item.image.url
                if product_item.image
                else ""
            ),
            "category": (
                product_item.category.name
                if product_item.category
                else "LE VAURÃ‰"
            ),
            "update_url": reverse(
                "update_cart",
                args=[product_item.pk],
            ),
            "product_url": reverse(
                "product",
                args=[product_item.slug],
            ),
        }

    return payload


# =========================================================
# VERIFICATION HELPERS
# =========================================================

def _verification_minutes():
    return getattr(
        settings,
        "SOUTHWARD_VERIFICATION_MINUTES",
        getattr(
            settings,
            "SCORPION_VERIFICATION_MINUTES",
            10
        ),
    )


def _pending_registration_key():
    return "pending_registration"


def _send_verification_email(
    recipient_email,
    code,
    username=""
):
    """
    Send LE VAURÃ‰ verification email through Resend API.
    """

    recipient_email = (recipient_email or "").strip().lower()
    username = (username or "").strip()

    if not recipient_email:
        raise ValueError("User has no email address.")

    # Verification code expiration time
    minutes = _verification_minutes()

    # Render HTML email template
    html_message = render_to_string(
        "emails/verification_email.html",
        {
            "username": username,
            "email": recipient_email,
            "code": code,
            "minutes": minutes,
            "logo_cid": "",
        },
    )

    # Plain-text fallback
    text_message = (
        "LE VAURÃ‰\n\n"
        f"Welcome, {username or 'LE VAURÃ‰ member'}.\n\n"
        f"Your email verification code is: {code}\n\n"
        f"This code expires in {minutes} minutes.\n\n"
        "If you did not create a LE VAURÃ‰ account, "
        "you can safely ignore this email.\n\n"
        "LE VAURÃ‰\n"
        "MOVE YOUR OWN WAY."
    )

    # Check Resend configuration
    resend_api_key = getattr(
        settings,
        "RESEND_API_KEY",
        "",
    ).strip()

    resend_from_email = getattr(
        settings,
        "RESEND_FROM_EMAIL",
        "",
    ).strip()

    if not resend_api_key:
        raise RuntimeError(
            "RESEND_API_KEY is not configured."
        )

    if not resend_from_email:
        raise RuntimeError(
            "RESEND_FROM_EMAIL is not configured."
        )

    # Configure Resend
    resend.api_key = resend_api_key

    # Send verification email
    response = resend.Emails.send(
        {
            "from": resend_from_email,
            "to": [recipient_email],
            "subject": "Your LE VAURÃ‰ verification code",
            "html": html_message,
            "text": text_message,
        }
    )

    if not response:
        raise RuntimeError(
            "Resend did not return a response."
        )

    logger.info(
        "LE VAURÃ‰ verification email sent via Resend. recipient=%s",
        recipient_email,
    )

    return response


def _send_order_notification_email(order):
    notification_email = getattr(
        settings,
        "CEO_ORDER_NOTIFICATION_EMAIL",
        "",
    ).strip()

    if not notification_email:
        return 0

    if not settings.RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY is not configured.")

    order_number = f"LV-{order.pk:06d}"
    order_items = order.items.select_related("product").all()

    html_message = render_to_string(
        "emails/order_notification_email.html",
        {
            "order": order,
            "order_number": order_number,
            "items": order_items,
            "logo_cid": "",
        },
    )

    text_lines = [
        "LE VAURÃ‰ NEW ORDER ALERT",
        "",
        f"Customer: {order.full_name}",
        f"Order number: {order_number}",
        f"Total: {order.total}",
        "",
        "Items:",
    ]
    text_lines.extend(
        f"- {item.product.name} x {item.quantity}"
        for item in order_items
    )

    resend.api_key = settings.RESEND_API_KEY

    response = resend.Emails.send(
        {
            "from": settings.RESEND_FROM_EMAIL,
            "to": [notification_email],
            "subject": f"New Order Received - {order_number}",
            "html": html_message,
            "text": "\n".join(text_lines),
        }
    )

    if not response:
        raise RuntimeError("Resend did not return a response.")

    return response


def _store_pending_registration(
    request,
    form
):
    code = _new_verification_code()

    minutes = _verification_minutes()

    now = timezone.now()

    pending = {
        "username": (
            form.cleaned_data["username"]
            .strip()
        ),
        "email": (
            form.cleaned_data["email"]
            .strip()
            .lower()
        ),
        "password": (
            form.cleaned_data["password1"]
        ),
        "code_hash": make_password(code),
        "expires_at": (
            now
            + timedelta(minutes=minutes)
        ).isoformat(),
        "attempts": 0,
        "last_sent_at": now.isoformat(),
    }

    request.session[
        _pending_registration_key()
    ] = pending

    request.session.modified = True

    _send_verification_email(
        pending["email"],
        code,
        pending["username"],
    )


def _get_pending_registration(request):
    return request.session.get(
        _pending_registration_key()
    )


def _parse_iso_datetime(value):
    parsed = datetime.fromisoformat(value)

    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(
            parsed,
            timezone.get_current_timezone()
        )

    return parsed


def _store_pending_verification(
    request,
    pending,
    code
):
    now = timezone.now()

    pending["code_hash"] = (
        make_password(code)
    )

    pending["expires_at"] = (
        now
        + timedelta(
            minutes=_verification_minutes()
        )
    ).isoformat()

    pending["attempts"] = 0

    pending["last_sent_at"] = (
        now.isoformat()
    )

    request.session[
        _pending_registration_key()
    ] = pending

    request.session.modified = True


# =========================================================
# SITE ACCESS / PRIVATE SHOP
# =========================================================

def site_access(request):
    site_settings = SiteAccessSettings.objects.first()

    # If no settings row exists, do not accidentally lock the site.
    if site_settings is None:
        return redirect("home")

    # If private mode has been disabled from Admin, go to the shop.
    if not site_settings.maintenance_mode:
        return redirect("home")

    # The session is valid only for the currently configured password hash.
    # Changing the password in Admin automatically invalidates old sessions.
    if (
        request.session.get("southward_site_access_granted_for")
        == site_settings.access_password
    ):
        return redirect("home")

    error = ""

    if request.method == "POST":
        entered_password = request.POST.get(
            "password",
            "",
        )

        if site_settings.check_access_password(entered_password):
            request.session["southward_site_access_granted_for"] = (
                site_settings.access_password
            )

            # Remove the old boolean-style session key if it exists.
            request.session.pop(
                "southward_site_access_granted",
                None,
            )

            request.session.modified = True
            return redirect("home")

        error = "Incorrect password."

    response = render(
        request,
        "shop/site_access.html",
        {
            "error": error,
        },
    )

    # Keep the private-development gate out of search-engine indexes
    # and prevent the password page from being cached.
    response["X-Robots-Tag"] = "noindex, nofollow, noarchive"
    response["Cache-Control"] = "no-store"
    return response


# =========================================================
# HOME
# =========================================================

def home(request):
    products = []

    # =====================================================
    # LOCAL PRODUCTS
    # =====================================================

    local_products = (
        Product.objects
        .filter(
            active=True,
            featured=True,
        )
        .select_related("category")
        .order_by("-created_at")
    )

    for item in local_products:
        products.append(
            {
                "source": "local",
                "id": item.pk,
                "pk": item.pk,
                "name": item.name,
                "title": item.name,
                "price": item.price,
                "image": (
                    item.image.url
                    if item.image
                    else ""
                ),
                "url": reverse(
                    "product",
                    args=[item.slug],
                ),
                "stock": item.stock,
                "category": (
                    item.category.name
                    if item.category
                    else "LE VAURÃ‰"
                ),
                "featured": item.featured,
                "created_at": item.created_at,
            }
        )

    # =====================================================
    # PRINTIFY API â€” OPTIONAL IMAGE FALLBACK
    # =====================================================
    # Important:
    # Printify products are NOT dependent on a live API response.
    # They are always loaded from the local database first.
    # API data is used only as a fallback for image URLs.

    api_products_by_id = {}

    # =====================================================
    # PRINTIFY PRODUCTS â€” DATABASE IS SOURCE OF DISPLAY
    # =====================================================

    # =====================================================
    # SORT + LIMIT
    # =====================================================

    products.sort(
        key=lambda item: item["created_at"],
        reverse=True,
    )

    products = products[:8]

    # =====================================================
    # WISHLIST
    # =====================================================

    wishlist_product_ids = set()

    if request.user.is_authenticated:
        wishlist_product_ids = set(
            Wishlist.objects.filter(
                user=request.user
            ).values_list(
                "product_id",
                flat=True,
            )
        )

    return render(
        request,
        "shop/home.html",
        {
            "products": products,
            "wishlist_product_ids":
                wishlist_product_ids,
        },
    )


# =========================================================
# SHOP
# =========================================================

def shop(request):
    """
    Main LE VAURÃ‰ shop page.

    Local and Printify products are normalized into one plain Python list.
    This keeps the original shop template/design while avoiding QuerySet.sort()
    errors and lets both product sources appear together.
    """
    products = []

    q = request.GET.get("q", "").strip()
    sort = request.GET.get("sort", "featured").strip()
    selected_category = request.GET.get("category", "").strip()

    # =====================================================
    # LOCAL PRODUCTS
    # =====================================================
    local_products = (
        Product.objects
        .filter(active=True)
        .select_related("category")
        .order_by("-featured", "-created_at")
    )

    if selected_category:
        local_products = local_products.filter(
            category__slug=selected_category
        )

    for item in local_products:
        products.append(
            {
                "source": "local",
                "id": item.pk,
                "pk": item.pk,
                "title": item.name,
                "name": item.name,
                "slug": item.slug,
                "description": item.description or "",
                "price": item.price,
                "image": item.image.url if item.image else "",
                "stock": item.stock,
                "featured": item.featured,
                "category": (
                    item.category.name
                    if item.category
                    else "LE VAURÃ‰"
                ),
                "category_slug": (
                    item.category.slug
                    if item.category
                    else ""
                ),
                "url": reverse(
                    "product",
                    args=[item.slug],
                ),
                "variants": [],
            }
        )

    # =====================================================
    # PRINTIFY PRODUCTS
    # =====================================================
    # Printify products do not currently have a Category FK in the model.
    # Therefore they are included in the main/all-products view, but not
    # injected into a specific local category filter where they could be
    # incorrectly categorized.
    # =====================================================
    # SEARCH
    # =====================================================
    if q:
        query = q.casefold()

        products = [
            item
            for item in products
            if (
                query in item["title"].casefold()
                or query in (
                    item.get("description")
                    or ""
                ).casefold()
                or query in (
                    item.get("category")
                    or ""
                ).casefold()
            )
        ]

    # =====================================================
    # SORT
    # =====================================================
    # Be explicit: products MUST be a normal list before using .sort().
    products = list(products)

    if sort == "price_low":
        products.sort(
            key=lambda item: item["price"]
        )

    elif sort == "price_high":
        products.sort(
            key=lambda item: item["price"],
            reverse=True,
        )

    elif sort == "name":
        products.sort(
            key=lambda item: item["title"].casefold()
        )

    else:
        products.sort(
            key=lambda item: bool(
                item.get("featured")
            ),
            reverse=True,
        )

    # =====================================================
    # WISHLIST IDS
    # =====================================================
    wishlist_product_ids = set()

    if request.user.is_authenticated:
        wishlist_product_ids = set(
            Wishlist.objects.filter(
                user=request.user
            ).values_list(
                "product_id",
                flat=True,
            )
        )

    # =====================================================
    # CATEGORIES
    # =====================================================
    categories = Category.objects.all().order_by("name")

    # =====================================================
    # RENDER ORIGINAL SHOP DESIGN
    # =====================================================
    return render(
        request,
        "shop/shop.html",
        {
            "products": products,
            "categories": categories,
            "selected_category": selected_category,
            "wishlist_product_ids": wishlist_product_ids,
            "q": q,
            "sort": sort,
        },
    )


# =========================================================
# PRODUCT
# =========================================================

def product(request, slug):
    item = get_object_or_404(
        Product,
        slug=slug,
        active=True,
    )

    # All gallery images uploaded from Admin Panel
    images = (
        item.images
        .all()
        .order_by(
            "-is_primary",
            "sort_order",
            "id",
        )
    )

    is_wishlisted = False

    if request.user.is_authenticated:
        is_wishlisted = (
            Wishlist.objects.filter(
                user=request.user,
                product=item,
            ).exists()
        )

    return render(
        request,
        "shop/product.html",
        {
            "product": item,
            "images": images,
            "is_wishlisted": is_wishlisted,
        },
    )


# =========================================================
# PRINTIFY PRODUCT DETAIL
# =========================================================



# =========================================================
# PRINTIFY PRODUCT DETAIL
# =========================================================

def printify_product(
    request,
    printify_id,
):
    item = get_object_or_404(
        PrintifyProduct,
        printify_id=printify_id,
        active=True,
    )

    images = (
        item.images
        .order_by(
            "-is_primary",
            "sort_order",
            "id",
        )
    )

    variants = (
        item.variants
        .filter(enabled=True)
        .order_by(
            "price",
            "title",
        )
    )

    available_variants = (
        variants
        .filter(available=True)
        .count()
    )

    is_wishlisted = False

    if request.user.is_authenticated:
        is_wishlisted = (
            Wishlist.objects.filter(
                user=request.user,
                printify_product=item,
            ).exists()
        )

    return render(
        request,
        "shop/printify_product.html",
        {
            "product": item,
            "images": images,
            "variants": variants,
            "available_variants": available_variants,
            "is_wishlisted": is_wishlisted,
        },
    )


# =========================================================
# ADD TO CART
# =========================================================

@require_POST
def add_cart(request, pk):
    product_item = get_object_or_404(
        Product,
        pk=pk,
        active=True
    )

    if product_item.stock <= 0:
        if (
            request.headers.get(
                "x-requested-with"
            )
            == "XMLHttpRequest"
        ):
            return JsonResponse(
                {
                    "ok": False,
                    "message":
                        "Product is out of stock."
                },
                status=400
            )

        messages.warning(
            request,
            "Product is out of stock."
        )

        return redirect(
            request.META.get(
                "HTTP_REFERER",
                "/shop/"
            )
        )

    cart_data = request.session.get(
        "cart",
        {}
    )

    key = str(pk)

    quantity = _safe_int(
        request.POST.get(
            "quantity",
            1
        ),
        default=1,
        minimum=1
    )

    current_quantity = (
        cart_data.get(key, 0)
    )

    cart_data[key] = min(
        current_quantity + quantity,
        product_item.stock
    )

    request.session["cart"] = (
        cart_data
    )

    request.session.modified = True

    if (
        request.headers.get(
            "x-requested-with"
        )
        == "XMLHttpRequest"
    ):
        return JsonResponse(
            _cart_json_payload(
                request,
                product_item
            )
        )

    messages.success(
        request,
        f"{product_item.name} added to cart."
    )

    return redirect(
        request.META.get(
            "HTTP_REFERER",
            "/shop/"
        )
    )


# =========================================================
# ADD PRINTIFY PRODUCT TO CART
# =========================================================

@require_POST
def add_printify_cart(
    request,
    printify_id,
):
    product_item = get_object_or_404(
        PrintifyProduct,
        printify_id=printify_id,
        active=True,
    )

    variant_id = _safe_int(
        request.POST.get(
            "variant_id",
            0,
        ),
        default=0,
        minimum=0,
    )

    quantity = _safe_int(
        request.POST.get(
            "quantity",
            1,
        ),
        default=1,
        minimum=1,
    )

    quantity = min(
        quantity,
        99,
    )

    variant = (
        product_item.variants
        .filter(
            printify_variant_id=variant_id,
            enabled=True,
            available=True,
        )
        .first()
    )

    if variant is None:
        messages.error(
            request,
            "Please select an available size / color.",
        )

        return redirect(
            "printify_product",
            printify_id=printify_id,
        )

    cart_data = _printify_cart_data(
        request
    )

    key = str(
        variant.printify_variant_id
    )

    current_quantity = _safe_int(
        cart_data.get(
            key,
            0,
        ),
        default=0,
        minimum=0,
    )

    cart_data[key] = min(
        current_quantity + quantity,
        99,
    )

    request.session["printify_cart"] = (
        cart_data
    )

    request.session.modified = True

    if request.POST.get("buy_now"):
        return redirect("checkout")

    messages.success(
        request,
        (
            f"{product_item.title} / "
            f"{variant.title} added to cart."
        ),
    )

    return redirect("cart")


# =========================================================
# CART
# =========================================================

def cart(request):
    items, total = _build_cart_items(
        request
    )

    return render(
        request,
        "shop/cart.html",
        {
            "items": items,
            "total": total,
        },
    )


# =========================================================
# UPDATE CART
# =========================================================

@require_POST
def update_cart(request, pk):
    product_item = get_object_or_404(
        Product,
        pk=pk,
        active=True
    )

    cart_data = request.session.get(
        "cart",
        {}
    )

    quantity = _safe_int(
        request.POST.get(
            "quantity",
            0
        ),
        default=0,
        minimum=0
    )

    key = str(pk)

    if quantity <= 0:
        cart_data.pop(
            key,
            None
        )

    elif product_item.stock <= 0:
        cart_data.pop(
            key,
            None
        )

        if (
            request.headers.get(
                "x-requested-with"
            )
            != "XMLHttpRequest"
        ):
            messages.warning(
                request,
                (
                    f"{product_item.name} "
                    "is out of stock."
                )
            )

    else:
        cart_data[key] = min(
            quantity,
            product_item.stock
        )

    request.session["cart"] = (
        cart_data
    )

    request.session.modified = True

    if (
        request.headers.get(
            "x-requested-with"
        )
        == "XMLHttpRequest"
    ):
        return JsonResponse(
            _cart_json_payload(
                request,
                product_item
            )
        )

    return redirect("cart")


# =========================================================
# UPDATE PRINTIFY CART
# =========================================================

@require_POST
def update_printify_cart(
    request,
    variant_id,
):
    variant = get_object_or_404(
        PrintifyVariant,
        printify_variant_id=variant_id,
        product__active=True,
        enabled=True,
    )

    cart_data = _printify_cart_data(
        request
    )

    key = str(
        variant.printify_variant_id
    )

    quantity = _safe_int(
        request.POST.get(
            "quantity",
            0,
        ),
        default=0,
        minimum=0,
    )

    if (
        quantity <= 0
        or not variant.available
    ):
        cart_data.pop(
            key,
            None,
        )
    else:
        cart_data[key] = min(
            quantity,
            99,
        )

    request.session["printify_cart"] = (
        cart_data
    )

    request.session.modified = True

    return redirect("cart")


# =========================================================
# ORDER EMAIL HELPERS
# =========================================================

def _send_order_emails(order):
    """Best-effort customer and store notifications after order creation."""
    try:
        _send_order_confirmation_email(order)
    except Exception:
        logger.exception("LE VAURÃ‰ customer order confirmation could not be sent. order=%s", order.pk)
    try:
        _send_order_notification_email(order)
    except Exception:
        logger.exception("LE VAURÃ‰ store order notification could not be sent. order=%s", order.pk)


def _split_customer_name(full_name):
    parts = (
        full_name
        or ""
    ).strip().split()

    if not parts:
        return "", ""

    first_name = parts[0]

    last_name = (
        " ".join(parts[1:])
        if len(parts) > 1
        else "-"
    )

    return first_name, last_name


def _printify_headers():
    api_token = getattr(
        settings,
        "PRINTIFY_API_TOKEN",
        "",
    ).strip()

    if not api_token:
        raise RuntimeError(
            "PRINTIFY_API_TOKEN is not configured."
        )

    return {
        "Authorization":
            f"Bearer {api_token}",
        "Content-Type":
            "application/json;charset=utf-8",
    }


def _printify_address_payload(
    full_name,
    email,
    phone,
    country,
    region,
    street,
    apartment,
    city,
    postal_code,
):
    first_name, last_name = (
        _split_customer_name(
            full_name
        )
    )

    return {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone or "",
        "country": country,
        "region": region or "",
        "address1": street,
        "address2": apartment or "",
        "city": city,
        "zip": postal_code,
    }


def _printify_shipping_quote(
    printify_items,
    address_to,
):
    if not printify_items:
        return Decimal("0.00")

    line_items = []

    for item in printify_items:
        line_items.append(
            {
                "product_id":
                    item["product"].printify_id,
                "variant_id":
                    item["variant"].printify_variant_id,
                "quantity":
                    item["quantity"],
            }
        )

    url = (
        "https://api.printify.com/v1/shops/"
        f"{PRINTIFY_SHOP_ID}/orders/shipping.json"
    )

    response = requests.post(
        url,
        headers=_printify_headers(),
        json={
            "line_items": line_items,
            "address_to": address_to,
        },
        timeout=20,
    )

    response.raise_for_status()

    data = response.json()

    standard_cents = data.get(
        "standard"
    )

    if standard_cents is None:
        raise RuntimeError(
            "Printify did not return a standard shipping rate."
        )

    return (
        Decimal(
            str(standard_cents)
        )
        / Decimal("100")
    )


def _ensure_printify_order(order):
    """
    Submit paid Printify items exactly once.

    Safe to call after a confirmed order when fulfillment is enabled.
    """
    order = (
        Order.objects
        .prefetch_related(
            "printify_items__product",
            "printify_items__variant",
        )
        .get(pk=order.pk)
    )

    printify_items = list(
        order.printify_items.all()
    )

    if not printify_items:
        return True

    if order.printify_order_id:
        return True

    if order.status != "paid":
        return False

    address_to = (
        _printify_address_payload(
            order.full_name,
            order.email,
            order.phone,
            order.country,
            order.region,
            order.street,
            order.apartment,
            order.city,
            order.postal_code,
        )
    )

    line_items = []

    for index, item in enumerate(
        printify_items,
        start=1,
    ):
        line_items.append(
            {
                "product_id":
                    item.product.printify_id,
                "variant_id":
                    item.variant.printify_variant_id,
                "quantity":
                    item.quantity,
                "external_id":
                    (
                        f"SW-{order.pk:06d}-"
                        f"P{index}"
                    ),
            }
        )

    payload = {
        "external_id":
            f"LV-{order.pk:06d}",
        "label":
            f"LV-{order.pk:06d}",
        "line_items": line_items,
        "shipping_method": 1,
        "is_printify_express": False,
        "is_economy_shipping": False,
        "send_shipping_notification": False,
        "address_to": address_to,
    }

    url = (
        "https://api.printify.com/v1/shops/"
        f"{PRINTIFY_SHOP_ID}/orders.json"
    )

    try:
        response = requests.post(
            url,
            headers=_printify_headers(),
            json=payload,
            timeout=30,
        )

        response.raise_for_status()

        data = response.json()

        printify_order_id = str(
            data.get(
                "id",
                "",
            )
        ).strip()

        if not printify_order_id:
            raise RuntimeError(
                "Printify order response has no order id."
            )

        order.printify_order_id = (
            printify_order_id
        )

        order.printify_status = str(
            data.get(
                "status",
                "created",
            )
        )

        order.printify_submitted_at = (
            timezone.now()
        )

        order.printify_error = ""

        order.save(
            update_fields=[
                "printify_order_id",
                "printify_status",
                "printify_submitted_at",
                "printify_error",
            ]
        )

        auto_send = bool(
            getattr(
                settings,
                "PRINTIFY_AUTO_SEND_TO_PRODUCTION",
                False,
            )
        )

        if auto_send:
            production_url = (
                "https://api.printify.com/v1/shops/"
                f"{PRINTIFY_SHOP_ID}/orders/"
                f"{printify_order_id}/"
                "send_to_production.json"
            )

            production_response = requests.post(
                production_url,
                headers=_printify_headers(),
                json={},
                timeout=20,
            )

            production_response.raise_for_status()

            order.printify_status = (
                "sent_to_production"
            )

            order.save(
                update_fields=[
                    "printify_status"
                ]
            )

        return True

    except Exception as exc:
        logger.exception(
            "Printify order submission failed for LE VAURÃ‰ order %s.",
            order.pk,
        )

        order.printify_error = str(
            exc
        )[:2000]

        order.save(
            update_fields=[
                "printify_error"
            ]
        )

        return False


# =========================================================
# CHECKOUT
# =========================================================

def checkout(request):
    items, subtotal = _build_cart_items(request)

    if not items:
        messages.warning(request, "Your cart is empty.")
        return redirect("shop")

    shipping_total = Decimal("0.00")
    total = subtotal + shipping_total

    if request.method == "POST":
        full_name = request.POST.get("full_name", "").strip()
        email = request.POST.get("email", "").strip()
        phone = request.POST.get("phone", "").strip()
        country = request.POST.get("country", "").strip().upper()
        region = request.POST.get("region", "").strip()
        street = request.POST.get("street", "").strip()
        apartment = request.POST.get("apartment", "").strip()
        city = request.POST.get("city", "").strip()
        postal_code = request.POST.get("postal_code", "").strip()
        delivery_notes = request.POST.get("delivery_notes", "").strip()

        if not all([full_name, email, country, street, city, postal_code]):
            messages.error(request, "Please fill all required shipping fields.")
            return render(request, "shop/checkout.html", {
                "items": items, "subtotal": subtotal,
                "shipping_total": shipping_total, "total": total,
            })

        address = ", ".join(part for part in [street, apartment, city, postal_code, country] if part)

        with transaction.atomic():
            order = Order.objects.create(
                user=request.user if request.user.is_authenticated else None,
                full_name=full_name, email=email, phone=phone, country=country,
                region=region, street=street, apartment=apartment, city=city,
                postal_code=postal_code, delivery_notes=delivery_notes,
                address=address, shipping_total=shipping_total, total=total,
                status="new", payment_method="order_request",
            )
            for item in items:
                if item["source"] == "local":
                    OrderItem.objects.create(
                        order=order, product=item["product"],
                        quantity=item["quantity"], price=item["unit_price"],
                    )
                    product_item = Product.objects.select_for_update().get(pk=item["product"].pk)
                    product_item.stock = max(0, product_item.stock - item["quantity"])
                    product_item.save(update_fields=["stock"])
                else:
                    PrintifyOrderItem.objects.create(
                        order=order, product=item["product"], variant=item["variant"],
                        quantity=item["quantity"], price=item["unit_price"],
                    )

        request.session["cart"] = {}
        request.session["printify_cart"] = {}
        request.session.modified = True
        _send_order_emails(order)
        return render(request, "shop/success.html", {"order": order})

    return render(request, "shop/checkout.html", {
        "items": items, "subtotal": subtotal,
        "shipping_total": shipping_total, "total": total,
    })


# =========================================================
# REGISTER
# =========================================================

def register(request):
    if request.user.is_authenticated:
        return redirect("home")

    form = RegistrationForm(
        request.POST or None
    )

    if (
        request.method == "POST"
        and form.is_valid()
    ):
        email = (
            form.cleaned_data["email"]
            .strip()
            .lower()
        )

        username = (
            form.cleaned_data["username"]
            .strip()
        )

        if User.objects.filter(
            email__iexact=email
        ).exists():
            form.add_error(
                "email",
                (
                    "An account with this email "
                    "already exists."
                )
            )

            return render(
                request,
                "registration/register.html",
                {
                    "form": form
                }
            )

        if User.objects.filter(
            username__iexact=username
        ).exists():
            form.add_error(
                "username",
                (
                    "This username is "
                    "already taken."
                )
            )

            return render(
                request,
                "registration/register.html",
                {
                    "form": form
                }
            )

        try:
            _store_pending_registration(
                request,
                form
            )

        except Exception as exc:
            request.session.pop(
                _pending_registration_key(),
                None
            )

            request.session.modified = True

            logger.exception(
                "LE VAURÃ‰ verification "
                "email could not be sent."
            )

            if settings.DEBUG:
                messages.error(
                    request,
                    (
                        "Verification email "
                        f"error: {exc}"
                    )
                )
            else:
                messages.error(
                    request,
                    (
                        "We could not send the "
                        "verification email. "
                        "Your account was not "
                        "created yet."
                    )
                )

            return render(
                request,
                "registration/register.html",
                {
                    "form": form
                }
            )

        messages.success(
            request,
            (
                "We sent a 6-digit verification "
                "code to your email."
            )
        )

        return redirect(
            "verify_email"
        )

    return render(
        request,
        "registration/register.html",
        {
            "form": form
        }
    )


# =========================================================
# VERIFY EMAIL
# =========================================================

def verify_email(request):
    pending = (
        _get_pending_registration(
            request
        )
    )

    if not pending:
        messages.warning(
            request,
            (
                "Register first to verify "
                "your email."
            )
        )

        return redirect(
            "register"
        )

    try:
        expires_at = (
            _parse_iso_datetime(
                pending["expires_at"]
            )
        )

    except (
        KeyError,
        TypeError,
        ValueError
    ):
        request.session.pop(
            _pending_registration_key(),
            None
        )

        request.session.modified = True

        messages.error(
            request,
            (
                "Your verification session "
                "is invalid. "
                "Please register again."
            )
        )

        return redirect(
            "register"
        )

    if request.method == "POST":
        code = request.POST.get(
            "code",
            ""
        ).strip()

        if timezone.now() > expires_at:
            messages.error(
                request,
                (
                    "That code has expired. "
                    "Request a new one."
                )
            )

        elif (
            pending.get(
                "attempts",
                0
            )
            >= 8
        ):
            messages.error(
                request,
                (
                    "Too many incorrect attempts. "
                    "Request a new code."
                )
            )

        elif check_password(
            code,
            pending["code_hash"]
        ):
            username = (
                pending["username"]
            )

            email = (
                pending["email"]
            )

            password = (
                pending["password"]
            )

            if User.objects.filter(
                username__iexact=username
            ).exists():
                request.session.pop(
                    _pending_registration_key(),
                    None
                )

                request.session.modified = True

                messages.error(
                    request,
                    (
                        "That username is already "
                        "in use. "
                        "Please register again."
                    )
                )

                return redirect(
                    "register"
                )

            if User.objects.filter(
                email__iexact=email
            ).exists():
                request.session.pop(
                    _pending_registration_key(),
                    None
                )

                request.session.modified = True

                messages.error(
                    request,
                    (
                        "That email is already "
                        "registered. Please log in."
                    )
                )

                return redirect(
                    "login"
                )

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
            )

            request.session.pop(
                _pending_registration_key(),
                None
            )

            request.session.modified = True

            login(
                request,
                user
            )

            messages.success(
                request,
                (
                    "Email verified. "
                    "Welcome to LE VAURÃ‰."
                )
            )

            return redirect(
                "home"
            )

        else:
            pending["attempts"] = (
                pending.get(
                    "attempts",
                    0
                )
                + 1
            )

            request.session[
                _pending_registration_key()
            ] = pending

            request.session.modified = True

            messages.error(
                request,
                (
                    "Incorrect verification "
                    "code."
                )
            )

    return render(
        request,
        "registration/verify_email.html",
        {
            "email": pending["email"],
            "expires_at": expires_at
        },
    )


# =========================================================
# RESEND VERIFICATION
# =========================================================

@require_POST
def resend_verification(request):
    pending = (
        _get_pending_registration(
            request
        )
    )

    if not pending:
        messages.warning(
            request,
            "Register first."
        )

        return redirect(
            "register"
        )

    try:
        last_sent_at = (
            _parse_iso_datetime(
                pending["last_sent_at"]
            )
        )

    except (
        KeyError,
        TypeError,
        ValueError
    ):
        request.session.pop(
            _pending_registration_key(),
            None
        )

        request.session.modified = True

        messages.error(
            request,
            (
                "Your verification session "
                "is invalid. "
                "Please register again."
            )
        )

        return redirect(
            "register"
        )

    seconds_since_last_send = (
        timezone.now()
        - last_sent_at
    ).total_seconds()

    if seconds_since_last_send < 45:
        wait_seconds = max(
            1,
            45 - int(
                seconds_since_last_send
            )
        )

        messages.warning(
            request,
            (
                f"Please wait {wait_seconds} "
                "seconds before requesting "
                "another code."
            )
        )

        return redirect(
            "verify_email"
        )

    try:
        code = (
            _new_verification_code()
        )

        _send_verification_email(
            pending["email"],
            code,
            pending.get(
                "username",
                ""
            ),
        )

        _store_pending_verification(
            request,
            pending,
            code
        )

    except Exception as exc:
        logger.exception(
            "LE VAURÃ‰ verification "
            "email resend failed."
        )

        if settings.DEBUG:
            messages.error(
                request,
                (
                    "Verification email "
                    f"resend error: {exc}"
                )
            )
        else:
            messages.error(
                request,
                (
                    "Could not send the "
                    "verification email. "
                    "Please try again."
                )
            )

        return redirect(
            "verify_email"
        )

    messages.success(
        request,
        (
            "A new verification code "
            "was sent to your email."
        )
    )

    return redirect(
        "verify_email"
    )


# =========================================================
# LOGIN
# =========================================================

def login_view(request):
    if request.user.is_authenticated:
        return redirect("home")

    form = AuthenticationForm(
        request,
        data=request.POST or None
    )

    if request.method == "GET":
        next_url = request.GET.get(
            "next",
            ""
        )

        if next_url:
            request.session[
                "login_next"
            ] = next_url

    if (
        request.method == "POST"
        and form.is_valid()
    ):
        login(
            request,
            form.get_user()
        )

        next_url = request.session.pop(
            "login_next",
            None,
        )

        request.session.modified = True

        return redirect(
            next_url or "home"
        )

    return render(
        request,
        "registration/login.html",
        {
            "form": form
        },
    )


# =========================================================
# WISHLIST
# =========================================================

@login_required
def wishlist(request):
    wishlist_items = (
        Wishlist.objects
        .filter(user=request.user)
        .select_related(
            "product",
            "product__category",
        )
    )

    return render(
        request,
        "shop/wishlist.html",
        {
            "wishlist_items":
                wishlist_items
        },
    )


@login_required
@require_POST
def toggle_wishlist(request, pk):
    product_item = get_object_or_404(
        Product,
        pk=pk,
        active=True,
    )

    wishlist_item = (
        Wishlist.objects.filter(
            user=request.user,
            product=product_item,
        ).first()
    )

    if wishlist_item:
        wishlist_item.delete()

        messages.success(
            request,
            (
                f"{product_item.name} "
                "removed from wishlist."
            )
        )

    else:
        Wishlist.objects.create(
            user=request.user,
            product=product_item,
        )

        messages.success(
            request,
            (
                f"{product_item.name} "
                "added to wishlist."
            )
        )

    next_url = (
        request.POST.get("next")
        or request.META.get(
            "HTTP_REFERER"
        )
        or reverse("wishlist")
    )

    return redirect(
        next_url
    )
@login_required
@require_POST
def toggle_printify_wishlist(
    request,
    printify_id,
):
    product_item = get_object_or_404(
        PrintifyProduct,
        printify_id=printify_id,
        active=True,
    )

    wishlist_item = (
        Wishlist.objects.filter(
            user=request.user,
            printify_product=product_item,
        ).first()
    )

    if wishlist_item:
        wishlist_item.delete()

        messages.success(
            request,
            (
                f"{product_item.title} "
                "removed from wishlist."
            )
        )

    else:
        Wishlist.objects.create(
            user=request.user,
            printify_product=product_item,
        )

        messages.success(
            request,
            (
                f"{product_item.title} "
                "added to wishlist."
            )
        )

    next_url = (
        request.POST.get("next")
        or request.META.get(
            "HTTP_REFERER"
        )
        or reverse("shop")
    )

    return redirect(next_url)

# =========================================================
# ACCOUNT
# =========================================================

@login_required
def account(request):
    orders = Order.objects.filter(
        user=request.user
    )

    return render(
        request,
        "shop/account.html",
        {
            "orders": orders
        }
    )


# =========================================================
# LEGAL PAGES
# =========================================================

def privacy_policy(request):
    return render(
        request,
        "shop/legal/privacy.html"
    )


def terms(request):
    return render(
        request,
        "shop/legal/terms.html"
    )


def cookie_policy(request):
    return render(
        request,
        "shop/legal/cookies.html"
    )


def returns_policy(request):
    return render(
        request,
        "shop/legal/returns.html"
    )


def impressum(request):
    return render(
        request,
        "shop/legal/impressum.html"
    )


# =========================================================
# PRINTIFY PRODUCTS
# =========================================================

PRINTIFY_SHOP_ID = "28774925"


def _load_printify_products():
    """
    Fetch products from Printify, normalize them for the shop template,
    and synchronize them into the local PrintifyProduct tables so they
    are also visible in Django admin.

    Printify prices are stored in cents, so 3075 becomes Decimal("30.75").
    """
    api_token = getattr(
        settings,
        "PRINTIFY_API_TOKEN",
        ""
    ).strip()

    if not api_token:
        return [], "PRINTIFY_API_TOKEN is not configured."

    url = (
        "https://api.printify.com/v1/shops/"
        f"{PRINTIFY_SHOP_ID}/products.json"
    )

    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=15
        )
        response.raise_for_status()
        data = response.json()

    except (requests.RequestException, ValueError) as exc:
        logger.exception(
            "Printify API request failed."
        )
        return [], str(exc)

    normalized_products = []

    for raw_product in data.get("data", []):
        printify_id = str(
            raw_product.get("id", "")
        ).strip()

        if not printify_id:
            continue

        title = raw_product.get(
            "title",
            "Untitled product"
        )

        description = raw_product.get(
            "description",
            ""
        )

        # ---------------------------------------------
        # OPTION VALUE NAMES
        # ---------------------------------------------
        option_value_names = {}

        for option in raw_product.get("options", []):
            for value in option.get("values", []):
                value_id = value.get("id")

                option_value_names[value_id] = value.get(
                    "title",
                    str(value_id or "")
                )

        # ---------------------------------------------
        # VARIANTS
        # ---------------------------------------------
        raw_variants = raw_product.get(
            "variants",
            []
        )

        enabled_variants = []

        for variant in raw_variants:
            if not variant.get("is_enabled", False):
                continue

            option_titles = [
                option_value_names.get(
                    option_id,
                    str(option_id)
                )
                for option_id in variant.get("options", [])
            ]

            variant_title = (
                " / ".join(option_titles)
                or variant.get("title", "Variant")
            )

            variant_price = (
                Decimal(
                    str(variant.get("price", 0))
                )
                / Decimal("100")
            )

            enabled_variants.append(
                {
                    "id": variant.get("id"),
                    "title": variant_title,
                    "price": variant_price,
                    "is_available": variant.get(
                        "is_available",
                        True
                    ),
                }
            )

        prices = [
            variant["price"]
            for variant in enabled_variants
        ]

        product_price = (
            min(prices)
            if prices
            else Decimal("0.00")
        )

        # ---------------------------------------------
        # LOCAL PRINTIFY PRODUCT
        # ---------------------------------------------
        db_product, created = PrintifyProduct.objects.get_or_create(
            printify_id=printify_id,
            defaults={
                "title": title,
                "description": description,
                "price": product_price,
                "active": True,
                "featured": True,
                "sync_enabled": True,
            },
        )

        # Respect the admin Sync Enabled switch.
        # New records are synchronized immediately.
        if created or db_product.sync_enabled:
            changed_fields = []

            if db_product.title != title:
                db_product.title = title
                changed_fields.append("title")

            if db_product.description != description:
                db_product.description = description
                changed_fields.append("description")

            if db_product.price != product_price:
                db_product.price = product_price
                changed_fields.append("price")

            if changed_fields:
                db_product.save(
                    update_fields=changed_fields + ["updated_at"]
                )

            # -----------------------------------------
            # PRINTIFY IMAGES
            # -----------------------------------------
            raw_images = raw_product.get(
                "images",
                []
            )

            # Printify can return multiple mockups. The first item is not
            # always the storefront/default mockup, so prefer is_default.
            default_image_index = 0

            for index, image in enumerate(raw_images):
                if image.get("is_default", False):
                    default_image_index = index
                    break

            remote_image_urls = []

            for index, image in enumerate(raw_images):
                image_url = (
                    image.get("src", "")
                    or ""
                ).strip()

                if not image_url:
                    continue

                remote_image_urls.append(image_url)

                PrintifyProductImage.objects.update_or_create(
                    product=db_product,
                    printify_url=image_url,
                    defaults={
                        "is_primary": index == default_image_index,
                        "sort_order": index,
                    },
                )

            # Make sure an old image cannot remain marked as primary.
            if remote_image_urls:
                primary_url = (
                    raw_images[default_image_index].get("src", "")
                    or ""
                ).strip()

                if primary_url:
                    PrintifyProductImage.objects.filter(
                        product=db_product
                    ).exclude(
                        printify_url=primary_url
                    ).update(
                        is_primary=False
                    )

            # Remove only old API images.
            # Manually uploaded custom images are preserved.
            api_images = PrintifyProductImage.objects.filter(
                product=db_product,
                custom_image__isnull=True,
            )

            if remote_image_urls:
                api_images.exclude(
                    printify_url__in=remote_image_urls
                ).delete()
            else:
                api_images.exclude(
                    printify_url=""
                ).delete()

            # -----------------------------------------
            # PRINTIFY VARIANTS
            # -----------------------------------------
            current_variant_ids = []

            for variant in raw_variants:
                variant_id = variant.get("id")

                if variant_id is None:
                    continue

                current_variant_ids.append(variant_id)

                option_titles = [
                    option_value_names.get(
                        option_id,
                        str(option_id)
                    )
                    for option_id in variant.get("options", [])
                ]

                variant_title = (
                    " / ".join(option_titles)
                    or variant.get("title", "Variant")
                )

                variant_price = (
                    Decimal(
                        str(variant.get("price", 0))
                    )
                    / Decimal("100")
                )

                PrintifyVariant.objects.update_or_create(
                    printify_variant_id=variant_id,
                    defaults={
                        "product": db_product,
                        "title": variant_title,
                        "price": variant_price,
                        "available": variant.get(
                            "is_available",
                            True
                        ),
                        "enabled": variant.get(
                            "is_enabled",
                            True
                        ),
                    },
                )

            stale_variants = PrintifyVariant.objects.filter(
                product=db_product
            )

            if current_variant_ids:
                stale_variants.exclude(
                    printify_variant_id__in=current_variant_ids
                ).delete()
            else:
                stale_variants.delete()

        # ---------------------------------------------
        # TEMPLATE-FRIENDLY DATA
        # ---------------------------------------------
        raw_images = raw_product.get("images", [])
        image_url = ""

        if raw_images:
            default_image = next(
                (
                    image
                    for image in raw_images
                    if image.get("is_default", False)
                ),
                raw_images[0],
            )

            image_url = (
                default_image.get("src", "")
                or ""
            ).strip()

        normalized_products.append(
            {
                "id": printify_id,
                "title": title,
                "image": image_url,
                "variants": enabled_variants,
                "price": product_price,
            }
        )

    return normalized_products, None


def printify_products(request):
    products, error = _load_printify_products()

    if error:
        return JsonResponse(
            {
                "ok": False,
                "error": error,
            },
            status=502
        )

    return render(
        request,
        "shop/printify_products.html",
        {
            "products": products,
        },
    )

# =========================================================
# DESIGN STUDIO API
# =========================================================

def _design_row():
    row, _ = SiteDesign.objects.get_or_create(key="main")
    return row


def _design_staff_required(request):
    return bool(request.user.is_authenticated and request.user.is_staff)


@csrf_exempt
def design_state(request):
    """
    GET:
      ?mode=draft     -> staff draft (published for non-staff)
      ?mode=published -> public published design

    POST JSON:
      {"mode": "draft"|"published", "patches": {...}}
      Staff only.
    """
    row = _design_row()

    if request.method == "GET":
        mode = (request.GET.get("mode") or "published").strip().lower()
        if mode == "draft" and _design_staff_required(request):
            patches = row.draft or {}
        else:
            mode = "published"
            patches = row.published or {}

        return JsonResponse({
            "ok": True,
            "mode": mode,
            "patches": patches,
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            "published_at": row.published_at.isoformat() if row.published_at else None,
        })

    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "Method not allowed."}, status=405)

    if not _design_staff_required(request):
        return JsonResponse({"ok": False, "error": "Staff access required."}, status=403)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({"ok": False, "error": "Invalid JSON."}, status=400)

    mode = str(payload.get("mode") or "draft").strip().lower()
    patches = payload.get("patches")

    if mode not in {"draft", "published"}:
        return JsonResponse({"ok": False, "error": "Invalid mode."}, status=400)
    if not isinstance(patches, dict):
        return JsonResponse({"ok": False, "error": "patches must be an object."}, status=400)

    if mode == "published":
        row.published = patches
        row.draft = patches
        row.published_at = timezone.now()
        row.save(update_fields=["published", "draft", "published_at", "updated_at"])
    else:
        row.draft = patches
        row.save(update_fields=["draft", "updated_at"])

    return JsonResponse({
        "ok": True,
        "mode": mode,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "published_at": row.published_at.isoformat() if row.published_at else None,
    })


@csrf_exempt
@require_POST
def design_upload(request):
    """Upload Design Studio image/video to MEDIA_ROOT/design-studio/."""
    if not _design_staff_required(request):
        return JsonResponse({"ok": False, "error": "Staff access required."}, status=403)

    upload = request.FILES.get("file")
    if upload is None:
        return JsonResponse({"ok": False, "error": "No file uploaded."}, status=400)

    content_type = (getattr(upload, "content_type", "") or "").lower()
    is_image = content_type.startswith("image/")
    is_video = content_type.startswith("video/")
    if not (is_image or is_video):
        return JsonResponse({"ok": False, "error": "Only image/video files are allowed."}, status=400)

    # 150 MB hard limit for banner media.
    if upload.size > 150 * 1024 * 1024:
        return JsonResponse({"ok": False, "error": "File is larger than 150 MB."}, status=413)

    original = get_valid_filename(os.path.basename(upload.name or "media"))
    stem, ext = os.path.splitext(original)
    stem = (stem or "banner")[:80]
    ext = ext.lower()[:12]
    filename = f"design-studio/{timezone.now():%Y/%m}/{stem}-{secrets.token_hex(6)}{ext}"

    saved_name = default_storage.save(filename, ContentFile(upload.read()))
    url = default_storage.url(saved_name)

    return JsonResponse({
        "ok": True,
        "url": url,
        "kind": "video" if is_video else "image",
    })

