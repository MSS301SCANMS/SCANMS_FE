/** Unwrap Spring ApiResponse `{ code, message, result }` and Nest-style `{ data }`. */
export function unwrapApi<T = any>(res: any): T {
  if (res == null) return res as T;
  if (Object.prototype.hasOwnProperty.call(res, 'result')) return res.result as T;
  if (Object.prototype.hasOwnProperty.call(res, 'data')) {
    const inner = res.data;
    if (inner && typeof inner === 'object' && Object.prototype.hasOwnProperty.call(inner, 'result')) {
      return inner.result as T;
    }
    if (inner && typeof inner === 'object' && Object.prototype.hasOwnProperty.call(inner, 'data')) {
      return inner.data as T;
    }
    return inner as T;
  }
  return res as T;
}

export function unwrapList<T = any>(res: any): T[] {
  const value = unwrapApi<any>(res);
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.orders)) return value.orders;
  return [];
}
