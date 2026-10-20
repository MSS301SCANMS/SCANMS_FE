import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('changing login role clears previous credentials and groups autofill by role', {
  skip: !base || !existsSync(executablePath), timeout:30000,
}, async()=>{
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({executablePath,headless:true});
  try {
    const page = await browser.newPage();
    await page.setViewport({width:1366,height:900});
    await page.setRequestInterception(true);
    const authCalls=[];
    page.on('request',request=>{
      const url=new URL(request.url());
      if(url.pathname==='/src/utils/demo-login.ts') return request.respond({status:200,contentType:'application/javascript',body:'export function getDemoLogin(){return null;}'});
      if(url.pathname.startsWith('/api/')||url.port==='3000') {
        if(url.pathname.includes('/auth/login')) authCalls.push(request.postData());
        return request.respond({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:[]})});
      }
      if(url.origin!==new URL(base).origin&&!['data:','blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(base+'/login');
    await page.waitForSelector('#login-identifier');
    async function selectRole(label) {
      await page.click('button[aria-controls="login-role-options"]');
      await page.waitForSelector('#login-role-options');
      await page.evaluate(label=>[...document.querySelectorAll('#login-role-options button')].find(button=>button.textContent.includes(label)).click(),label);
    }
    await selectRole('Quản trị');
    await page.type('#login-identifier','admin@example.test');
    await page.type('#login-password','FakeAdminPassword123');
    await selectRole('KOL/CTV');
    assert.equal(await page.$eval('#login-identifier',el=>el.value),'');
    assert.equal(await page.$eval('#login-password',el=>el.value),'');
    assert.equal(await page.$eval('#login-password',el=>el.type),'password');
    assert.equal(await page.$eval('#login-identifier',el=>el.autocomplete),'section-kol username');
    assert.equal(await page.$eval('#login-password',el=>el.autocomplete),'section-kol current-password');
    await page.type('#login-identifier','kol@example.test');
    await page.type('#login-password','FakeKolPassword123');
    await selectRole('KOL/CTV');
    assert.equal(await page.$eval('#login-identifier',el=>el.value),'kol@example.test','reselecting same role preserves the draft');
    assert.equal(await page.$eval('#login-password',el=>el.value),'FakeKolPassword123');
    await selectRole('Chủ Shop');
    assert.equal(await page.$eval('#login-identifier',el=>el.value),'');
    assert.equal(await page.$eval('#login-password',el=>el.value),'');
    await selectRole('Quản trị');
    assert.equal(await page.$eval('#login-identifier',el=>el.value),'');
    assert.equal(await page.$eval('#login-password',el=>el.value),'');
    assert.deepEqual(authCalls,[],'changing a role never submits stored credentials');
  } finally {await browser.close();}
});

test('five demo roles fill matching credentials without reusing browser-filled Admin details', {
  skip: !base || !existsSync(executablePath), timeout:30000,
}, async()=>{
  const browser=await puppeteer.launch({executablePath,headless:true});
  try {
    const page=await browser.newPage();
    await page.setRequestInterception(true);
    let logins=0;
    page.on('request',request=>{
      const url=new URL(request.url());
      if(url.pathname==='/src/utils/demo-login.ts') return request.respond({status:200,contentType:'application/javascript',body:`export function getDemoLogin(role){return {identifier:role+'@example.test',password:'Fixture-'+role+'-123'};}`} );
      if(url.pathname.startsWith('/api/')||url.port==='3000') {
        if(url.pathname.includes('/auth/login')) logins++;
        return request.respond({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:[]})});
      }
      if(url.origin!==new URL(base).origin&&!['data:','blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(base+'/login');
    await page.waitForSelector('#login-identifier');
    assert.equal(await page.$eval('#login-identifier',el=>el.value),'customer@example.test');
    assert.equal(await page.$eval('#login-password',el=>el.value),'Fixture-customer-123');
    for(const [role,label]of [['admin','Quản trị'],['kol','KOL/CTV'],['shop','Chủ Shop'],['manager','Vận hành'],['customer','Khách']]) {
      await page.click('button[aria-controls="login-role-options"]');
      await page.waitForSelector('#login-role-options');
      await page.evaluate(label=>[...document.querySelectorAll('#login-role-options button')].find(button=>button.textContent.includes(label)).click(),label);
      assert.equal(await page.$eval('#login-identifier',el=>el.value),role+'@example.test');
      assert.equal(await page.$eval('#login-password',el=>el.value),'Fixture-'+role+'-123');
      assert.equal(await page.$eval('#login-password',el=>el.type),'password');
      assert.equal(await page.$eval('#login-password',el=>el.autocomplete),'new-password');
      assert.equal(await page.$eval('#login-password',el=>el.readOnly),true);
      await page.click('#login-identifier');
      await page.$eval('#login-identifier',el=>el.select());
      await page.type('#login-identifier','autofilled-admin@example.test');
    }
    await page.reload();
    await page.waitForSelector('#login-identifier');
    assert.equal(await page.$eval('#login-identifier',el=>el.value),'customer@example.test');
    assert.equal(logins,0,'selection never logs in automatically');
  } finally {await browser.close();}
});
