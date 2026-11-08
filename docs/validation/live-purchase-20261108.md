# Livestream purchase and factual UI — 2026-11-08

The live shopping bag uses the real store name, verified flag, available rating/count and actual session products. Removed the hardcoded Mall label, 4.5 rating, 419.1K sales, 80.1K followers, empty-cart badge 99 and invented category tabs. Missing product/host photos use the neutral placeholder. The stage has no default photograph of an unrelated person; explicitly selected studio backgrounds remain available.

Profile popovers no longer invent followers, likes, identity verification, trust scores, membership dates or social accounts. Removed simulated Follow actions; the header opens the actual storefront. The share action copies the room link and only reports success after clipboard completion. Live voucher codes/discounts come from published, unexpired drops; copying a code does not claim a saved voucher or a guaranteed checkout discount.

Host Studio reads paid-order counts, GMV, net sales, quantities and buyers from the existing authorized `/livestream-sales/{id}` endpoint. Missing summaries show an unavailable state. The UI no longer assumes a 10% commission, 8.4% conversion or shop earnings calculated from those assumptions. The countdown no longer loops through invented five-minute windows.

## Buying

1. Buy/cart opens the picker and reads fresh landing, session membership and commerce data. It validates that the product is purchasable, belongs to the store and is attached to the currently LIVE session.
2. The picker shows the product image, active sizes/colors, exact selected-variant price, original price when discounted, available quantity, quantity controls and subtotal. A deal for one size never prices another size. Quantity is limited by real stock and the remaining live offer allocation.
3. Confirmation refreshes those APIs again. Price/offer changes or reduced quantity require review and another confirmation. An unavailable product/API cannot silently use cached prices. Leaving the room, changing account, disconnecting or ending the session prevents purchase with stale state.
4. Confirmed lines carry actual product/store/variant IDs, SKU, quantity, ordinary unit price and live unit price into the existing cart/checkout. Active published voucher suggestions are retained. Buy now navigates to the customer `/checkout` page. The signed live connection remains mounted in the background; checkout obtains the room proof and authoritative quote through its existing server contract. The bag cart button opens the real cart.

The picker does not reserve stock. Product/Order checkout remains responsible for transactional reservations, final pricing, discounts, delivery and payment. A sold-out/expired offer may revert to the ordinary catalog price, displayed and confirmed before checkout. Voucher and shipping eligibility are resolved at checkout.

## Verification

- `live-purchase.test.mjs`, `live-checkout-contract.test.mjs`, `live-session-spring.test.mjs`: 12 tests passed.
- `livestream-commerce.browser.test.mjs`: passed against an isolated real Socket.IO relay and API fixtures. Covered shop pin/price/voucher publication, no invented bag facts, quota controls, cart quantity 2, fresh-price confirmation, a size becoming sold out, another size retaining its ordinary price, navigation to `/checkout`, and actual checkout quote payload containing variant UUID, quantity, livestream ID and room proof.
- Picker screenshot visually inspected: `.validation/live-purchase-picker-20261108.png` (workspace QA artifact).
- Production build and lint passed; existing repository warnings remain.

No real order was submitted and no wallet or bank payment was charged. No database rows, credentials or backend services were changed for this task.

## Checkout page and sharing follow-up

The `/checkout` page reuses the shared checkout form with `navigationMode=page`. The cart records the chosen presentation mode before navigation, preventing the global popup from opening during route transitions. The older modal-history hook cannot push the page back to the live URL. A stale modal location also cannot overwrite a navigation that is already in progress. Header Back and browser Back close the page checkout and restore the live source without reopening the old popup.

Checkout recovery stores only product selection/coupon snapshots in session storage, scoped to the buyer and limited to 30 minutes. It stores no shipping details or room tokens. A reload restores the selected lines, rejoins the signed background live connection, and waits for room proof before asking checkout for authoritative quotes. Non-customer workspaces remain guarded.

Sharing opens a dialog with an explicitly local link and a separately checked public link. Missing public setup is explained in the dialog; it does not block copying the local URL or pretend that localhost is reachable from another computer. No public deployment or tunnel was created.

Follow-up validation: 16 checkout recovery/ownership/return-path, local/public URL and purchase contract tests passed. The real-relay browser scenario verifies `/checkout`, server quote proof, reload recovery, both Back paths and the local-only share state. The existing product/cart modal Back browser regression also passed. Checkout and share screenshots were visually inspected. The shop early/late start policy was already validated by Product integration tests; its running IntelliJ process must be restarted to load the changed classes.
