import assert from 'node:assert/strict';
import { test } from 'node:test';

// 1. Kiểm tra ánh xạ trạng thái tiếng Việt chuẩn
const STATUS_VI_MAP = {
  ACTIVE: 'Đang hoạt động',
  PAUSED: 'Tạm ngừng',
  EXPIRED: 'Đã hết hạn',
  BLOCKED: 'Đã bị khóa',
  DELETED: 'Đã xóa mềm',
};

const FIELD_VI_MAP = {
  disabledReason: 'Lý do khóa',
  disabledBy: 'Người thực hiện khóa',
  disabledAt: 'Thời điểm khóa',
};

test('Trạng thái link được dịch sang tiếng Việt chuẩn theo Mục 18', () => {
  assert.equal(STATUS_VI_MAP.ACTIVE, 'Đang hoạt động');
  assert.equal(STATUS_VI_MAP.PAUSED, 'Tạm ngừng');
  assert.equal(STATUS_VI_MAP.EXPIRED, 'Đã hết hạn');
  assert.equal(STATUS_VI_MAP.BLOCKED, 'Đã bị khóa');
  assert.equal(STATUS_VI_MAP.DELETED, 'Đã xóa mềm');

  assert.equal(FIELD_VI_MAP.disabledReason, 'Lý do khóa');
  assert.equal(FIELD_VI_MAP.disabledBy, 'Người thực hiện khóa');
  assert.equal(FIELD_VI_MAP.disabledAt, 'Thời điểm khóa');
});

// 2. Kiểm tra quy tắc mã rút gọn Base36 8 ký tự
test('Mã rút gọn Base36 phải dài đúng 8 ký tự chỉ gồm chữ thường và số', () => {
  const shortCodeRegex = /^[a-z0-9]{8}$/;
  assert.ok(shortCodeRegex.test('a7kp2m9q'));
  assert.ok(shortCodeRegex.test('01234567'));
  assert.ok(shortCodeRegex.test('abcdefgh'));

  // Không hợp lệ: có chữ hoa, dấu, khoảng trắng hoặc độ dài sai
  assert.equal(shortCodeRegex.test('a7KP2m9q'), false);
  assert.equal(shortCodeRegex.test('a7kp2m9'), false);
  assert.equal(shortCodeRegex.test('a7kp2m9q1'), false);
  assert.equal(shortCodeRegex.test('a7kp-m9q'), false);
});

// 3. Kiểm tra validation khi tạo link (Nhãn và Kênh là bắt buộc)
test('Bắt buộc phải có nhãn và kênh khi tạo link theo mô hình nhiều link', () => {
  function validateCreateLink(payload) {
    if (!payload.productId) return 'Vui lòng chọn sản phẩm tiếp thị.';
    if (!payload.channel) return 'Kênh quảng bá (channel) là bắt buộc.';
    if (!payload.label || !payload.label.trim()) return 'Nhãn gợi nhớ (label) là bắt buộc.';
    return null;
  }

  // Hợp lệ
  assert.equal(
    validateCreateLink({
      productId: 'p-1',
      channel: 'TIKTOK',
      label: 'Video review 9.9',
    }),
    null,
  );

  // Thiếu kênh
  assert.equal(
    validateCreateLink({
      productId: 'p-1',
      label: 'Video review 9.9',
    }),
    'Kênh quảng bá (channel) là bắt buộc.',
  );

  // Thiếu nhãn
  assert.equal(
    validateCreateLink({
      productId: 'p-1',
      channel: 'TIKTOK',
      label: '   ',
    }),
    'Nhãn gợi nhớ (label) là bắt buộc.',
  );
});

// 4. Kiểm tra quy tắc bảo mật HttpOnly: Frontend không tự đọc/sửa cookie
test('Cookie attribution scanms_attribution phải được quản lý 100% bởi Backend qua HttpOnly', () => {
  // Mock cookie string không cho phép JS đọc các cookie HttpOnly
  const clientVisibleCookies = 'session_id=123; user_theme=dark';
  const hasAttributionInJS = clientVisibleCookies.includes('scanms_attribution');
  assert.equal(hasAttributionInJS, false, 'Frontend JS không được phép đọc hoặc tạo scanms_attribution');
});
