// Live smoke test against the configured local API. Creates two QA chat messages
// between the documented seeded customer and Shop accounts.
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';

const base = process.env.SCANMS_TEST_API || 'http://localhost:3000/api';
const socketBase = base.replace(/\/api\/?$/, '');
const password = process.env.SCANMS_TEST_PASSWORD || 'Password@123';
const unwrap = (result) => result?.data?.data ?? result?.data ?? result;

async function request(path, token, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}: ${JSON.stringify(body)}`);
  return unwrap(body);
}
async function login(email) {
  return request('/auth/login', undefined, { method: 'POST', body: JSON.stringify({ email, password }) });
}
function event(socket, name, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(name, listener); reject(new Error(`Timeout: ${name}`)); }, 10000);
    const listener = (payload) => {
      if (!predicate(payload)) return;
      clearTimeout(timer); socket.off(name, listener); resolve(payload);
    };
    socket.on(name, listener);
  });
}
function send(socket, payload) {
  return new Promise((resolve, reject) => socket.timeout(10000).emit('send_message', payload, (error, result) => {
    if (error || !result?.ok) reject(error || new Error(result?.error || 'Send failed'));
    else resolve(result);
  }));
}

let customerSocket;
let shopSocket;
try {
  const [customer, shop] = await Promise.all([login('customer@scanms.vn'), login('shop@scanms.vn')]);
  assert.equal(customer.user.role, 'CUSTOMER');
  assert.equal(shop.user.role, 'SHOP_MANAGER');
  const store = await request('/stores/my-store', shop.accessToken);
  const catalog = await request(`/public/products?storeId=${store.id}&limit=1`);
  const product = catalog.items[0];
  assert.ok(product, 'Shop cần có ít nhất một sản phẩm để test');
  const conversation = await request('/chat/conversations', customer.accessToken, {
    method: 'POST', body: JSON.stringify({ storeId: store.id }),
  });
  assert.equal(conversation.customerId, customer.user.id);
  assert.equal(conversation.storeId, store.id);
  const shopConversations = await request('/chat/conversations', shop.accessToken);
  assert.ok(shopConversations.some((item) => item.id === conversation.id));

  customerSocket = io(`${socketBase}/chat`, { auth: { token: customer.accessToken }, transports: ['websocket'] });
  shopSocket = io(`${socketBase}/chat`, { auth: { token: shop.accessToken }, transports: ['websocket'] });
  await Promise.all([event(customerSocket, 'connect'), event(shopSocket, 'connect')]);
  shopSocket.emit('join_conversation', { conversationId: conversation.id });
  await event(shopSocket, 'joined_conversation', (payload) => payload.conversationId === conversation.id);

  const qaTag = 'QA chat kiểm thử';
  const productMessageId = crypto.randomUUID();
  const productCard = JSON.stringify({ type: 'PRODUCT_INQUIRY', productId: product.id, message: `${qaTag}: hỏi về sản phẩm` });
  const shopReceived = event(shopSocket, 'new_message', (message) => message.id === productMessageId);
  shopReceived.catch(() => undefined);
  await send(customerSocket, { conversationId: conversation.id, messageText: productCard, messageId: productMessageId });
  const productMessage = await shopReceived;
  const savedCard = JSON.parse(productMessage.messageText);
  assert.equal(savedCard.productId, product.id);
  assert.equal(savedCard.productTitle, product.title);
  assert.equal(Number(savedCard.productPrice), Number(product.price));
  assert.equal(productMessage.senderId, customer.user.id);
  const shopHistory = await request(`/chat/conversations/${conversation.id}/messages`, shop.accessToken);
  assert.ok(shopHistory.some((message) => message.id === productMessageId));
  await request(`/chat/conversations/${conversation.id}/read`, shop.accessToken, { method: 'PATCH' });

  const before = Number(await request('/chat/unread-count', customer.accessToken));
  const replyId = crypto.randomUUID();
  const customerReceived = event(customerSocket, 'new_message', (message) => message.id === replyId);
  customerReceived.catch(() => undefined);
  await send(shopSocket, { conversationId: conversation.id, messageText: `${qaTag}: Shop đã phản hồi`, messageId: replyId });
  const reply = await customerReceived;
  assert.equal(reply.senderId, shop.user.id);
  const unread = Number(await request('/chat/unread-count', customer.accessToken));
  assert.ok(unread > before, 'Chuông cần có tin chưa đọc khi Shop trả lời');
  const customerHistory = await request(`/chat/conversations/${conversation.id}/messages`, customer.accessToken);
  assert.ok(customerHistory.some((message) => message.id === replyId));
  const shopSawRead = event(shopSocket, 'messages_read', (payload) => payload.conversationId === conversation.id && payload.readerId === customer.user.id);
  await request(`/chat/conversations/${conversation.id}/read`, customer.accessToken, { method: 'PATCH' });
  await shopSawRead;
  const after = Number(await request('/chat/unread-count', customer.accessToken));
  assert.ok(after < unread);
  console.log(`PASS: product=${product.id}, conversation=${conversation.id}, shop received card, customer received reply, unread ${unread} → ${after}, read receipt emitted.`);
  console.log('Âm báo cần kiểm tra thủ công trong trình duyệt vì chính sách autoplay phụ thuộc trình duyệt.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  customerSocket?.disconnect();
  shopSocket?.disconnect();
}
