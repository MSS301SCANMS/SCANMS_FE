import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base=process.env.GHN_UI_TEST_URL, executablePath=process.env.GHN_UI_BROWSER_PATH;
test('product voucher picker lists only platform goods and freeship, handles errors and carries shipping-only savings to checkout', {
  skip:!base||!executablePath||!existsSync(executablePath),timeout:60000,
},async()=>{
  const origin=new URL(base).origin;
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
  const browser=await puppeteer.launch({executablePath,headless:true});
  let page, failCatalog=true;
  const errors=[], quotes=[], orders=[];
  const productId='00000000-0000-4000-8000-000000000001', variantId='00000000-0000-4000-8000-000000000002', storeId='00000000-0000-4000-8000-000000000003';
  const store={id:storeId,name:'Shop kiểm thử',slug:'test-shop'};
  const variant={id:variantId,price:269000,stockQuantity:10,isActive:true,name:'Xanh / L',sku:'SHIRT-L',size:'L',color:'Xanh'};
  const product={id:productId,title:'Áo sơ mi kiểm thử',price:269000,stockQuantity:10,isActive:true,canPurchase:true,status:'ACTIVE',variants:[variant],store,imageUrl:'/assets/placeholder-product.svg'};
  const address={id:'address',fullName:'Người mua',phoneNumber:'0901234567',detailAddress:'123 Đường kiểm thử',provinceCode:'1',districtCode:'2',wardCode:'3',provinceName:'Tỉnh kiểm thử',districtName:'Quận kiểm thử',wardName:'Phường kiểm thử',isDefault:true};
  const now=Date.now(), from=new Date(now-86400000).toISOString(), until=new Date(now+86400000).toISOString();
  const voucher=(code,benefitType='GOODS',extra={})=>({voucherId:code,code,issuerType:'PLATFORM',scopeType:'PLATFORM',benefitType,discountType:'FIXED',value:10000,minimumSubtotal:100000,validFrom:from,validUntil:until,...extra});
  try{
    page=await browser.newPage(); page.setDefaultTimeout(10000); await page.setViewport({width:1440,height:1000});
    page.on('pageerror',error=>{if(!error.message.includes('WebSocket closed'))errors.push(error.message)});
    await page.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('token','voucher-fixture');localStorage.setItem('user',JSON.stringify({id:'buyer',fullName:'Người mua',role:'CUSTOMER',roles:['USER']}));});
    await page.setRequestInterception(true);
    page.on('request',request=>{
      const url=new URL(request.url());
      const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'content-type,authorization','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
      const respond=(result,status=200,message)=>request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result,message})});
      if(request.method()==='OPTIONS')return request.respond({status:204,headers});
      if(url.hostname==='provinces.open-api.vn')return request.respond({headers,contentType:'application/json',body:JSON.stringify([{code:1,name:address.provinceName,districts:[{code:2,name:address.districtName,wards:[{code:3,name:address.wardName}]}]}])});
      if(url.pathname.startsWith('/api/')){
        if(url.pathname.endsWith('/users'))return respond({userId:'buyer',fullName:address.fullName,phoneNumber:address.phoneNumber,roles:['USER'],status:'ACTIVE',address:JSON.stringify([address])});
        if(url.pathname.endsWith('/vouchers/public/platform')){
          assert.equal(url.searchParams.get('storeId'),storeId);
          if(failCatalog)return respond(null,503,'Catalog unavailable');
          return respond([voucher('SAN10'),voucher('FREESHIP','SHIPPING',{value:30000}),voucher('MIN1M','GOODS',{minimumSubtotal:1000000}),voucher('SHOP','GOODS',{issuerType:'STORE'}),voucher('OLD','GOODS',{validUntil:from}),voucher('FUTURE','GOODS',{validFrom:until}),voucher('CASHBACK','CASHBACK')]);
        }
        if(url.pathname.endsWith('/vouchers/public'))return respond([]);
        if(url.pathname.endsWith('/landing'))return respond({product,store,images:[],videos:[],availability:{stockQuantity:10,inStock:true},reviews:{averageRating:0,totalReviews:0,starDistribution:{},items:[]},policies:{returnPolicy:'Đổi trả 14 ngày'}});
        if(url.pathname.endsWith('/stock'))return respond({stockQuantity:10,variants:[variant]});
        if(url.pathname.includes('/stores/public/'))return respond(store);
        if(url.pathname.endsWith('/checkout/quote')){
          const body=JSON.parse(request.postData());quotes.push(body);
          if(body.couponCode==='INVALID')return respond(null,409,'Voucher không còn lượt sử dụng.');
          const ship=body.couponCode==='FREESHIP'||body.shippingCouponCode==='FREESHIP'?30000:0,goods=body.couponCode==='SAN10'?10000:0;
          return respond({code:body.couponCode||'',shippingCouponCode:body.shippingCouponCode||'',discountAmount:goods,shippingDiscountVnd:ship,benefitType:ship?'SHIPPING':'GOODS',shippingFeeVnd:30000,shippingMode:'FIXED',subtotalVnd:269000,finalAmount:299000-goods-ship});
        }
        if(url.pathname.endsWith('/capabilities'))return respond({paymentAvailable:false});
        if(url.pathname.endsWith('/wallets/me'))return respond({walletId:'wallet',availableBalanceVnd:1000000,heldBalanceVnd:0,status:'ACTIVE'});
        if(url.pathname.endsWith('/checkout')){orders.push(JSON.parse(request.postData()));return respond({orderId:'order',publicOrderCode:'order',finalAmount:259000,shippingFeeVnd:0,paymentMethod:'WALLET',paymentStatus:'UNPAID',orders:[{storeId,storeName:store.name,publicOrderCode:'order',finalAmount:259000}]});}
        if(url.pathname.endsWith('/wallet-payments'))return respond({paymentId:'payment',status:'SUCCESS',amountVnd:259000});
        return respond([]);
      }
      if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();
      return request.continue();
    });
    await page.goto(origin+'/products/'+productId,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('input[aria-label="Mã ưu đãi"]');
    // Explicitly select the actual variant before asking the server to quote a coupon.
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Xanh / L'))?.click());
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent==='Chọn voucher').click());
    await page.waitForSelector('dialog.platform-voucher-picker[open]');
    await page.waitForFunction(()=>document.querySelector('dialog').textContent.includes('Chưa tải được voucher'));
    failCatalog=false;
    await page.evaluate(()=>[...document.querySelectorAll('dialog button')].find(button=>button.textContent==='Thử lại').click());
    await page.waitForSelector('input[aria-label="Chọn SAN10"]');
    assert.equal(await page.$eval('input[aria-label="Chọn MIN1M"]',node=>node.disabled),true);
    for(const code of ['SHOP','OLD','FUTURE','CASHBACK'])assert.equal(await page.$(`input[aria-label="Chọn ${code}"]`),null);
    await page.$eval('input[aria-label="Nhập mã voucher sàn"]',node=>{node.value='';node.dispatchEvent(new Event('input',{bubbles:true}))});
    await page.click('input[aria-label="Nhập mã voucher sàn"]',{clickCount:3});await page.keyboard.type('INVALID');
    await page.evaluate(()=>[...document.querySelectorAll('dialog button')].find(button=>button.textContent.includes('Đồng ý')).click());
    await page.waitForFunction(()=>document.querySelector('dialog')?.textContent.includes('Voucher không còn lượt'));
    assert.ok(await page.$('dialog[open]'));
    await page.click('input[aria-label="Chọn SAN10"]');
    await page.evaluate(()=>[...document.querySelectorAll('dialog button')].find(button=>button.textContent.includes('Đồng ý')).click());
    await page.waitForSelector('dialog[open]',{hidden:true});
    assert.ok(quotes.some(quote=>quote.couponCode==='SAN10'&&quote.items[0].variantId===variantId));
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent==='Đổi voucher').click());await page.waitForSelector('input[aria-label="Chọn FREESHIP"]');
    await page.click('input[aria-label="Chọn FREESHIP"]');
    await page.setViewport({width:390,height:844});
    const geometry=await page.$eval('dialog',node=>({width:node.getBoundingClientRect().width,overflow:node.scrollWidth-node.clientWidth}));
    assert.ok(geometry.width<=390&&geometry.overflow<=1,JSON.stringify(geometry));
    mkdirSync('.qa-artifacts/platform-vouchers',{recursive:true});await page.screenshot({path:'.qa-artifacts/platform-vouchers/mobile.png'});
    await page.evaluate(()=>[...document.querySelectorAll('dialog button')].find(button=>button.textContent.includes('Đồng ý')).click());
    await page.waitForSelector('dialog[open]',{hidden:true});await page.setViewport({width:1440,height:1000});
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Mua sản phẩm này')).click());
    await page.waitForSelector('.scanms-checkout');
    await page.waitForFunction(()=>[...document.querySelectorAll('.checkout-total-discount')].some(node=>node.textContent.includes('FREESHIP')));
    await page.waitForFunction(()=>document.querySelector('.checkout-total-final')?.textContent.includes('259.000'));
    assert.match(await page.$eval('.checkout-total-final',node=>node.textContent),/259\.000/);
    assert.ok(await page.$$eval('.checkout-total-discount',nodes=>nodes.some(node=>/vận chuyển.*30\.000/.test(node.textContent))));
    await page.click('input[value="WALLET"]');await page.$eval('button.checkout-submit',node=>node.click());
    await page.waitForFunction(()=>document.body.innerText.includes('Đặt hàng thành công')||document.body.innerText.includes('order'));
    assert.equal(orders.length,1);assert.equal(orders[0].couponCode,'SAN10');assert.equal(orders[0].shippingCouponCode,'FREESHIP');assert.equal(orders[0].expectedShippingFeeVnd,30000);
    assert.deepEqual(errors,[]);
  }catch(error){console.error('Voucher fixture:',errors,await page?.evaluate(()=>document.body.innerText.slice(-1800)));throw error;}
  finally{await browser.close();}
});
