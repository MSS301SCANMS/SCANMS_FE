# SCANMS frontend

Frontend React/TypeScript cho SCANMS, tích hợp backend Spring Boot microservices qua Gateway.

## Chạy local

```powershell
cd D:\MSS301\SCANMS_FE
npm.cmd install
Copy-Item .env.example .env
npm.cmd run dev
```

Ứng dụng chạy tại http://localhost:5173. API mặc định dùng `/api/v1`, Vite proxy đến Gateway tại http://localhost:8080. Sửa `VITE_PROXY_TARGET` trong `.env` nếu Gateway chạy ở địa chỉ khác. Không chạy backend NestJS/Prisma cũ.

Đăng nhập/đăng ký được thực hiện qua Keycloak. Cấu hình public client, redirect URI và realm roles theo [BACKEND_ALIGNMENT.md](./BACKEND_ALIGNMENT.md). Lần đăng nhập đầu, User Service đồng bộ identity và tạo UUID nội bộ từ JWT đã xác minh.

## Các route chính

- `/`, `/products/:productId`, `/shops/:shopId`: catalog và biến thể thật; hiện yêu cầu đăng nhập.
- `/merchant/products`: Product, Variant, Image, Category, Feedback.
- `/merchant/dashboard`, `/merchant/livestreams`, `/merchant/vouchers`: shop, lịch live và voucher.
- `/customer/orders`, `/merchant/orders`: Order/SellerOrder/OrderItem, giao nhận và trả hàng.
- `/collaborator/dashboard`: referral, commission và hồ sơ KOL.
- `/merchant/wallet`, `/collaborator/wallet`: ví, ledger, settlement và withdrawal.
- `/customer/upgrade`: gửi hồ sơ mở shop hoặc đăng ký KOL.
- `/account`: xem/sửa hồ sơ.
- `/prototype`: bản thiết kế tham khảo có dữ liệu minh họa, tách khỏi route dữ liệu thật.

Checkout và finance đã có API nghiệp vụ ở BE mới; giao diện route chính hiện vẫn dùng màn hình resource và chưa gắn toàn bộ luồng đặt hàng/thanh toán. Không dùng POST resource khung để giả lập các lệnh tiền hoặc cấp quyền. Xem phạm vi trong [BACKEND_ALIGNMENT.md](./BACKEND_ALIGNMENT.md).

## Kiểm tra

```powershell
npm.cmd run contracts:check
npm.cmd run build
npm.cmd run lint
npm.cmd test
$env:SCANMS_BROWSER_TESTS='1'
node --test tests/backend.browser.test.mjs
```

DTO/enum sinh sẵn tại `src/types/backend.generated.ts`; khi BE thay đổi, chạy `npm.cmd run contracts:sync` từ checkout có sibling `SCANMS_BE`. Browser test dùng Edge hoặc đường dẫn `SCANMS_BROWSER_PATH`.

`npm.cmd run preview` tự build lại và phục vụ tại port 4173, có proxy API đến Gateway. Cấu hình thêm origin/redirect URI 4173 trong Keycloak nếu dùng đăng nhập ở preview.

Khi triển khai build tĩnh, reverse proxy `/api/v1` tới Gateway và fallback route frontend về `index.html`. Dockerfile hiện là môi trường phát triển; nếu Gateway ở máy host, đặt `VITE_PROXY_TARGET=http://host.docker.internal:8080`.
