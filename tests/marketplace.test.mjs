import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Compile pure TS modules in memory for Node's test runner; no browser globals.
async function loadTypeScript(relativePath) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
}
const { marketplaceProducts: products, marketplaceKOLs: creators, marketplaceVideos: videos } = await loadTypeScript('../src/features/marketplace/marketplaceData.ts');
const { calculateCart, normalizeSearch, formatMoney } = await loadTypeScript('../src/features/marketplace/marketplaceUtils.ts');

test('Vietnamese search ignores case, diacritics and đ', () => {
  assert.equal(normalizeSearch('  Nguyễn Đình Tuấn  '), 'nguyen dinh tuan');
  assert.equal(normalizeSearch('CHỐNG NẮNG'), 'chong nang');
});
test('empty cart does not earn a discount', () => {
  assert.deepEqual(calculateCart([], products, creators[0]), { subtotal: 0, discount: 0, total: 0 });
});
test('eligible product receives creator discount', () => {
  assert.deepEqual(calculateCart([{ productId: 'P01', quantity: 1 }], products, creators[0]), { subtotal: 459000, discount: 45900, total: 413100 });
});
test('discount is capped and respects minimum order', () => {
  assert.equal(calculateCart([{ productId: 'P01', quantity: 3 }], products, creators[0]).discount, 50000);
  assert.equal(calculateCart([{ productId: 'P04', quantity: 1 }], products, creators[0]).discount, 0);
});
test('wrong creator code cannot discount unrelated products', () => {
  assert.equal(calculateCart([{ productId: 'P01', quantity: 1 }], products, creators[1]).discount, 0);
  assert.equal(calculateCart([{ productId: 'P01', quantity: 1 }, { productId: 'P08', quantity: 1 }], products, creators[0]).discount, 45900);
});
test('12 percent code uses its actual percentage', () => {
  assert.equal(calculateCart([{ productId: 'P02', quantity: 1 }], products, creators[1]).discount, 46680);
});
test('all fixture assets exist inside frontend public', () => {
  for (const asset of [...products.map(p => p.image), ...creators.map(c => c.avatarImg), ...videos.map(v => v.thumbnail), '/reference/assets/sample-video.mp4']) {
    assert(existsSync(new URL(`../public${asset}`, import.meta.url)), asset);
  }
});
test('all original local script and stylesheet entry points are copied', () => {
  const html = readFileSync(new URL('../public/reference/index.html', import.meta.url), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?]+)(?:\?[^\"]*)?"/g)) {
    assert(existsSync(new URL(`../public/reference/${match[1]}`, import.meta.url)), match[1]);
  }
});
test('currency is formatted in Vietnamese dong', () => {
  assert.match(formatMoney(459000), /459\.000/);
});
test('source prototype remains present', () => {
  assert(existsSync(pathToFileURL(resolve('..', 'docs/ui-ux/NGUYENDINHTUAN/index.html'))));
});

