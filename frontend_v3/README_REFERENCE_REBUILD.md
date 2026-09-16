# LE VAURÉ Reference Rebuild

This frontend rebuild follows the supplied LE VAURÉ visual references: compact black announcement bar, centered brand header, editorial hero, filter sidebar + 4-column product catalog, campaign split, collection tiles, editorial brand story, wishlist/cart/checkout layouts, and a black premium footer.

## Backend connection
- Django: http://127.0.0.1:8000
- Next: http://127.0.0.1:3000
- Frontend requests use `/backend-api/*`.
- A Next catch-all route proxies those requests to Django `/api/*`, so no `/backend-api` rewrite is required.

## Install
1. Replace only your existing `frontend` folder with this folder. Do not replace Django files (`shop`, `scorpion`, `manage.py`, `db.sqlite3`, `media`).
2. In the frontend folder run:
   npm install
   npm run dev
3. In a second terminal from the Django project root run:
   python manage.py runserver 8000
4. Open http://127.0.0.1:3000

Product images and product data are loaded from Django Admin. If an item has no image, a LE VAURÉ placeholder is shown.
