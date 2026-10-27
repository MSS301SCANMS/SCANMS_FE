# Livestream integration with develop — 2026-10-27

Branch: `feat/livestream-commerce-sync-20261027`.
Develop integrated: `ee54221e4eada1a4dd81f9b7feddf11b61b52ab7`.

## Merge decisions

Conflicts in `GuestCheckoutModal.tsx` and `checkout.service.ts` were resolved by retaining develop's voucher UI and the Spring checkout/live-room integration.

- One goods voucher (shop or platform) and one shipping voucher, matching the current Order contract.
- Backend quote determines voucher eligibility and amounts; public catalog metadata only controls the UI section.
- Wait for the shipping quote before automatic selection. Stable checkout inputs prevent unrelated parent renders from clearing freeship.
- Manual selection invalidates pending automatic suggestions.
- Preserve live-room proof/referral fields, expected shipping/payable totals, Spring Order creation and Payment wallet confirmation.
- Fetch addresses for the current session; do not reuse addresses cached by another account.

## Verification

- `npm run build`: passed (TypeScript and Vite; existing bundle-size warning).
- `npm test`: 140 passed, seven failed, 102 skipped. The same seven failures were reproduced on a detached checkout of develop `ee54221`; they are not introduced by this merge.
- New voucher quote tests verify server authority, rejected eligibility and forwarding live-room proof.
- Isolated browser checks verify automatic/manual voucher selection, both voucher categories, invalid codes, delayed responses, private address isolation, Order/Payment requests, camera/audio, shared viewers/hearts and live commerce.
- Browser/API fixtures are separate from the real database and payment providers. PayOS settlement and high-concurrency audience capacity were not validated by these fixtures.

## Existing develop test failures

1. `live-voucher-drop.test.mjs`: legacy `/live-sessions` expectation differs from `/livestreams`.
2. `login-identifier.test.mjs`: unavailable legacy backend test dependency/module.
3. `manual-orders.browser.test.mjs`: unavailable legacy backend `jsonwebtoken` dependency.
4. Marketplace source test: external `docs/ui-ux/NGUYENDINHTUAN/index.html` fixture missing.
5. Marketplace API source test: expects inline Bearer code now handled by `auth-session`.
6. Sidebar source test: expects links inside the former monolithic Sidebar.
7. Sidebar layout source test: same source structure changed to `SidebarShell`.

These tests were not skipped or weakened to hide failures. Browser tests require `GHN_UI_TEST_URL` and `GHN_UI_BROWSER_PATH`; relay fixtures also use an isolated `LIVE_TEST_RELAY_PORT`.

## Follow-up merge with develop `462d919` (2026-10-27)

New develop commits decomposed checkout into address/policy/summary sections and `useCheckoutQuote`, added shipping destinations and moved wallet payment into `checkout.service`. Three files conflicted:

- `src/components/checkout/GuestCheckoutModal.tsx`
- `src/services/checkout.service.ts`
- `src/services/checkout-voucher.service.ts`

Resolution preserves that component/hook structure, shipping destinations and service-owned wallet payment, together with live purchase proof, scoped live prices, multiple live voucher candidates, automatic recommendations and manual-choice precedence. The service checks expected totals before attempting a wallet debit. Account changes discard private form state; token renewal preserves drafts.

Additional integration changes forward shipping destinations through manual voucher previews and live origin through the shipping hook. The privacy browser fixture now supplies the additional chat API export imported by develop. Commission schedule tests transpile their TypeScript utility so the existing assertions also run on Node 22.14 without an experimental loader.

Validation:

- Production build passed.
- Node suite: 154 passed, seven pre-existing develop failures, 112 skipped. A detached checkout of develop `462d919` reproduced all seven remaining failures (plus the legacy PayOS, platform timestamp and TypeScript-loader issues corrected on this branch).
- Eight focused checkout/quote/payment tests passed, including changed totals preventing any wallet call, one debit per unpaid order, no debit for an already paid order and preservation of reconciliation status.
- Six browser cases passed using isolated API fixtures: automatic/manual vouchers, simulated shipping, GHN sandbox shipping, account isolation/refresh, real WebRTC camera/audio/shared counts and live price/pin/voucher updates. No real payment was made.
- Registration changes being developed in the primary workspace were kept outside this merge.
