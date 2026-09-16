LE VAURÉ Reference Rebuild V2

This package keeps the working Django API integration and upgrades the Collections and Account experiences to match the supplied premium LE VAURÉ reference direction more closely.

Notable changes:
- Collections: large visual merchandising lead, 3-up collection grid, editorial story section, values strip, admin-data fallback behavior.
- Account: premium dashboard, quick stats, styled order history, saved address panel, improved signed-out state.
- Existing Home / Shop / Product / Wishlist / Cart / Checkout routes are preserved.
- /backend-api/* proxy route remains included.

Run:
  npm install
  npm run dev

Django remains on port 8000.
