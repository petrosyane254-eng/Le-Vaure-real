# LE VAURÉ — Next.js + Django storefront rebuild

This build keeps Django as the commerce/admin backend and adds a separate Next.js storefront in `frontend/`.

## What is admin-managed

From Django Admin you can now manage:

- Storefront brand name, premium green/accent colors, announcement text, support details and social links.
- Header/footer navigation.
- Homepage hero slides (desktop/mobile image, copy, CTA, alignment, ordering, active state).
- Promotional / advertising banners.
- Editorial image/text blocks.
- Collections and which products belong to them.
- Journal posts.
- Products and product gallery images.
- Product variants: color, size, SKU, stock, optional variant-specific price and image.
- Customers, saved addresses, orders, order verification state and password reset state.

The Next.js storefront reads this content from `/api/`, so campaign imagery and homepage advertising do not require frontend code changes.

## Frontend pages

- `/` Homepage
- `/shop`
- `/collections`
- `/collections/[slug]`
- `/product/[slug]`
- `/about`
- `/journal`
- `/journal/[slug]`
- `/wishlist`
- `/cart`
- `/checkout`
- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`
- `/account`
- `/order-success`

The visual direction is an original LE VAURÉ premium retail system inspired by high-end outdoor/fashion e-commerce patterns, not a pixel-for-pixel copy of another brand.

## Authentication / customer flows

- Registration with a 6-digit email verification code.
- Session-based login/logout.
- Password reset with a 6-digit email code.
- Wishlist per signed-in user.
- Saved address backend.
- Account order history.
- Order confirmation email with a 6-digit verification code.

Email uses the Django email configuration already present in this project (Resend/SMTP/console depending on environment).

## Cart and inventory

The new storefront cart stores **variant IDs**, not only product IDs. That means Black / M and Green / L are distinct cart items. Checkout locks the selected variants in a database transaction, validates stock again, creates the order, stores color/size snapshots, and reduces stock.

## Payment

Stripe stays removed. This version creates a verified order with `payment_method="manual"`. Add your chosen Armenian/international payment provider later behind the checkout API. The storefront has deliberately been structured so the payment provider can be added without rebuilding products, cart or account logic.

## First run

Backend:

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_next_storefront
python manage.py createsuperuser
python manage.py runserver 8000
```

Frontend, in a second terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://127.0.0.1:3000` for the Next.js storefront and `http://127.0.0.1:8000/southward-control-7x9/` for Django Admin.

## Important setup in Admin

1. Open **Storefront settings** and set brand/support data.
2. Create at least one **Home hero slide** with an image. Until then the Next.js homepage uses the bundled fallback hero.
3. Create **Product Colors** and **Product Sizes** (the seed command creates standard defaults).
4. Open each Product and create its variants. Products without variants can be browsed but cannot be added through the new variant-aware Next cart.
5. Create Collections, promotional banners, editorial blocks and Journal posts.

## Production notes

Before production, set a strong `SECRET_KEY`, `DEBUG=0`, PostgreSQL, real email credentials, storage/CDN settings and the correct `ALLOWED_HOSTS` / `CSRF_TRUSTED_ORIGINS`. Put Django and Next.js behind the same public domain/reverse proxy if possible. The Next config already proxies `/api/*` and `/media/*` to Django during development.

The legacy Django-template storefront is kept as a fallback while the Next.js frontend is developed. The new API is additive, so you can migrate gradually instead of throwing away the working backend.
