# SCANMS — đồng bộ frontend với backend microservices

Nguồn đối chiếu: SCANMS_Team_Assignment.docx (14 mục), conceptual được cung cấp trong cuộc trao đổi, và controller/DTO/enum hiện có trong SCANMS_BE. Tài liệu phân công mô tả mục tiêu; endpoint có trong code mới là khả năng thực thi hiện tại.

## Ranh giới domain

| Service | Domain | Owner theo phân công |
| --- | --- | --- |
| user-service + scanms-gateway | Identity, role, JWT, Gateway | Nhã |
| product-service | Store, StoreApplication, ProductCategory, Product, ProductImage, ProductVariant, Feedback, Livestream | Thịnh |
| promotion-affiliate-service | Voucher/VoucherRedemption; CollaboratorProfile, ReferralLink, CommissionPolicy, Commission | Thịnh phần voucher; Nam phần affiliate |
| order-service | Order, SellerOrder, OrderItem, Shipment, DiscountAllocation, ReturnRequest | Thắng |
| payment-service | Payment, Wallet, WalletTransaction, BankAccount, SellerSettlement, WithdrawalRequest, FeeConfig | Tuấn |
| ai-service | Phân tích ảnh: YOLO, màu, FashionCLIP/style | Nam; tích hợp Product với Thịnh |

Conceptual `Register_Store` tương ứng `StoreApplication`. `Transaction` cần đọc theo loại nghiệp vụ; biến động ví dùng `WalletTransaction`, thanh toán nhà cung cấp dùng `Payment`. Không đồng nhất hai loại. `Config_Rate` chưa đủ thông tin để xác định là phí hay hoa hồng; hiện giữ `FeeConfig` và `CommissionPolicy` tách riêng theo BE/phân công.

Quan hệ xuyên service dùng UUID, snapshot và API; không thêm JPA relationship xuyên database. Không tạo service hoặc database mới trong lần đồng bộ này.

## Contract frontend

- Gateway: `/api/v1`, mặc định proxy tới `http://localhost:8080` khi dev/preview.
- Response chính thức: `{ code, message, result }`. Lớp `api.ts` giữ alias `data` cho mã giao diện cũ còn lưu trong source; các màn hình hoạt động dùng `backendGet/backendPost/backendPatch` đọc `result`.
- DTO/enum được sinh từ sibling `SCANMS_BE` bằng `npm run contracts:sync`. `npm run contracts:check` báo lỗi khi DTO nguồn thay đổi. File sinh sẵn được commit để build frontend/Docker độc lập với thư mục BE.
- Các ID giữ đúng tên: `userId`, `storeId`, `productId`, `variantId`, `sellerOrderId`, `walletId`, v.v. JWT `sub` là `identitySubject`, không phải UUID nội bộ.
- VND dùng số nguyên an toàn. Rate BigDecimal có thể được nhận dưới dạng số hoặc chuỗi. Các màn hình chưa tự tính commission, fee, refund hay settlement.
- List BE hiện chưa có filter/pagination. UI lọc sau khi tải danh sách; không gửi các query giả vờ backend hỗ trợ. Đây không phải cơ chế authorization.
- Không cache chung dữ liệu tài khoản, stock, giá hay balance bằng cache frontend cũ.
- Endpoint guard của các màn hình resource vẫn chặn URL cũ hoặc method chưa nối vào màn hình. Checkout và finance có client riêng theo các controller mới; việc có endpoint không đồng nghĩa đã có nút thao tác trong route đang hoạt động.

## Xác thực

Frontend dùng Authorization Code + PKCE S256 qua Keycloak, không dùng password grant hoặc `/auth/login` của NestJS cũ. Token và hồ sơ giữ trong session của từng tab. `state` và thời hạn phiên xác thực được kiểm tra; đường dẫn quay về giới hạn trong ứng dụng. Khi token hết hạn, đăng nhập lại qua SSO; chưa triển khai silent refresh.

