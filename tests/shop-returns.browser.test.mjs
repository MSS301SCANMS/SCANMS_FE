import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const base=process.env.GHN_UI_TEST_URL;
const executablePath=process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('shop returns group by order and store, filter individual requests, and persist statements against return IDs', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin=new URL(base).origin;
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
  const browser=await puppeteer.launch({executablePath,headless:true});
  const artifacts=new URL('../.qa-artifacts/shop-returns/',import.meta.url);
  await mkdir(artifacts,{recursive:true});
  try {
    const page=await browser.newPage();
    const errors=[]; page.on('pageerror',error=>{if(!error.message.includes('WebSocket closed without opened'))errors.push(error.message)});
    await page.setViewport({width:1440,height:1000});
    await page.evaluateOnNewDocument(()=>{
      localStorage.setItem('token','isolated-shop-return-fixture');
      localStorage.setItem('user',JSON.stringify({id:'shop-owner',role:'SHOP_MANAGER',fullName:'Gian hàng kiểm thử',stores:[{id:'store-a',name:'Gian hàng A'}]}));
      localStorage.setItem('scanms-current-role','shop');localStorage.setItem('scanms-active-workspace','shop');
    });
    const row=(id,name,status='REQUESTED')=>({returnRequestId:id,orderId:'shared-order-code',sellerOrderId:'seller-order',orderItemId:`item-${id}`,storeId:'store-a',storeName:'Gian hàng A',customerName:'Khách hàng kiểm thử',customerPhone:'0900000000',productName:name,quantity:1,refundAmountVnd:150000,status,reason:'Sản phẩm nhận được không đúng mẫu',evidenceRefs:{details:'Thông tin bằng chứng của khách'},shopResponse:null,decisionReason:status==='APPROVED'?'Đã duyệt, chờ xác nhận hoàn tiền':null,requestedAt:'2026-10-20T09:00:00',deliveredAt:'2026-10-18T10:00:00',returnDeadline:'2026-11-01T10:00:00',resolvedAt:null});
    let rows=[row('return-first','Áo sơ mi'),row('return-second','Túi đeo chéo'),row('return-third','Áo khoác','APPROVED'),
      {...row('return-other-store','Áo shop B','REJECTED'),storeId:'store-b',storeName:'Gian hàng B'},
      {...row('return-other-order','Áo đơn khác','REJECTED'),orderId:'another-order'}];
    let queueError=true,submitError=true;
    const statements=[],legacyCalls=[];
    await page.setRequestInterception(true);
    page.on('request',request=>{ void(async()=>{
      const url=new URL(request.url());
      if(url.pathname.includes('/orders/admin/disputes')||url.pathname.includes('/dispute/respond')) legacyCalls.push(request.url());
      if(url.pathname.startsWith('/api/')) {
        const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
        if(request.method()==='OPTIONS') return request.respond({status:204,headers});
        let result=[];
        if(url.pathname.endsWith('/users/me'))result={userId:'shop-owner',roles:['SHOP_OWNER'],fullName:'Gian hàng kiểm thử',status:'ACTIVE',stores:[{id:'store-a',name:'Gian hàng A'}]};
        if(url.pathname.endsWith('/stores/mine'))result=[{storeId:'store-a',name:'Gian hàng A'}];
        if(url.pathname.endsWith('/returns/shop')) {
          if(queueError)return request.respond({status:503,headers,contentType:'application/json',body:JSON.stringify({message:'Không kết nối được dịch vụ gian hàng. Vui lòng thử lại.'})});
          result=rows;
        }
        if(url.pathname.endsWith('/shop-response')) {
          const id=url.pathname.split('/').at(-2);const body=JSON.parse(request.postData());
          statements.push({id,body});
          if(submitError)return request.respond({status:503,headers,contentType:'application/json',body:JSON.stringify({message:'Chưa lưu được giải trình. Vui lòng thử lại.'})});
          result={...rows.find(row=>row.returnRequestId===id),shopResponse:{response:body.response,imageUrls:body.imageUrls,submittedAt:'2026-10-21T10:00:00'}};
          rows=rows.map(row=>row.returnRequestId===id?result:row);
        }
        return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({code:200,result})});
      }
      if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();
      return request.continue();
    })();});
    await page.goto(`${base}/merchant/returns`);
    await page.waitForSelector('[role="alert"]');
    assert.equal(await page.evaluate(()=>document.body.textContent.includes('Chưa có yêu cầu đổi trả')),false,'load failure must not look like an empty queue');
    assert.equal(await page.evaluate(()=>document.body.textContent.includes('SCANMS RETURN PORTAL')),false);
    queueError=false;
    await page.click('button[aria-label="Làm mới yêu cầu đổi trả"]');
    await page.waitForSelector('[aria-label="Danh sách yêu cầu"] button');
    assert.equal((await page.$$('[aria-label="Danh sách yêu cầu"] > button')).length,3);
    assert.equal((await page.$$('[aria-label="Chọn sản phẩm trả hàng"] input')).length,3,'three requests in one order and store must share a card');
    const firstCard=await page.$eval('[aria-label="Danh sách yêu cầu"] > button',node=>node.textContent);
    assert.match(firstCard,/Áo sơ mi/);assert.match(firstCard,/Túi đeo chéo/);assert.match(firstCard,/Áo khoác/);
    assert.doesNotMatch(firstCard,/Áo shop B|Áo đơn khác/,'other stores and orders must stay separate');
    assert.match(await page.$eval('[aria-label="Sản phẩm trả trong đơn"]',node=>node.textContent),/450[.,]000/,'sum the requests in this order and store only');
    assert.equal(await page.$eval('[aria-label="Chi tiết yêu cầu"]',element=>element.textContent.includes('01/11/2026')),true,'deadline must come from delivery policy');
    const firstResponse='#shop-return-response-return-first',secondResponse='#shop-return-response-return-second';
    await page.type(firstResponse,'Bản nháp của yêu cầu đầu');
    await page.click('input[aria-label="Chọn Túi đeo chéo"]');
    assert.equal(await page.$eval(secondResponse,element=>element.value),'','checking another request must not copy the first draft');
    assert.equal(await page.$eval(firstResponse,element=>element.value),'Bản nháp của yêu cầu đầu','each selected request retains its own draft');
    assert.equal((await page.$$('[aria-label="Chi tiết yêu cầu"]')).length,2);
    assert.equal(await page.$eval('[aria-label="Sản phẩm trả trong đơn"] > label input',node=>node.indeterminate),true);
    assert.deepEqual(statements,[],'selection alone must not submit statements');
    await page.click('input[aria-label="Chọn Áo sơ mi"]');
    const statement='Gian hàng đã kiểm tra đóng gói, đề nghị đối chiếu bằng chứng.';
    await page.type(secondResponse,statement);
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent==='Gửi giải trình').click());
    await page.waitForFunction(()=>document.body.textContent.includes('Chưa lưu được giải trình. Vui lòng thử lại.'));
    assert.equal(await page.$eval(secondResponse,element=>element.value),statement);
    submitError=false;
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent==='Gửi giải trình').click());
    await page.waitForSelector('[aria-label="Giải trình đã gửi"]');
    assert.deepEqual(statements,[{id:'return-second',body:{response:statement,imageUrls:[]}},{id:'return-second',body:{response:statement,imageUrls:[]}}]);
    assert.equal(rows[1].status,'REQUESTED','a shop statement cannot approve or refund');
    await page.click('button[aria-label="Làm mới yêu cầu đổi trả"]');
    await page.waitForSelector('[aria-label="Giải trình đã gửi"]');
    await page.click('[aria-label="Sản phẩm trả trong đơn"] > label input');
    assert.equal((await page.$$('[aria-label="Chi tiết yêu cầu"]')).length,3,'select all displays every request, including different statuses');
    assert.equal((await page.$$('textarea')).length,1,'only the waiting request can have a response form');
    assert.equal((await page.$$('[aria-label="Giải trình đã gửi"]')).length,1);
    assert.equal(await page.$eval(firstResponse,element=>element.value),'','unselected drafts must not leak into remounted forms');
    assert.equal(statements.length,2);
    const ids=await page.$$eval('[id]',nodes=>nodes.map(node=>node.id));
    assert.equal(new Set(ids).size,ids.length,'multiple selected forms must not duplicate DOM IDs');
    await page.screenshot({path:fileURLToPath(new URL('desktop.png',artifacts))});
    await page.click('[aria-label="Sản phẩm trả trong đơn"] > label input');
    assert.equal((await page.$$('[aria-label="Chi tiết yêu cầu"]')).length,0);
    assert.match(await page.$eval('[aria-label="Sản phẩm trả trong đơn"]',node=>node.textContent),/Chọn ít nhất một/);
    await page.type('input[aria-label="Tìm yêu cầu đổi trả"]','ao so mi');
    assert.equal((await page.$$('[aria-label="Danh sách yêu cầu"] > button')).length,1);
    assert.equal((await page.$$('[aria-label="Chọn sản phẩm trả hàng"] input')).length,1);
    assert.match(await page.$eval('[aria-label="Chi tiết yêu cầu"]',node=>node.textContent),/return-first/);
    assert.match(await page.$eval('[aria-label="Sản phẩm trả trong đơn"]',node=>node.textContent),/1\/3 yêu cầu theo bộ lọc/);
    await page.click('input[aria-label="Tìm yêu cầu đổi trả"]');await page.keyboard.down('Control');await page.keyboard.press('KeyA');await page.keyboard.up('Control');await page.keyboard.press('Backspace');
    await page.evaluate(()=>[...document.querySelectorAll('[aria-label="Lọc yêu cầu đổi trả"] button')].find(button=>button.textContent==='Đã phản hồi').click());
    await page.waitForFunction(()=>document.querySelectorAll('[aria-label="Chọn sản phẩm trả hàng"] input').length===2);
    assert.equal((await page.$$('[aria-label="Danh sách yêu cầu"] > button')).length,3);
    await page.click('input[aria-label="Chọn Áo khoác"]');
    await page.click('input[aria-label="Chọn Túi đeo chéo"]');
    assert.equal(await page.$eval('[aria-label="Chi tiết yêu cầu"]',element=>element.textContent.includes('Đã duyệt yêu cầu')),true);
    assert.equal(await page.$eval('[aria-label="Chi tiết yêu cầu"]',element=>element.textContent.includes('Đã hoàn tiền')),false);
    assert.equal(await page.$eval('[aria-label="Chi tiết yêu cầu"] a',node=>node.getAttribute('href')),'/merchant/returns/return-third','tracking must use the selected return request, not the shared order ID');
    for(const width of [1024,768,390]) {
      await page.setViewport({width,height:1000});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`overflow at ${width}`);
    }
    await page.screenshot({path:fileURLToPath(new URL('mobile.png',artifacts)),fullPage:true});
    rows=[]; await page.click('button[aria-label="Làm mới yêu cầu đổi trả"]');
    await page.waitForFunction(()=>document.body.textContent.includes('Chưa có yêu cầu đổi trả'));
    assert.deepEqual(legacyCalls,[]); assert.deepEqual(errors,[]);
  } finally {await browser.close();}
});
