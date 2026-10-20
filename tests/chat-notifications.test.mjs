import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/chat-notification-events.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { subscribeChatNotifications } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('shop reply refreshes the header and chimes once despite duplicate delivery', () => {
  const socket = new EventEmitter();
  let refreshes = 0;
  let sounds = 0;
  const cleanup = subscribeChatNotifications(socket, 'customer', () => refreshes++, () => sounds++);
  socket.emit('new_message', { id: 'reply-1', senderId: 'shop', conversationId: 'conversation' });
  socket.emit('new_message', { id: 'reply-1', senderId: 'shop', conversationId: 'conversation' });
  socket.emit('new_message', { id: 'own-message', senderId: 'customer' });
  assert.equal(refreshes, 1);
  assert.equal(sounds, 1);
  cleanup();
});

test('read receipts and reconnect reconcile the badge without playing another sound', () => {
  const socket = new EventEmitter();
  let refreshes = 0;
  let sounds = 0;
  const cleanup = subscribeChatNotifications(socket, 'customer', () => refreshes++, () => sounds++);
  socket.emit('messages_read', { readerId: 'other-customer' });
  socket.emit('messages_read', { readerId: 'customer' });
  socket.emit('connect');
  assert.equal(refreshes, 2);
  assert.equal(sounds, 0);
  cleanup();
});

test('cleanup removes only notification listeners, preserving the shared chat socket', () => {
  const socket = new EventEmitter();
  let chatEvents = 0;
  let refreshes = 0;
  socket.on('new_message', () => chatEvents++);
  const cleanup = subscribeChatNotifications(socket, 'customer', () => refreshes++, () => {});
  cleanup();
  socket.emit('new_message', { id: 'reply', senderId: 'shop' });
  assert.equal(chatEvents, 1);
  assert.equal(refreshes, 0);
  assert.equal(socket.listenerCount('messages_read'), 0);
});

test('deduplication state survives a listener rebind', () => {
  const socket = new EventEmitter();
  const seen = new Set();
  let sounds = 0;
  const subscribe = () => subscribeChatNotifications(socket, 'customer', () => {}, () => sounds++, seen);
  const cleanup = subscribe();
  socket.emit('new_message', { id: 'reply', senderId: 'shop' });
  cleanup();
  const cleanupAgain = subscribe();
  socket.emit('new_message', { id: 'reply', senderId: 'shop' });
  assert.equal(sounds, 1);
  cleanupAgain();
});
