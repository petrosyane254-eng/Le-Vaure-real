# LE VAURÉ V5 — Full Admin Design Control

This package extends V4 so the storefront can be edited from Django Admin without changing React/CSS for common merchandising changes.

## New admin controls

### Storefront settings
- footer column titles
- payment section title
- comma-separated payment labels
- footer copyright line
- product card image ratio
- product card corner radius
- product grid gap
- existing global/header/footer/button colors remain supported

### Shop page settings
- hero eyebrow/title/subtitle/breadcrumb label
- search placeholder
- category/size/color/price headings
- clear filters / all products / loading / empty labels
- show/hide sidebar, search and each filter group
- desktop products-per-row (2–4 recommended)
- shop hero/sidebar/card colors

### Page sections
Reusable admin sections for About, Account, Collections, Shop, Journal, Wishlist, Cart and Checkout. Each section can control:
- page + stable key
- eyebrow/title/body
- image and image position
- CTA label/link
- background/text/muted/button colors
- layout (text, image-left, image-right, banner, cards)
- minimum height
- active + ordering

V5 frontend already consumes Page Sections for About, Account and Collections. The model is also ready for the other internal pages.

## Install / update backend
Copy the contents of `backend_patch/shop/` into your existing `shop/` folder. Keep your database and media folder.

Then run:

```powershell
cd C:\Users\erikp\Desktop\LEVAURE_NEW
python manage.py migrate
python manage.py runserver 8000
```

If V4 migration `0013_storefront_designer` is already applied, Django will only apply `0014_full_page_designer`.

## Run frontend
Use the `frontend_v5` folder:

```powershell
cd C:\Users\erikp\Desktop\LEVAURE_NEW\frontend_v5
npm install
npm run dev
```

Open:
- Storefront: http://127.0.0.1:3000/
- Admin: http://127.0.0.1:8000/southward-control-7x9/

## Admin areas to edit
- Storefront settings
- Shop page settings
- Page sections
- Home hero slides
- Promo banners
- Editorial blocks
- Storefront sections
- Store benefits
- Navigation items
- Collections
- Products / variants / colors / sizes

No product/order/customer data is intentionally deleted by these migrations.