`GET /users/me` đồng bộ người dùng theo JWT đã được Resource Server xác minh:

- Tạo UUID nội bộ khi đăng nhập lần đầu; không tạo tài khoản theo email từ trình duyệt.
- Nhận business role từ `realm_access.roles` đã ký: `ADMIN`, `MANAGER`, `USER`, `SHOP_OWNER`, `KOL_CTV`; bỏ role Keycloak không thuộc domain.
- Giữ quyền `USER`; cập nhật tập role khi claim thay đổi, không ghi đè tên đã sửa và không kích hoạt lại tài khoản bị đình chỉ.
- Email trùng giữa hai subject không tự liên kết tài khoản; trả conflict. Hai lần đăng nhập đồng thời có thể gặp conflict lúc tạo hồ sơ, lần thử lại dùng hồ sơ đã tạo.
- Quy trình duyệt shop/KOL phải cập nhật role trong Keycloak; không tự cấp role từ request FE. Token mới cần được cấp sau khi thay đổi role.

Client Keycloak cần là public client `scanms-frontend`, bật Standard Flow, PKCE S256, mapper email/profile và realm roles. Với dev, thêm `http://localhost:5173/auth/callback` vào redirect URI, `http://localhost:5173` vào Web Origins và cấu hình post-logout redirect. Nếu dùng preview/127.0.0.1, cấu hình thêm origin tương ứng. Giá trị có thể đổi qua `.env`.

## Màn hình hiện hoạt động

Giữ application shell và tông màu hiện có; các route chính dùng màn hình tương thích BE. Các component, service và React Query hooks mới từ nhánh `develop` được giữ trong source; những endpoint legacy chưa có ở BE bị chặn bởi Gateway client và chưa gắn vào route hoạt động.

| Mục | Hành vi hiện tại |
| --- | --- |
| Catalog | Đọc Product, Category, Store, Image, Variant; lọc sản phẩm ACTIVE thuộc shop APPROVED; không sinh variant/stock mẫu |
| Shop | Đọc shop sở hữu; gửi StoreApplication với người gửi là UUID tài khoản, trạng thái PENDING |
| Product | Tạo Product với `name`, `priceVnd`, `status`, `attributes` JSON; không dùng `sizesStock/imageRefs` legacy làm nguồn dữ liệu |
| Image/Variant | Tạo resource riêng; giá/tồn kho trên variant; ảnh chính và sort order từ ProductImage |
| AI | Multipart `image` tới `/products/ai-analyze`; seller chọn detection và xác nhận thuộc tính trước khi lưu; không tự đăng sản phẩm/lưu ảnh |
| Livestream | Tạo SCHEDULED; tham chiếu nhiều Product/KOL trong các map JSON của live; số viewer khởi tạo 0 |
| Voucher | Tạo PLATFORM/STORE/PRODUCT/LIVESTREAM; FIXED/PERCENTAGE; tham chiếu đúng scope; bên phát hành theo quyền |
| Order | Đọc Order/SellerOrder/OrderItem/Shipment/Return/DiscountAllocation theo quan hệ ID, giữ enum từng resource |
| Affiliate | Đọc CollaboratorProfile/ReferralLink/CommissionPolicy/Commission; gửi hồ sơ KOL PENDING |
| Finance | Đọc Wallet/WalletTransaction/Withdrawal/Settlement và thông tin ngân hàng đã che; không tạo trực tiếp giao dịch tiền |
| Profile | GET/PATCH `/users/me`; sửa tên theo validation DTO, email hiển thị từ hồ sơ |

`StoreStatus` trong BE là `PENDING/APPROVED/SUSPENDED`; từ ACTIVE trong tài liệu phân công được diễn giải thành APPROVED cho shop đã duyệt, không gửi enum ACTIVE vào Store. Product/Variant vẫn dùng ACTIVE/INACTIVE/OUT_OF_STOCK.

