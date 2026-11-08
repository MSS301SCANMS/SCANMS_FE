# Chat workspace on web — 08/11/2026

## Changes

- Replace the narrow Spring chat placeholder with a desktop inbox matching the reference:
  conversation sidebar, search, unread filter, peer header, content tabs, pending-deal notice,
  message bubbles and attachment/composer toolbar. `/chat` uses the viewport; embedded merchant
  routes and the existing floating launcher reuse the same workspace.
- Preserve existing Product chat persistence, UUID retry identity, authenticated binary downloads,
  realtime events and polling fallback. No fake conversation, user, product, presence or deal data is added.
- Automatically select an available conversation after inbox loading. Distinguish loading, true empty
  data and request errors; expose retry and show a useful empty-state action.
- Customers have messages/products/attachments. KOLs additionally see actual partnership invitations,
  accepted shop contacts, commission negotiation and sample requests. Shops can select accepted KOL
  partners or customer conversations and respond to existing deals/sample requests through existing APIs.
- Reuse invitation list/respond/cancel APIs, the existing product catalog and resource cards.
  Accepting an invitation refreshes the accepted-partner list; it does not fabricate a chat history.
- Scope collaboration queries to account and workspace. Switching account resets private drafts,
  pending uploads and inbox; switching to customer mode hides KOL-only controls and cached deal notices.
- Admin/manager retain their workspace label and correct back navigation. No permission to inspect
  other users' conversations is added; existing server membership remains authoritative.
- Restore `/merchant/messages` and `/collaborator/messages` to the actual chat page rather than
  redirecting them to orders/dashboard. Existing `/merchant/customer-messages` and `/chat` remain supported.
- Drafts and selected files survive the conversation's products/messages tab switch. Addresses in the
  sample composer reset when changing conversation. Presence uses the existing protected/public contract,
  and a disabled socket shows server synchronization rather than pretending a live socket is connected.

## Validation

- `npm.cmd run build` and `npm.cmd run lint`; existing unrelated lint/chunk-size warnings remain.
- `tests/shop-chat-entry.browser.test.mjs`: actual App → shop Chat ngay → send text/image/PDF,
  failed-upload retry, authenticated download, full-page navigation and history reload.
- `tests/store-chat-web.browser.test.mjs`: two browser accounts use the real local Socket.IO relay;
  lost ACK/retry, shop reply, reload, commission counter/accept, sample create/approve/ship/receive.
- `tests/chat-workspace-roles.browser.test.mjs`: full App for customer/KOL/shop/admin/manager;
  auto-selection, product catalog tab, retained draft, invitation acceptance, sample isolation by peer,
  KOL→customer mode, account switch, empty inbox, failed inbox and manual recovery.
- Browser API/identity fixtures isolate tests from real accounts. Screenshots are in the local
  `.validation/chat-workspace-*-20261108.png` files, not bundled as app data.

## Run

Reload FE (Ctrl+F5) after the update. No new BE endpoint, DB migration or service restart is needed
for this UI update. Product/Gateway are needed for messages; Promotion/Affiliate is additionally needed
for invitations, commission and samples. Its failure is visible and does not replace existing conversations.
