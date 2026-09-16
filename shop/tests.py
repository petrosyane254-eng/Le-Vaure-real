from django.test import TestCase
from django.urls import reverse


class StorefrontSmokeTests(TestCase):
    def test_homepage_responds(self):
        response = self.client.get(reverse("home"))
        self.assertIn(response.status_code, (200, 302))

    def test_shop_responds(self):
        response = self.client.get(reverse("shop"))
        self.assertIn(response.status_code, (200, 302))
