# Chuyển frontend SCANMS sang contract microservices

Tài liệu này thay thế hướng dẫn kết nối NestJS/Prisma trước đây. Backend hiện tại trong workspace là Java 21 / Spring Boot, chia User, Product, Order, Payment, Promotion/Affiliate và Gateway; AI là FastAPI riêng.

## Kiến trúc hiện tại

Frontend React → Gateway `/api/v1` → service sở hữu domain. Keycloak quản lý đăng nhập; User Service cung cấp UUID nội bộ và tập roles qua `/users/me`.

Contract chi tiết, mapping conceptual/phân công, khả năng hiện có và phần chờ backend được ghi trong [BACKEND_ALIGNMENT.md](./BACKEND_ALIGNMENT.md). Cách chạy nằm ở [README.md](./README.md).

## Thay đổi tích hợp

- Đổi API/proxy mặc định từ port 3000 và `/api` sang Gateway port 8080 và `/api/v1`.
- Chuẩn hóa `{ code, message, result }` và DTO/enum từ source Java.
- Chuyển login/register sang Authorization Code + PKCE qua Keycloak.
- Giữ nhiều roles và phân biệt `identitySubject` với `userId`.
- Tách Product/Variant/Image; dùng stock và giá variant thật.
- Tách Order/SellerOrder/Shipment/Return, Wallet/WalletTransaction/Withdrawal/Settlement.
- Dùng Voucher scope PLATFORM/STORE/PRODUCT/LIVESTREAM, không tái dùng Coupon lifecycle của FE cũ.
- Route hoạt động không còn gọi API NestJS, tạo stock/variant mẫu hoặc báo hoàn thành cho luồng BE chưa có.
- Giữ các component và prototype cũ làm tham khảo; không gắn chúng vào route nghiệp vụ mới. Không thay đổi các ảnh thiết kế trong `public/reference`.

## Phạm vi hiện tại

Có các luồng đọc dữ liệu, tạo catalog, gửi hồ sơ PENDING, lên lịch live, tạo voucher và phân tích ảnh trước khi seller xác nhận. BE mới đã bổ sung checkout, inventory reservation, voucher checkout và finance APIs; FE còn phải nối các màn hình nghiệp vụ mới vào route đang hoạt động và kiểm chứng tích hợp trên hạ tầng thật. Moderation, commission/14 ngày và quyền sở hữu vẫn cần kiểm chứng xuyên service.

Không chạy seed/migration, không đổi schema database, không tạo microservice mới. Bộ test browser dùng response theo contract thật, không xác nhận E2E với hạ tầng thật.

Trong checkout hiện tại không có thư mục `docs/ui-ux/NGUYENDINHTUAN` mà tài liệu cũ nhắc tới. Bản prototype tìm thấy và giữ lại là `public/reference`, truy cập tại `/prototype`.
