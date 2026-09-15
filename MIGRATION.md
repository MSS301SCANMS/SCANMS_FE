# Chuyển UI NGUYENDINHTUAN vào frontend

## Stack

- Frontend: React 19, Vite, TypeScript (strict mode).
- Backend hiện có: NestJS + TypeScript + Prisma.
- Database hiện có: PostgreSQL. Lần chuyển UI này không đổi schema và không chạy seed/migration.

## Chạy

```sh
cd frontend
npm install
npm run dev
```

Trên PowerShell chặn `npm.ps1`, dùng `npm.cmd` thay `npm`.

- `/`: marketplace bằng React/TypeScript.
- `/marketplace`: cùng trang marketplace.
- `/app/:screenId`: toàn bộ không gian KOL, Shop, Vận hành, Admin và Khách mua bằng React.
- `/login`, `/register`: màn hình xác thực native React.
- `/tracking`, `/chat`, `/storefront`: các luồng public native React.
- `/reference/index.html`: bản sao chạy độc lập từ frontend, không cần server 4173.

## Đã chuyển native React

- Header, tìm kiếm không dấu, danh mục, banner, quyền lợi, thẻ Creator, danh sách sản phẩm và review.
- Modal native dialog: chi tiết sản phẩm, hồ sơ Creator, điều kiện voucher, hướng dẫn, video mẫu.
- Chọn/sao chép mã, giỏ hàng, tăng/giảm số lượng, tính giảm có điều kiện và giới hạn.
- Checkout/tra cứu đơn demo trong bộ nhớ phiên. Không gửi đơn, không thanh toán, không lưu PII vào localStorage.
- Dữ liệu mẫu có kiểu trong `src/features/marketplace/marketplaceData.ts`, tách khỏi component.
- CSS nền tái sử dụng bản thiết kế; component React có stylesheet riêng.

## Trạng thái chuyển đổi

Toàn bộ nhóm màn hình trong prototype đã có route và giao diện native React/TypeScript;
ứng dụng không còn dùng iframe để vận hành. Dashboard dùng một application shell thống
nhất và dữ liệu cấu trúc theo vai trò. Các module chưa có API vẫn dùng state/dữ liệu mẫu
ở phía React, vì vậy thao tác của chúng chưa được lưu vào PostgreSQL.

Chưa tích hợp API xác thực, catalog, đơn hàng, tồn kho và thanh toán. Không dùng
mock token làm đăng nhập thật. Khi nối API, backend phải xác thực lại giá, voucher,
quyền truy cập và tổng tiền; không tin giá trị từ trình duyệt.

`src/services/api.ts` hiện dùng prefix `/api`, khớp backend/src/main.ts. Không tự
đổi sang `/api/v1` khi backend chưa đổi prefix.

## Bản gốc

`docs/ui-ux/NGUYENDINHTUAN` không bị xóa/sửa. `public/reference` là bản chụp các
thư mục assets/css/js/vendor và index.html, không bao gồm figma-exports/serve.mjs.
Bản sao `marketplace-refinement.css` được bỏ một dấu đóng ngoặc thừa cuối file để Vite build được.
Không chỉnh bản gốc rồi kỳ vọng frontend tự đồng bộ; cần chuyển thay đổi vào component tương ứng.

## Kiểm tra

```sh
npm run build
npm run lint
npm test
```

Lint chỉ kiểm tra `src` native React; JS tham chiếu chưa được typecheck/lint lại.
Test kiểm tra dữ liệu/asset, tìm kiếm tiếng Việt và các quy tắc giảm giá demo.
Cần kiểm thử trực quan desktop/mobile và các thao tác modal bằng trình duyệt.
