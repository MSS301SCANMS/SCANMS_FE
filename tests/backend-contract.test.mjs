import assert from 'node:assert/strict';
import test from 'node:test';
import axios from 'axios';
import { webcrypto } from 'node:crypto';
import { createLoader, memoryStorage } from './helpers/load-ts.mjs';

const pure = createLoader();
const contract = pure(new URL('../src/services/backend-contract.ts', import.meta.url));
const models = pure(new URL('../src/services/domain-model.ts', import.meta.url));
const identity = pure(new URL('../src/services/identity.ts', import.meta.url));
const plain = value => JSON.parse(JSON.stringify(value));

test('multi-role identity keeps customer, shop and KOL workspaces using the internal UUID', () => {
  const user = identity.normalizeIdentity({ userId: 'internal-uuid', identitySubject: 'keycloak-sub',
    roles: ['USER', 'SHOP_OWNER', 'KOL_CTV'], email: 'user@example.test', fullName: 'Owner' });
  assert.equal(user.id, 'internal-uuid');
  assert.deepEqual(plain(identity.availableWorkspaces(user.roles)), ['customer', 'kol', 'shop']);
  assert.deepEqual(plain(identity.availableWorkspaces(['MANAGER'])), ['customer', 'admin']);
});

test('catalog only uses real active variants and primary/sorted ProductImage records', () => {
  const result = models.catalogProduct({ productId: 'p1', status: 'ACTIVE', sizesStock: { M: 900 }, imageRefs: { url: 'legacy' } },
    [{ productId: 'p1', variantId: 'v1', status: 'ACTIVE', stockQuantity: 3 },
      { productId: 'p1', variantId: 'v2', status: 'INACTIVE', stockQuantity: 90 },
      { productId: 'p2', variantId: 'v3', status: 'ACTIVE', stockQuantity: 30 }],
    [{ productId: 'p1', imageUrl: 'secondary', primaryImage: false, sortOrder: 0 },
      { productId: 'p1', imageUrl: 'primary', primaryImage: true, sortOrder: 20 }]);
  assert.equal(result.availableQuantity, 3);
  assert.equal(result.imageUrl, 'primary');
  assert.equal(result.variants.length, 2);
  assert.equal(models.catalogProduct({ productId: 'p1', status: 'ACTIVE' }, [], []).canPurchase, false);
});

test('wallet ownership uses both ownerType and ownerRefId', () => {
  assert.equal(models.walletBelongsTo({ ownerType: 'CUSTOMER', ownerRefId: 'u1' }, 'u1', [], []), true);
  assert.equal(models.walletBelongsTo({ ownerType: 'STORE', ownerRefId: 'u1' }, 'u1', [], []), false);
  assert.equal(models.walletBelongsTo({ ownerType: 'PLATFORM', ownerRefId: 'u1' }, 'u1', [], []), false);
});

test('voucher scope clears unrelated references and requires product/live references', () => {
  assert.deepEqual(plain(models.eligibleVoucherReferences('STORE', 's1', 'p1', 'l1')), { storeId: 's1', productId: null, livestreamId: null });
  assert.throws(() => models.eligibleVoucherReferences('PRODUCT', 's1'), /sản phẩm/);
  assert.throws(() => models.eligibleVoucherReferences('LIVESTREAM', 's1'), /livestream/);
});

test('money rejects fractional, negative and unsafe VND without silently converting to zero', () => {
  assert.equal(contract.integerVnd('450000'), 450000);
  for (const amount of ['', '-1', '1.5', 'NaN', '9007199254740992']) assert.throws(() => contract.integerVnd(amount));
});
test('percentage vouchers allow fractional rates while VND remains integer', () => {
  assert.equal(contract.percentage('12.5'), 12.5);
  for (const value of ['', '-1', '100.1', 'NaN']) assert.throws(() => contract.percentage(value));
});

