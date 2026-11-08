# Customer delivery bell — 2026-11-08

The notification service now calls Spring notification APIs, instead of silently returning empty data unless legacy mode is configured. While the page is visible the bell polls every 10 seconds; an open panel refreshes its list as well. Focusing the window also refreshes it. This uses HTTP polling, not socket or operating-system push.

Delivery notices remain in the Order category and use the supplied buyer-order deep link. Live detection now checks the `LIVE_` prefix: `ORDER_DELIVERED` contains the letters `LIVE` and must never be treated as a live broadcast or marked read only in browser storage.

API failures show a retry state instead of an empty inbox. Failed read requests preserve the unread state. Account changes clear the old account's notification list and reject its pending responses.

## Validation

- `npm run build`: passed.
- `npm run lint`: passed; existing warnings remain.
- `tests/delivery-notifications.browser.test.mjs`: passed in Edge against the full App with intercepted API fixtures. Covered an open panel receiving a delivery through the regular 10-second poll, badge count, correct Order display, failed read/read-all, successful Spring read request, exact buyer-order navigation, read persistence after reload, account isolation, error display and recovery.
- Screenshot inspected: `.validation/delivery-notification-20261108.png` (workspace artifact, not committed).

Backend integration and local PostgreSQL validation are documented in the BE repository. Restart Order and Gateway after applying the supplied Order migration. Existing local delivered orders will then appear when the correct buyer signs in. Browser validation did not send messages or modify real orders.