test('FR16 reference UI submits checkout to backend and never fabricates success data', () => {
  const source = readFileSync(new URL('../public/reference/js/marketplace.js', import.meta.url), 'utf8');
  const checkout = source.slice(
    source.indexOf('async function openGuestCheckoutModal'),
    source.indexOf('function openVideoPlayerModal'),
  );

  assert.match(checkout, /fetch\("\/api\/orders"/);
  assert.match(checkout, /result\.publicOrderCode/);
  assert.match(checkout, /result\.cancellationToken/);
  assert.match(checkout, /maskPhone\(order\.phone\)/);
  assert.doesNotMatch(checkout, /Math\.random\(\).*90000/);
  assert.doesNotMatch(checkout, /trackingNum/);
  assert.doesNotMatch(checkout, /localStorage\.setItem/);
});

test('FR16 React checkout only submits a backend-validated coupon and reads unwrapped API data', () => {
  const source = readFileSync(
    new URL('../src/components/checkout/GuestCheckoutModal.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /couponCode: appliedCoupon\?\.code \|\| undefined/);
  assert.doesNotMatch(source, /couponCode: appliedCoupon \? appliedCoupon\.code : couponCode\.trim\(\)/);
  assert.match(source, /rawResponse\?\.data\?\.data \|\| rawResponse\?\.data \|\| rawResponse/);
  assert.match(source, /err\?\.response\?\.status === 429/);
  assert.match(source, /customerEmail: customerEmail\.trim\(\)\.toLowerCase\(\) \|\| undefined/);
  assert.match(source, /Email nhận mã đơn/);
});

test('guest checkout keeps a recent public order code and tracking link after closing success modal', () => {
  const checkout = readFileSync(new URL('../src/components/checkout/GuestCheckoutModal.tsx', import.meta.url), 'utf8');
  const marketplace = readFileSync(new URL('../src/pages/public/MarketplacePage.tsx', import.meta.url), 'utf8');
  assert.match(checkout, /to=\{`\/tracking\?sn=/);
  assert.match(checkout, /localStorage\.setItem\(\s*'scanms-recent-guest-order'/);
  assert.match(marketplace, /scanms-recent-guest-order/);
  assert.match(marketplace, /Đơn hàng vừa đặt/);
  assert.match(marketplace, /to=\{`\/tracking\?sn=/);
  assert.doesNotMatch(marketplace, /cancellationToken.*localStorage/);
});

test('tracking accepts old links, rejects undefined values and falls back to the recent order', () => {
  const tracking = readFileSync(new URL('../src/pages/public/OrderTrackingPage.tsx', import.meta.url), 'utf8');
  assert.match(tracking, /searchParams\.get\("orderSn"\)/);
  assert.match(tracking, /getRecentOrderCode\(\)/);
  assert.match(tracking, /normalized\.toLowerCase\(\) === "undefined"/);
});

test('store-scoped referral links select the Shop token before the generic KOL rule', () => {
  const source = readFileSync(new URL('../src/services/api.ts', import.meta.url), 'utf8');
  const shopRule = source.indexOf("return 'SHOP_MANAGER';", source.indexOf('/\\/stores\\/'));
  const genericReferralRule = source.indexOf("reqUrl.includes('/referral-links')");
  assert(shopRule >= 0, 'missing store-scoped referral-link role rule');
  assert(genericReferralRule >= 0, 'missing generic referral-link role rule');
  assert(shopRule < genericReferralRule, 'Shop rule must run before generic KOL rule');
});

test('Marketplace preserves the backend store relationship when opening checkout', () => {
  const source = readFileSync(new URL('../src/pages/public/MarketplacePage.tsx', import.meta.url), 'utf8');
  assert.match(source, /storeId: dbP\.store\?\.id/);
  assert.match(source, /id: product\.storeId/);
  assert.doesNotMatch(source, /id: 'store-1'/);
  assert.match(source, /stockQuantity: product\.stockQuantity \|\| 0/);
});

test('Marketplace deal spotlight uses real stock and carries selected quantity into checkout', () => {
  const source = readFileSync(new URL('../src/pages/public/MarketplacePage.tsx', import.meta.url), 'utf8');
  assert.match(source, /activeStock = Number\(activeSpotlight\?\.product\.stockQuantity \|\| 0\)/);
  assert.match(source, /handleOpenDirectCheckout\(activeSpotlight\.product, spotlightQuantity\)/);
  assert.match(source, /initialQuantity=\{activeCheckoutProduct\.initialQuantity \|\| 1\}/);
  assert.doesNotMatch(source, /soldRatios\s*=/);
  assert.doesNotMatch(source, /ĐÃ BÁN \{activeSpotlight\.soldCount\}/);
});

test('global sidebar uses production role-switching copy instead of Demo wording', () => {
  const source = readFileSync(new URL('../src/components/layout/Sidebar.tsx', import.meta.url), 'utf8');
  assert.match(source, />\s*Chuyển vai trò\s*</);
  assert.match(source, /Hiện tại: \{roleLabel\}/);
  assert.doesNotMatch(source, /Đổi vai trò Demo/i);
});

test('every sidebar navigation function renders its icon inside a consistent tile', () => {
  const source = readFileSync(new URL('../src/components/layout/Sidebar.tsx', import.meta.url), 'utf8');
  assert.match(source, /grid h-7 w-7 shrink-0 place-items-center rounded-lg border/);
  assert.match(source, /border-white\/25 bg-white\/15 text-white/);
  assert.match(source, /border-\[#E4D3B7\] bg-\[#FBF5EB\]/);
});

test('sidebar function rows stay flat while icons retain their own frames', () => {
  const source = readFileSync(new URL('../src/components/layout/Sidebar.tsx', import.meta.url), 'utf8');
  assert.match(source, /group flex items-center gap-2\.5 rounded-xl px-2 py-1\.5/);
  assert.doesNotMatch(source, /border-\[#E4D8C5\] bg-white\/75/);
  assert.match(source, /grid h-7 w-7 shrink-0 place-items-center rounded-lg border/);
});