test('legacy and missing workflow endpoints cannot be interpreted as UUID resource IDs', () => {
  for (const path of ['/auth/login', '/coupons', '/wallets/me', '/orders/my-store', '/products/reviews/moderation', '/public/products']) {
    assert.equal(contract.isBackendEndpoint('GET', path), false, path);
  }
  assert.equal(contract.isBackendEndpoint('PUT', '/products/11111111-1111-4111-8111-111111111111'), false);
  assert.equal(contract.isBackendEndpoint('GET', '/products/11111111-1111-4111-8111-111111111111'), true);
  assert.equal(contract.isBackendEndpoint('POST', '/products/ai-analyze'), true);
  assert.equal(contract.isBackendEndpoint('POST', '/store-applications/11111111-1111-4111-8111-111111111111/approve'), true);
  assert.equal(contract.isBackendEndpoint('POST', '/livestreams/11111111-1111-4111-8111-111111111111/start'), true);
  assert.equal(contract.isBackendEndpoint('POST', '/voucher-redemptions/11111111-1111-4111-8111-111111111111/approve'), false);
});

test('real Axios transport reads result, uses one session token and blocks legacy calls before network', async () => {
  const sessionStorage = memoryStorage(); const localStorage = memoryStorage();
  sessionStorage.setItem('scanms-access-token', 'keycloak-access-token');
  localStorage.setItem('token', 'obsolete-token');
  const calls = [];
  const transport = { create: options => axios.create({ ...options, adapter: async config => {
    calls.push(config);
    return { status: 200, headers: {}, statusText: 'OK', config, data: { code: 200, message: 'Success', result: [{ productId: 'p1' }] } };
  } }) };
  const load = createLoader({ sessionStorage, localStorage, window: { dispatchEvent() {} } }, { axios: transport });
  const client = load(new URL('../src/services/api.ts', import.meta.url));
  assert.deepEqual(plain(await client.backendGet('/products')), [{ productId: 'p1' }]);
  assert.equal(calls[0].baseURL, '/api/v1');
  assert.equal(calls[0].headers.Authorization, 'Bearer keycloak-access-token');
  await assert.rejects(client.backendGet('/wallets/me'), /chưa sẵn sàng/);
  assert.equal(calls.length, 1);
});

test('401 clears identity and session instead of retaining balances or roles', async () => {
  const sessionStorage = memoryStorage(); const localStorage = memoryStorage();
  sessionStorage.setItem('scanms-access-token', 'expired'); sessionStorage.setItem('scanms-user', '{}');
  const transport = { create: options => axios.create({ ...options, adapter: async config => {
    throw new axios.AxiosError('Expired', 'ERR_BAD_REQUEST', config, null, { status: 401, data: { code: 401, message: 'Expired', result: null } });
  } }) };
  const load = createLoader({ sessionStorage, localStorage, window: { dispatchEvent() {} }, CustomEvent: class { constructor(type, detail) { this.type = type; this.detail = detail; } } }, { axios: transport });
  await assert.rejects(load(new URL('../src/services/api.ts', import.meta.url)).backendGet('/users/me'), /Expired/);
  assert.equal(sessionStorage.getItem('scanms-access-token'), null);
  assert.equal(sessionStorage.getItem('scanms-user'), null);
});

test('PKCE login validates state, uses S256 and refuses external return URLs', async () => {
  const sessionStorage = memoryStorage(); const localStorage = memoryStorage(); let destination = '';
  let fetchCount = 0;
  const load = createLoader({ sessionStorage, localStorage, crypto: webcrypto,
    btoa: text => Buffer.from(text, 'binary').toString('base64'),
    fetch: async () => { fetchCount++; throw new Error('Unexpected token request'); },
    window: { location: { origin: 'http://localhost:5173', assign: value => { destination = value; } }, history: { replaceState() {} } } });
  const oidc = load(new URL('../src/services/keycloak.ts', import.meta.url));
  await oidc.startKeycloakLogin('login', '//evil.example');
  const query = new URL(destination).searchParams;
  assert.equal(query.get('code_challenge_method'), 'S256');
  assert.equal(query.get('response_type'), 'code');
  assert.equal(JSON.parse(sessionStorage.getItem('scanms-oidc-pending')).returnTo, '/portal');
  await assert.rejects(oidc.finishKeycloakLogin(new URLSearchParams({ state: 'wrong', code: 'code' })), /không khớp/);
  assert.equal(fetchCount, 0);
  assert.equal(sessionStorage.getItem('scanms-access-token'), null);
});

