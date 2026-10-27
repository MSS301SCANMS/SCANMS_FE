import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const transpile = path => ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const labels = { exports: {} };
vm.runInNewContext(transpile('../src/utils/order-display-code.ts'), { exports: labels.exports });
const orderId = 'b65b89f1-3267-48fe-bc61-d05d79ae081f';
test('old orders resolve a missing image without changing purchased name, prices, or IDs', async () => {
  let failCatalog = false, existingImage = false;
  const calls = [];
  const raw = () => ({ orderId, status: 'PAID', payableVnd: 341900, shippingSnapshot: {}, sellerOrders: [{ sellerOrderId: 'seller', storeId: 'store', totalsSnapshot: { storeName: 'Sora Skin' }, items: [{ orderItemId: 'item', productId: 'product', variantId: 'variant', quantity: 1, unitPrice: 299000, productSnapshot: { name: 'Purchased shirt', size: 'M', ...(existingImage ? { imageUrl: '/original.webp' } : {}) } }] }] });
  const api = { get: async path => {
    calls.push(path);
    if (path === '/orders/my-orders') return { result: [raw()] };
    if (path.includes('/public/products/')) {
      if (failCatalog) throw new Error('Catalog unavailable');
      return { result: { product: { title: 'Renamed shirt', price: 500000, imageUrl: '/shirt.webp' } } };
    }
    return { result: [] };
  } };
  const module = { exports: {} };
  const require = path => {
    if (path === './api') return api;
    if (path.endsWith('order-display-code')) return labels.exports;
    if (path.endsWith('order-amounts.utils')) return { checkoutAmounts: raw => ({ finalAmount: raw.payableVnd, subtotalAmount: 299000, discountAmount: 0 }) };
    if (path.endsWith('server-date')) return { serverDate: value => value };
    if (path.endsWith('return.service')) return { normalizeReturn: value => value };
    if (path.endsWith('customer-order-filter')) return { matchesCustomerOrderStatus: () => true };
    return {};
  };
  vm.runInNewContext(transpile('../src/services/customer.service.ts'), { exports: module.exports, require, Date, console });
  const service = module.exports.customerService;
  let result = await service.getOrders({ search: 'DH-B65B89F13267' });
  assert.equal(result.orders.length, 1);
  let order = result.orders[0];
  assert.equal(order.orderItems[0].product.imageUrl, '/shirt.webp');
  assert.equal(order.orderItems[0].product.title, 'Purchased shirt');
  assert.equal(order.orderItems[0].unitPrice, 299000);
  assert.equal(order.finalAmount, 341900);
  assert.equal(order.id, orderId); assert.equal(order.externalOrderSn, orderId);
  assert.equal(order.orderItems[0].variant.name, 'M');
  failCatalog = true;
  result = await service.getOrders();
  assert.equal(result.orders.length, 1, 'Unavailable catalog must not hide the order');
  existingImage = true; calls.length = 0;
  result = await service.getOrders();
  assert.equal(result.orders[0].orderItems[0].product.imageUrl, '/original.webp');
  assert.ok(!calls.some(path => path.includes('/public/products/')), 'Snapshot image needs no catalog request');
});
