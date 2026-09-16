from django.urls import path
from django.contrib.auth.views import LogoutView
from django.contrib.sitemaps.views import sitemap
from django.views.generic import TemplateView

from . import views
from .sitemaps import StaticViewSitemap, ProductSitemap

sitemaps = {
    "static": StaticViewSitemap,
    "products": ProductSitemap,
}

urlpatterns = [
    path("sitemap.xml", sitemap, {"sitemaps": sitemaps}, name="sitemap"),
    path("robots.txt", TemplateView.as_view(template_name="robots.txt", content_type="text/plain"), name="robots_txt"),

    path("", views.home, name="home"),
    path("shop/", views.shop, name="shop"),
    path("site-access/", views.site_access, name="site_access"),
    path("product/<slug:slug>/", views.product, name="product"),

    path("cart/", views.cart, name="cart"),
    path("cart/add/<int:pk>/", views.add_cart, name="add_cart"),
    path("cart/update/<int:pk>/", views.update_cart, name="update_cart"),

    path("checkout/", views.checkout, name="checkout"),

    path("register/", views.register, name="register"),
    path("verify-email/", views.verify_email, name="verify_email"),
    path("resend-verification/", views.resend_verification, name="resend_verification"),
    path("login/", views.login_view, name="login"),
    path("logout/", LogoutView.as_view(next_page="home"), name="logout"),

    path("account/", views.account, name="account"),

    path("wishlist/", views.wishlist, name="wishlist"),
    path("wishlist/toggle/<int:pk>/", views.toggle_wishlist, name="toggle_wishlist"),

    path("privacy/", views.privacy_policy, name="privacy"),
    path("terms/", views.terms, name="terms"),
    path("cookies/", views.cookie_policy, name="cookies"),
    path("returns/", views.returns_policy, name="returns"),
    path("impressum/", views.impressum, name="impressum"),

    # Design Studio persistence / media
    path("design/state/", views.design_state, name="design_state"),
    path("design/upload/", views.design_upload, name="design_upload"),

]