test('OIDC callback exchanges the matching verifier once and clears the previous account', async () => {
  const sessionStorage = memoryStorage(); const localStorage = memoryStorage();
  localStorage.setItem('user', 'previous-account'); localStorage.setItem('current_store_id', 'previous-store');
  let posted; let replaced = '';
  const load = createLoader({ sessionStorage, localStorage, crypto: webcrypto,
    btoa: text => Buffer.from(text, 'binary').toString('base64'),
    fetch: async (_url, options) => { posted = options.body; return { ok: true, json: async () => ({ access_token: 'new-access', id_token: 'new-id' }) }; },
    window: { location: { origin: 'http://localhost:5173', assign() {} }, history: { replaceState(_state, _unused, url) { replaced = url; } } } });
  const oidc = load(new URL('../src/services/keycloak.ts', import.meta.url));
  await oidc.startKeycloakLogin('login', '/merchant/products');
  const pending = JSON.parse(sessionStorage.getItem('scanms-oidc-pending'));
  const query = new URLSearchParams({ state: pending.state, code: 'single-use-code' });
  assert.equal(await oidc.finishKeycloakLogin(query), '/merchant/products');
  assert.equal(posted.get('grant_type'), 'authorization_code'); assert.equal(posted.get('code_verifier'), pending.verifier);
  assert.equal(sessionStorage.getItem('scanms-access-token'), 'new-access');
  assert.equal(localStorage.getItem('current_store_id'), null); assert.equal(localStorage.getItem('user'), null);
  assert.equal(replaced, '/auth/callback');
  await assert.rejects(oidc.finishKeycloakLogin(query), /không hợp lệ/);
});

test('frontend scopes split orders, returned items and ledgers without treating this as server authorization', () => {
  const load = createLoader({}, { '../../services/scanms.service': { scanmsService: {} } });
  const { emptySnapshot, scopedSnapshot } = load(new URL('../src/features/backend/snapshot.ts', import.meta.url));
  const snapshot = emptySnapshot();
  snapshot.stores = [{ storeId: 's1', ownerUserId: 'u1' }, { storeId: 's2', ownerUserId: 'u2' }];
  snapshot.orders = [{ orderId: 'o1', customerId: 'buyer' }];
  snapshot['seller-orders'] = [{ sellerOrderId: 'so1', orderId: 'o1', storeId: 's1' }, { sellerOrderId: 'so2', orderId: 'o1', storeId: 's2' }];
  snapshot['order-items'] = [{ orderItemId: 'i1', sellerOrderId: 'so1' }, { orderItemId: 'i2', sellerOrderId: 'so2' }];
  snapshot.returns = [{ orderItemId: 'i1' }, { orderItemId: 'i2' }];
  const result = scopedSnapshot(snapshot, { userId: 'u1', roles: ['USER', 'SHOP_OWNER'] }, 'merchant');
  assert.equal(result['seller-orders'].length, 1);
  assert.equal(result['order-items'][0].orderItemId, 'i1');
  assert.equal(result.returns.length, 1);
});

test('forms never expose low-level financial writes and block suspended shops', () => {
  const load = createLoader();
  const { canCreate } = load(new URL('../src/features/backend/capabilities.ts', import.meta.url));
  const user = { userId: 'u1', roles: ['USER', 'SHOP_OWNER'] };
  const snapshot = { stores: [{ storeId: 's1', ownerUserId: 'u1', approvalStatus: 'SUSPENDED' }], collaborators: [] };
  assert.equal(canCreate('products', user, snapshot, 's1'), false);
  for (const resource of ['orders', 'payments', 'wallet-transactions', 'settlements', 'withdrawals', 'returns', 'referrals']) {
    assert.equal(canCreate(resource, { userId: 'u1', roles: ['ADMIN'] }, snapshot, 's1'), false);
  }
});
