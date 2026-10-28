# Teacher feedback validation

## Implemented screens

- Checkout shows listed variant price × quantity, separate live savings, goods voucher, shipping and shipping voucher. It displays the wallet shortage and disables wallet submission until funds can be verified and cover the total.
- Customer cancellation now calls Order; confirmed orders show a pending shop decision. Shop order details can approve/reject with a reason. Refund status explicitly names the SCANMS wallet.
- Search records submitted queries and shows account-specific recent searches; clearing and account switching do not restore stale cached results.
- Homepage product cards show sold quantities from Product/Order aggregates. Remaining stock still controls quantity validation.
- Live interruption is visible and blocks new live deal actions while the publisher reconnects. Existing order snapshots remain unchanged.

For backend rules, migration and WebRTC/P2P capacity limits, see `SCANMS_BE/docs/TEACHER_FEEDBACK_20261028.md`.

## Evidence

- Production TypeScript/Vite build passes. Existing bundle-size warning remains.
- Regular Node suite: 163 passed, 7 known baseline failures, 117 environment-dependent cases skipped (287 cases). Selected browser fixtures below were then run explicitly with Edge.
- Checkout browser fixture passes: 300,000 × 2 listed = 600,000; live savings 100,000; shipping 30,000; payable 530,000. Wallet 200,000 blocks checkout and reports 330,000 missing. Reloading a sufficient balance permits one order/payment request.
- Cancellation browser fixture passes: reason required, real customer API client submits, empty shop rejection stays client-side, actual shop API client approves, wallet refund destination displayed.
- Search history browser fixture passes: StrictMode deduplication, delayed-read protection, Alice/Bob account isolation, scoped clearing.
- Live commerce browser fixture passes with a publishing host: real relay pin/unpin, isolated live price, size selection, platform and live voucher display.
- Camera/browser fixture passes with synthetic camera/microphone, real WebRTC, independent KOL/customer/shop contexts.
- Checkout session privacy fixture passes after the wallet/pricing changes.
- New amount/action unit tests pass. Relay tests pass (5/5).

The regular Node suite retains seven previously reproduced develop failures: legacy live-voucher expectation; login-identifier legacy backend import; manual-orders missing dependency; absent external prototype HTML; outdated inline-Bearer source assertion; two outdated Sidebar source assertions. See `livestream-develop-merge-20261027.md` for the baseline. They are not a passing full suite and were not hidden by weakening tests.

Browser API fixtures do not move real money or alter orders. PayOS banking/webhook credentials and production-load tests remain outside this local evidence. Other machines using schema validation must run the additive Product migrations before restart.
