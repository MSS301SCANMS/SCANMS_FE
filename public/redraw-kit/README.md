# SCANMS Figma Redraw Kit

Thư mục này gom toàn bộ ảnh màn hình hiện tại để dựng lại trên Figma.

- `frontend-current/`: ảnh giao diện FE màu vàng/beige hiện tại để vẽ lại.
- `colors.json`: design tokens vàng/beige của frontend hiện tại.
- `screens.json`: danh mục màn hình, nhóm người dùng và route web tương ứng.

Quy ước khi vẽ lại:

1. Tạo frame Desktop 1440 × 1024.
2. Dùng `brand.primary` cho nút chính và trạng thái đang chọn; giữ hệ màu vàng/beige hiện tại.
3. Dùng `surface.canvas` cho nền ứng dụng, `surface.card` cho card và `border.default` cho đường viền.
4. Giữ bán kính 12–14 px cho card, 8–10 px cho input/button và pill cho badge.
5. Ảnh là tài liệu tham chiếu; nội dung tương tác thật nằm trong các route ghi ở `screens.json`.
