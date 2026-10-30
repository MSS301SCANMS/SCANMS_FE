import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL,executablePath=process.env.GHN_UI_BROWSER_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('customer/kol/shop sidebars return through the shopping guard to the marketplace hero without logging out',{
 skip:!base||!existsSync(executablePath),timeout:60000,
},async()=>{
 const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});
 const roles=[['CUSTOMER','customer','USER'],['COLLABORATOR','kol','KOL_CTV'],['SHOP_MANAGER','shop','SHOP_OWNER']];
 try{for(const [role,workspace,backendRole] of roles){
  const page=await browser.newPage(),errors=[];page.setDefaultTimeout(8000);await page.setViewport({width:1440,height:950});
  const user={id:'fixture-'+role,role,fullName:'Fixture '+role,roles:[backendRole]};
  page.on('pageerror',e=>{if(e.message!=='WebSocket closed without opened.')errors.push(e.message)});
  await page.evaluateOnNewDocument(({user,workspace})=>{localStorage.clear();localStorage.setItem('token','back-to-marketplace-fixture');localStorage.setItem('user',JSON.stringify(user));localStorage.setItem('scanms-active-workspace',workspace);localStorage.setItem('scanms-current-role',workspace);},{user,workspace});
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const url=new URL(request.url()),headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'};
   if(request.method()==='OPTIONS')return request.respond({status:204,headers});
   if(url.pathname==='/src/services/chat-socket.service.ts')return request.respond({contentType:'application/javascript',body:'const s={connected:false,on(){return this},off(){return this},emit(){},connect(){}};export const getChatSocket=()=>s;export const isChatSocketEnabled=()=>false;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};'});
   if(url.pathname.startsWith('/api/')){
    let result=[];
    if(url.pathname.endsWith('/users'))result={...user,userId:user.id,status:'ACTIVE'};
    if(url.pathname.endsWith('/public/products'))result={items:[],total:0};
    if(url.pathname.includes('/notifications/unread'))result={unreadCount:0};
    return request.respond({headers,contentType:'application/json',body:JSON.stringify({code:200,result})});
   }
   if(url.pathname==='/__sidebar-marketplace'||url.pathname==='/marketplace')return request.respond({contentType:'text/html; charset=utf-8',body:`<html><body><div id="root"></div><script type="module">
    import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import '/src/index.css';
    const source=await(await fetch('/src/components/layout/sidebars/SidebarShell.tsx')).text(),main=await(await fetch('/src/main.tsx')).text(),app=await(await fetch('/src/App.tsx')).text();
    const React=await import(source.match(/[\"]([^\"]*deps.react[.]js[^\"]*)[\"]/)[1]),dom=await import(main.match(/[\"]([^\"]*react-dom_client[.]js[^\"]*)[\"]/)[1]);
    const {BrowserRouter,Routes,Route}=await import(source.match(/[\"]([^\"]*react-router-dom[.]js[^\"]*)[\"]/)[1]);
    const {QueryClient,QueryClientProvider}=await import(app.match(/[\"]([^\"]*tanstack_react-query[.]js[^\"]*)[\"]/)[1]);
    const marketSource=await(await fetch('/src/pages/public/MarketplacePage.tsx')).text();
    const {CartProvider}=await import(marketSource.match(/[\"]([^\"]*CartContext[.]tsx[^\"]*)[\"]/)[1]);const {SidebarShell}=await import('/src/components/layout/sidebars/SidebarShell.tsx');const {SIDEBAR_THEMES}=await import('/src/components/layout/sidebars/sidebarTheme.ts');const {NAVIGATION_BY_ROLE}=await import('/src/config/navigation.config.ts');
    const {CustomerShoppingGuard}=await import('/src/routes/CustomerShoppingGuard.tsx');const {default:Marketplace}=await import('/src/pages/public/MarketplacePage.tsx');
    const h=React.createElement||React.default.createElement;const sidebar=h('div',{style:{width:280,height:760,padding:16}},h(SidebarShell,{role:${JSON.stringify(role)},theme:SIDEBAR_THEMES[${JSON.stringify(role)}],navConfig:NAVIGATION_BY_ROLE[${JSON.stringify(role)}],currentUser:${JSON.stringify(user)},onLogout:()=>{window.logoutCalled=true},displayName:'Fixture',editProfilePath:'/customer/profile',editProfileLabel:'Hồ sơ',getItemBadge:()=>null}));
    (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(QueryClientProvider,{client:new QueryClient({defaultOptions:{queries:{retry:false}}})},h(BrowserRouter,null,h(CartProvider,null,h(Routes,null,h(Route,{path:'/__sidebar-marketplace',element:sidebar}),h(Route,{element:h(CustomerShoppingGuard)},h(Route,{path:'/marketplace',element:h(Marketplace)})),h(Route,{path:'*',element:h('p',null,'Unexpected workspace redirect')}))))));
   </script></body></html>`});
   if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  });
  await page.goto(origin+'/__sidebar-marketplace');await page.waitForSelector('a[href="/marketplace"]');
  assert.equal(await page.$eval('a[href="/marketplace"]',el=>el.nextElementSibling.textContent.trim()),'Đăng xuất');
  await page.click('a[href="/marketplace"]');
  await page.waitForFunction(()=>location.pathname==='/marketplace'&&!!document.querySelector('h1')).catch(async error=>{throw Error(role+': '+error.message+' '+JSON.stringify({errors,body:await page.$eval('body',el=>el.innerText.slice(-1200)),path:await page.evaluate(()=>location.pathname)}))});
  assert.match(await page.$eval('h1',el=>el.textContent),/Một điểm đến/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('scanms-active-workspace')),'customer');
  assert.equal(await page.evaluate(()=>localStorage.getItem('token')),'back-to-marketplace-fixture');
  assert.equal(await page.evaluate(()=>window.logoutCalled),undefined);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('user')).role),role);
  assert.deepEqual(errors,[],role);await page.close();
 }}finally{await browser.close();}
});
