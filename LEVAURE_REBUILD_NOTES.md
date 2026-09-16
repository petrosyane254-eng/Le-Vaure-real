# LE VAURÉ rebuild notes

## Design
- Premium dark green brand system (`#0B2F26`) with warm cream neutrals.
- Reworked Shop, Product, Wishlist, Cart, Checkout, Account, Login and Register presentation.
- Homepage keeps the supplied editorial LE VAURÉ structure and now inherits the premium-green system.
- Responsive layouts included in `static/css/premium-green.css`.

## Checkout
- Third-party card payment integration removed.
- Checkout now creates an internal `Order` with status `new` and payment method `order_request`.
- Cart is cleared after a successful order request and the customer sees the order confirmation page.

## Cleanup
- No Shopify references remain in source files.
- Removed provider-specific payment settings, routes, model fields, tests and dependencies.
- Removed provider-specific columns from the bundled SQLite database.
- Removed local virtual environment, IDE files, Python caches, backups and secret `.env` from the package.
- `.env.example` is sanitized.
