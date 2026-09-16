from django.urls import path
from . import api

urlpatterns = [
    path("csrf/", api.csrf),
    path("bootstrap/", api.bootstrap),
    path("home/", api.home),
    path("content/editorials/<str:placement>/", api.editorial_blocks),
    path("products/", api.products),
    path("products/<slug:slug>/", api.product_detail),
    path("collections/", api.collections_list),
    path("collections/<slug:slug>/", api.collection_detail),
    path("journal/", api.journal_list),
    path("journal/<slug:slug>/", api.journal_detail),

    path("auth/register/", api.register),
    path("auth/verify-email/", api.verify_email),
    path("auth/resend-verification/", api.resend_verification),
    path("auth/login/", api.login_api),
    path("auth/logout/", api.logout_api),
    path("auth/me/", api.me),
    path("auth/forgot-password/", api.forgot_password),
    path("auth/reset-password/", api.reset_password),

    path("cart/", api.cart_get),
    path("cart/add/", api.cart_add),
    path("cart/item/<int:variant_id>/", api.cart_item),

    path("wishlist/", api.wishlist_get),
    path("wishlist/toggle/<int:product_id>/", api.wishlist_toggle),

    path("account/addresses/", api.addresses),
    path("account/orders/", api.orders),

    path("checkout/", api.checkout),
    path("orders/<int:order_id>/verify/", api.verify_order),
]
