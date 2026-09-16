# LE VAURÉ

Django storefront rebuilt around the LE VAURÉ premium dark-green design system.

## Included
- Editorial homepage
- Shop and product pages
- Wishlist
- Shopping cart
- Checkout / order request flow
- Account, login and registration
- Django admin and existing product/order database

## Payments
No third-party card payment provider is bundled. Checkout records a new order request and can be connected to your preferred payment method later.

## Local setup
1. Create a virtual environment.
2. `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and set your local values.
4. `python manage.py migrate`
5. `python manage.py runserver`
