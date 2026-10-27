import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const requests=[];
let createdOrder;
let walletCalls = 0;
let paymentCalls = 0;
let paymentSync = 'SYNCED';
globalThis.__liveCheckoutFinance = {
  wallet: async () => { walletCalls++; return { walletId: 'buyer-wallet' }; },
  payWallet: async () => { paymentCalls++; return { status: 'SUCCESS', orderSyncStatus: paymentSync }; },
};
globalThis.__liveCheckoutAxios={create:()=>({interceptors:{request:{use(){}},response:{use(){}}},post:async(path,body)=>{
  requests.push({path,body});
  if (path === '/checkout') return { data: { result: createdOrder } };
  return {data:{result:{shippingFeeVnd:30000,shippingMode:'SIMULATED',shippingPayer:'CUSTOMER',lines:body.items?.map(item=>({...item,unitPriceVnd:299000}))}}};
}})};
globalThis.__liveCheckoutApi={get:async()=>({product:{id:'shirt',title:'Shirt',canPurchase:true,price:329000,stockQuantity:10,variants:[{id:'white-m',price:329000,stockQuantity:10,isActive:true}]}})};
const moduleUrl=value=>'data:text/javascript;base64,'+Buffer.from(value).toString('base64');
let source=ts.transpileModule(fs.readFileSync(new URL('../src/services/checkout.service.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
for(const [specifier,stub]of Object.entries({'axios':'export default globalThis.__liveCheckoutAxios;','./api':'export default globalThis.__liveCheckoutApi;','./finance.service':'export const financeService=globalThis.__liveCheckoutFinance;','./auth-session':'export const installRawSessionAuth=()=>{};','./live-purchase-access':"export const getLivePurchase=id=>id==='live-a'?'room-proof':undefined;"}))source=source.replace(JSON.stringify(specifier),JSON.stringify(moduleUrl(stub))).replace("'"+specifier+"'",JSON.stringify(moduleUrl(stub)));
source=source.replaceAll('import.meta.env','{}');
const {checkoutService}=await import(moduleUrl(source));

test('voucher and shipping quotes retain live origin and fresh room proof',async()=>{
  const item={productId:'shirt',variantId:'white-m',quantity:1,liveSessionId:'live-a'};
  const shippingDestination = { province: 'Province', district: 'District', ward: 'Ward', detail: '123 Street' };
  await checkoutService.quote({couponCode:'SAVE',shippingCouponCode:'SHIP',items:[item],shippingDestination});
  assert.equal(requests.at(-1).body.items[0].sourceLivestreamId,'live-a');
  assert.equal(requests.at(-1).body.items[0].livePurchaseToken,'room-proof');
  assert.equal(requests.at(-1).body.shippingCouponCode,'SHIP');
  assert.deepEqual(requests.at(-1).body.shippingDestination, shippingDestination);
  const quote=await checkoutService.shippingQuote([item],'store-a','Address',undefined,shippingDestination);
  assert.equal(quote.totalFee,30000);assert.equal(requests.at(-1).body.items[0].livePurchaseToken,'room-proof');
  assert.deepEqual(requests.at(-1).body.shippingDestination, shippingDestination);
});

test('refreshing a normal cart item never applies a live price from the same variant',async()=>{
  const result=await checkoutService.validateCart([{productId:'shirt',variantId:'white-m',quantity:1,clientPrice:329000},{productId:'shirt',variantId:'white-m',quantity:1,clientPrice:299000,liveSessionId:'live-a'}]);
  assert.deepEqual(result.items.map(item=>item.currentPrice),[329000,299000]);
  assert.deepEqual(result.warnings,[]);
});

test('changed totals stop before a wallet debit; successful orders pay once and keep reconciliation state', async () => {
  createdOrder = { orderId: 'new-order', finalAmount: 299000, paymentMethod: 'WALLET', paymentStatus: 'UNPAID', orders: [{ storeId: 'store-a' }] };
  await assert.rejects(checkoutService.create({ expectedPayableVnd: 269000 }), /Giá hoặc phí vận chuyển đã thay đổi/);
  assert.equal(walletCalls, 0);
  assert.equal(paymentCalls, 0);
  const paid = await checkoutService.create({ expectedPayableVnd: 299000 });
  assert.equal(paid.paymentStatus, 'PAID');
  assert.equal(paymentCalls, 1);
  createdOrder = { ...createdOrder, paymentStatus: 'PAID' };
  await checkoutService.create({ expectedPayableVnd: 299000 });
  assert.equal(paymentCalls, 1, 'An already paid order must not be charged again');
  createdOrder = { ...createdOrder, paymentStatus: 'UNPAID' };
  paymentSync = 'RECONCILIATION_REQUIRED';
  const pending = await checkoutService.create({ expectedPayableVnd: 299000 });
  assert.equal(pending.paymentStatus, 'RECONCILIATION_REQUIRED');
  assert.equal(pending.orders[0].paymentStatus, 'RECONCILIATION_REQUIRED');
});
