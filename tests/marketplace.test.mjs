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
const { marketplaceProducts: products, marketplaceKOLs: creators, marketplaceVideos: videos } = await loadTypeScript('./fixtures/marketplaceData.ts');
const { calculateCart, normalizeSearch, formatMoney } = await loadTypeScript('../src/utils/marketplace.utils.ts');

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

test('tracking accepts orderSn and tracking links with valid fallback', () => {
  const tracking = readFileSync(new URL('../src/pages/public/OrderTrackingPage.tsx', import.meta.url), 'utf8');
  assert.match(tracking, /searchParams\.get\("orderSn"\)/);
  assert.match(tracking, /getRecentOrderCode\(\)/);
  assert.match(tracking, /normalized\.toLowerCase\(\) === "undefined"/);
});

test('api service attaches JWT Bearer authorization token and handles 401 expiration', () => {
  const source = readFileSync(new URL('../src/services/api.ts', import.meta.url), 'utf8');
  assert.match(source, /Bearer \$\{token\}/);
  assert.match(source, /localStorage\.getItem\('token'\)/);
  assert.match(source, /status === 401/);
});

test('Marketplace preserves the backend store relationship when opening checkout', () => {
  const source = readFileSync(new URL('../src/pages/public/MarketplacePage.tsx', import.meta.url), 'utf8');
  assert.match(source, /storeId:\s*dbP\.store\?\.id/);
  assert.match(source, /stockQuantity:\s*Number\(dbP\.stockQuantity\s*\|\|\s*0\)/);
  assert.doesNotMatch(source, /id: 'store-1'/);
});

test('Marketplace uses real stock and cart integration', () => {
  const source = readFileSync(new URL('../src/pages/public/MarketplacePage.tsx', import.meta.url), 'utf8');
  assert.match(source, /stockQuantity:\s*Number\(dbP\.stockQuantity\s*\|\|\s*0\)/);
  assert.match(source, /openCart/);
});

test('topbar uses the accessible account menu with the active workspace role', () => {
  const topbar = readFileSync(new URL('../src/components/layout/Topbar.tsx', import.meta.url), 'utf8');
  assert.match(topbar, /<HeaderAccountButton\s/);
  assert.match(topbar, /role=\{role\}/);
  assert.match(topbar, /menuId="topbar-account-menu"/);
  assert.match(topbar, /scanms_workspace_changed/);
  const account = readFileSync(new URL('../src/components/layout/HeaderAccountButton.tsx', import.meta.url), 'utf8');
  for (const role of ['CUSTOMER', 'COLLABORATOR', 'SHOP_MANAGER', 'SYSTEM_MANAGER', 'SYSTEM_ADMIN']) {
    assert.ok(account.includes(`${role}:`), `Account menu must display role ${role}`);
  }
  assert.match(account, /aria-expanded=\{expanded\}/);
  assert.match(account, /aria-controls=\{menuId\}/);
  assert.doesNotMatch(account, /Demo/);
});

// Inspect the actual navigation Link; padding changes and class order are not behavior.
function sidebarNavigationAttributes() {
  const source = readFileSync(new URL('../src/components/layout/Sidebar.tsx', import.meta.url), 'utf8');
  const tree = ts.createSourceFile('Sidebar.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let attributes;
  function visit(node) {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(tree) === 'Link') {
      const props = node.attributes.properties.filter(ts.isJsxAttribute);
      if (props.some(prop => prop.name.getText(tree) === 'to' && prop.initializer?.getText(tree) === '{item.path}')) {
        attributes = new Map(props.map(prop => [prop.name.getText(tree), prop.initializer?.getText(tree) ?? '']));
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  assert.ok(attributes, 'Sidebar must render each navigation item as a real Link');
  return attributes;
}

test('every sidebar navigation function renders its link with warm gold styling', () => {
  const classes = sidebarNavigationAttributes().get('className');
  for (const token of ['group', 'flex', 'items-center', 'rounded-xl', 'bg-[#FAF5EB]', 'text-[#B88E4F]']) {
    assert.ok(classes?.includes(token), `Missing navigation token: ${token}`);
  }
});

test('sidebar navigation rows use clean layout and active indicators', () => {
  const attributes = sidebarNavigationAttributes();
  assert.equal(attributes.get('aria-current'), "{active ? 'page' : undefined}");
  for (const token of ['hover:bg-[#FAF8F5]', 'hover:text-[#B88E4F]', 'min-h-[40px]']) {
    assert.ok(attributes.get('className')?.includes(token), `Missing navigation token: ${token}`);
  }
});

