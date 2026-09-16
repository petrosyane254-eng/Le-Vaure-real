# LE VAURÉ Premium Frontend

This is the premium Next.js storefront package designed for the existing Django backend.

## Run
1. Keep Django running at `http://127.0.0.1:8000`.
2. In this frontend folder run:
   - `npm install`
   - `npm run dev`
3. Open `http://localhost:3000`.

## API proxy
The storefront uses `/backend-api/*` and proxies it to Django `/api/*` through `next.config.ts`.

## Admin-driven content
Homepage hero, promo, collections, editorials, navigation, site settings and featured products are read from Django Admin. If the Home API is temporarily unavailable, a local premium fallback is shown instead of an endless loading screen.
