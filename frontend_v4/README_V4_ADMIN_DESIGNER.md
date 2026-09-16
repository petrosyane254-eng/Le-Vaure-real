# LE VAURÉ V4 — Admin-controlled design system

This package keeps the existing Django shop/database architecture and upgrades the storefront so the visual content can be managed from Django Admin.

## New Admin controls

### Storefront settings
Global theme colors:
- Primary / accent
- Page background / soft background
- Main text / muted text / borders
- Announcement background / text
- Header background / text
- Footer background / text
- Button background / text / hover colors
- Announcement text, brand name/tagline, support/social/footer data

### Home hero slides
- Eyebrow, title, subtitle
- Desktop/mobile image
- Primary CTA + secondary CTA
- Text color
- Button colors
- Overlay color + opacity
- Left / center / right text position
- Background image position
- Desktop/mobile hero height
- Active/order

### Promo banners
- Eyebrow, title, subtitle, image
- CTA label/link
- Text/button/overlay colors
- Overlay opacity
- Text position
- Image position
- Desktop/mobile height
- Placement/order/active

### Editorial blocks
- Eyebrow/title/body/image
- CTA
- Image side + image position
- Background/text/muted text colors
- Placement/order/active

### Storefront sections
Admin can edit or disable:
- Shop by category
- Featured products
- Feature stories
- Latest products
- Story section
- Service benefits
- Newsletter

Each section has eyebrow/title/body/CTA/background/text colors and active/order controls.

### Store benefits
Manage benefit icon/title/text/order/visibility (delivery, returns, secure checkout, quality, support).

## Install on the existing project

1. Back up the project/database first.
2. Copy these backend patch files into the project root, replacing the same files:
   - `backend_patch/shop/models.py` -> `shop/models.py`
   - `backend_patch/shop/admin.py` -> `shop/admin.py`
   - `backend_patch/shop/api.py` -> `shop/api.py`
   - `backend_patch/shop/migrations/0013_storefront_designer.py` -> `shop/migrations/0013_storefront_designer.py`
3. Run:

```powershell
cd C:\Users\erikp\Desktop\LEVAURE_NEW
python manage.py migrate
python manage.py runserver 8000
```

4. Use `frontend_v4` as the Next.js frontend:

```powershell
taskkill /F /IM node.exe
cd C:\Users\erikp\Desktop\LEVAURE_NEW\frontend_v4
npm install
npm run dev
```

5. Admin:
`http://127.0.0.1:8000/southward-control-7x9/`

The migration automatically creates default Storefront Sections and Store Benefits, so the new controls are visible immediately after migration.

## Important

The supplied patch does not delete products, orders, users, collections, media, or the SQLite database. It adds new design-control fields/models.