Các map JSON chưa có schema nội bộ trong BE được FE ghi rõ: `Livestream.productRefs.productIds` và `collaboratorRefs.collaboratorIds` là mảng UUID; `Voucher.funding.fundedBy` là PLATFORM hoặc STORE. Đây là quy ước dữ liệu mới cần owner/consumer xác nhận trước khi triển khai checkout/commission. UI chưa hỗ trợ SHARED funding vì chưa có rule phân bổ được thống nhất.

## Các luồng còn chờ backend nghiệp vụ

Không gửi các request khung để giả lập những luồng sau:

- Gắn màn hình giỏ hàng mới vào route hoạt động và kiểm chứng E2E checkout với Product inventory reservation, voucher allocation, split SellerOrder và idempotency. BE hiện đã có `/checkout` và `/checkout/quote`; route giao diện mới chưa nối vào luồng này.
- Gắn các màn hình thanh toán/tài chính mới vào route hoạt động và kiểm chứng callback provider, cập nhật trạng thái Order, ví, refund, settlement và withdrawal trên dữ liệu thật. BE đã có `/finance/**`; những luồng này còn phụ thuộc cấu hình provider và các service nguồn.
- Kiểm chứng return theo quantity/hạn 14 ngày, verified purchase feedback và rating aggregation qua các service liên quan.
- Kiểm chứng commission resolver, điều kiện eligible sau 14 ngày giao hàng và xử lý partial return trên dữ liệu tích hợp.
- Public catalog không cần JWT, guest checkout, public tracking và short-link redirect/attribution.
- Chat Socket.IO, KYC, campaigns, media upload, notifications, leaderboard, AI fraud và gợi ý KOL: FE cũ có màn hình nhưng chưa có endpoint tương ứng trong BE hiện tại.

Các route cũ cho chức năng chưa có chuyển sang thông báo đang hoàn thiện; không báo thành công hoặc dùng dữ liệu mẫu thay dữ liệu thật. Prototype độc lập vẫn tại `/prototype`, có nhãn dữ liệu minh họa. Các action prototype không được xem là chức năng đang hoạt động.

Frontend chỉ lọc/ẩn chức năng theo role và ownership để trình bày đúng. Nhã và owner domain vẫn phải hoàn thiện kiểm tra phía server: các controller resource hiện chủ yếu mới yêu cầu authenticated, list chưa giới hạn owner, nhiều POST khung còn nhận ID/status từ request. Kết quả kiểm thử FE không chứng minh authorization BE hoàn chỉnh.

## Kiểm tra

```powershell
cd D:\MSS301\SCANMS_FE
npm.cmd run contracts:check
npm.cmd run build
npm.cmd run lint
npm.cmd test
$env:SCANMS_BROWSER_TESTS='1'
node --test tests/backend.browser.test.mjs
```

Browser test dùng Edge hoặc `SCANMS_BROWSER_PATH`, mock response theo DTO/enum thật. Nó kiểm tra các route resource đang hoạt động, scope shop, tạo Product/Variant/Voucher, từ chối sai role và bố cục điện thoại. Checkout/finance mới cần E2E riêng với Keycloak, PostgreSQL và nhà cung cấp thanh toán.

Backend: chạy `UserIdentitySyncTest` trong `user-service` để kiểm tra provisioning UUID, nhiều role, role bị thu hồi và tài khoản bị đình chỉ. Test context cũ cần PostgreSQL/Keycloak nên chạy riêng khi có hạ tầng.
## Cập nhật phần việc của Thịnh

BE hiện có duyệt StoreApplication/cấp SHOP_OWNER, CRUD Product/Category/Image/Variant, trạng thái và thống kê Livestream, Feedback xác minh đơn mua và sửa/xóa, cùng Voucher validate/reserve/commit/restore. FE đã đồng bộ DTO và hiển thị thống kê doanh thu shop, GMV livestream ở màn hình chi tiết. Luồng checkout/thanh toán thực tế và AI vẫn cần tích hợp E2E riêng; kiểm thử Docker hiện dùng đơn PAID tổng hợp để xác nhận các thống kê.
