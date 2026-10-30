# Registration and workspace navigation review — 2026-10-27

Branch: `feat/livestream-commerce-sync-20261027`.
Develop baseline: `462d919` (already included by the previous feature merge).

## Changes

- Authorize login return URLs using the authenticated account. The login role selector cannot grant a workspace.
- Admin and manager accounts use the operational workspace, including accounts that also retain USER, SHOP_OWNER or KOL_CTV roles. Customer and business routes redirect them to their authorized dashboard. Manager access excludes the admin dashboard, system wallet and system health routes.
- Customer accounts cannot enter admin, seller or creator routes. Shop and KOL accounts retain personal shopping through an explicit workspace switch; visiting a shopping URL no longer silently changes workspace.
- Customer portal routes now have a session/role guard. Business guards validate the route before activating a workspace and ignore stale effects replayed during lazy navigation.
- Share reactive session state between guards, both headers, the layout and the dashboard dispatcher. Private route outlets remount when the login session changes. Profile links point to the correct workspace.
- Publish the pending registration changes: friendly duplicate identity errors, password recovery links and successful registration preserved when automatic login fails.

## Validation

- TypeScript and Vite production build passed (existing bundle size warning).
- Node suite: 160 passed, seven existing develop failures, 114 skipped. The seven failures and their reproduction on develop are documented in `livestream-develop-merge-20261027.md`. The Topbar source check now follows the shared session hook.
- Six focused workspace/registration unit checks passed.
- Browser role matrix passed for ADMIN, MANAGER, SHOP_OWNER, KOL_CTV and USER, using the real login page, guards, layout and headers with isolated API/leaf-page fixtures. Checks cover stale login redirects, the common dashboard entry, forbidden role groups, operational/customer separation, role-specific profile links and explicit shop shopping switches.
- Registration browser check passed: duplicate identity, password confirmation and successful signup with failed automatic login.
- Checkout privacy browser check passed: orphaned profiles/old address caches hidden, account changes isolated, drafts retained during token renewal.

These browser checks do not validate production Keycloak settings, real payments or every page's domain API. No application database was reset and private environment files are excluded from the commit. No pull request is created; the user will create it.
