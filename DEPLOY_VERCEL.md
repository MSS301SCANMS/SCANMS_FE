# Deploy FE lên Vercel với địa chỉ cố định

Đây là hướng dẫn cho repo `MSS301SCANMS/SCANMS_FE`, nhánh `feat/livestream-commerce-sync-20261027`. Vercel chỉ phục vụ FE trong phương án này; backend, relay và database vẫn ở máy Windows. Máy phải bật, Docker/Spring/relay/tunnel phải chạy để đăng nhập và xem live.

## 1. Đưa bản code đã kiểm tra lên GitHub

Đã chuẩn bị `vercel.json` ở gốc FE: build Vite, output `dist`, SPA fallback cho `/live/:id`, header phù hợp popup Google, proxy `/api/*` và `/live-health` tới backend demo. Đây là file trong repo FE, không phải workspace cha `MSS301`.

Kiểm tra thay đổi trước khi commit/push bản FE mong muốn lên nhánh triển khai. Chưa tự commit hoặc push trong lần chuẩn bị này. Không đưa `.env.local`, token, client secret, mật khẩu BE hoặc `public/demo-public-config.json` lên Git. File JSON runtime đó được sinh riêng cho bản demo tunnel; không upload thủ công nó vào Vercel vì sẽ làm nút share trỏ về tunnel thay vì địa chỉ FE cố định.

## 2. Import dự án

1. Đăng nhập https://vercel.com bằng tài khoản có quyền repo GitHub.
2. Chọn **Add New → Project**, import `MSS301SCANMS/SCANMS_FE`.
3. Nếu repo không hiện, cấp quyền Vercel GitHub App cho repo đó; có thể cần người quản lý GitHub organization hỗ trợ.
4. Framework **Vite**; Root Directory `./` vì đã import riêng repo FE.
5. Build Command `npm run build`; Output Directory `dist`; Install Command `npm ci`. Node.js chọn phiên bản 22.x nếu có trong danh sách hỗ trợ.
6. Nhập biến môi trường ở bước tiếp theo trước khi Deploy.

## 3. Environment Variables

Áp dụng cho Production. Nếu cần thử Preview, cấu hình cùng giá trị cho Preview nhưng Google vẫn cần cấp phép riêng origin preview; nên dùng domain Production để test đăng nhập.

| Name | Value |
| --- | --- |
| `VITE_API_URL` | `/api/v1` |
| `VITE_GATEWAY_URL` | `/api/v1` |
| `VITE_CHECKOUT_API_URL` | `/api/v1` |
| `VITE_FINANCE_API_URL` | `/api/v1/finance` |
| `VITE_LEGACY_FINANCE_URL` | `/api` |
| `VITE_COMMERCE_BACKEND` | `spring` |
| `VITE_ENABLE_DEMO_LOGIN` | `false` |
| `VITE_LIVE_SOCKET_URL` | `https://heel-stamps-thing-formal.trycloudflare.com` |
| `VITE_SOCKET_URL` | `https://heel-stamps-thing-formal.trycloudflare.com` |
| `VITE_GOOGLE_CLIENT_ID` | `281102364785-etm73id59t8qvrbgrd16gpqg12plr21b.apps.googleusercontent.com` |
| `VITE_KEYCLOAK_CLIENT_ID` | `scanms-web` |
| `VITE_KEYCLOAK_ISSUER` | `https://heel-stamps-thing-formal.trycloudflare.com/realms/scanms` |

`VITE_KEYCLOAK_ISSUER` ở đây là địa chỉ trình duyệt truy cập Keycloak cho flow PKCE nếu sử dụng. Không tự sửa issuer xác thực backend chỉ vì deploy FE; backend hiện đọc issuer từ Keycloak local và dùng JWKS local.

`VITE_PUBLIC_SITE_URL`: để trống hoặc không tạo trên Vercel, để nút share dùng domain website hiện tại. Sau khi có domain Production thực tế, có thể đặt đúng domain đó nếu muốn luôn share Production kể cả từ Preview; không dùng domain ví dụ chưa tồn tại.

Không đưa biến `CLIENT_SECRET`, mật khẩu DB, refresh token hoặc TURN credential dài hạn vào `VITE_*`; các biến frontend được đưa vào JavaScript công khai.

Các URL tunnel trong bảng là backend demo hiện tại, không phải địa chỉ ổn định. Nếu `public-url.txt` đã đổi, thay đúng URL mới ở hai biến socket, Keycloak browser URL và hai destination trong `vercel.json` trước khi deploy.

## 4. Deploy và lấy domain Production

Nhấn **Deploy**. Sau khi thành công, mở **Settings → Domains**, lấy domain Production dạng `ten-du-an.vercel.app`. Tên cụ thể tùy tên dự án được cấp. Không lấy URL preview theo commit để gửi người dùng.

Trong phần Git/Production Branch, chọn `feat/livestream-commerce-sync-20261027` nếu đây là nhánh muốn cập nhật production tự động. Nếu deployment ban đầu là Preview do branch mặc định khác, dùng tùy chọn Promote to Production hoặc triển khai lại từ production branch sau khi cấu hình.

## 5. Cấp phép đúng domain FE cố định

Gọi domain thực tế vừa lấy là `https://TEN-THAT.vercel.app`:

- Chủ OAuth client Google thêm **chính xác origin đó** vào Authorized JavaScript origins của Client ID ở bảng trên, Save. Không thêm `/login` hoặc `/live/...`.
- Relay cần thêm **chính xác origin đó** vào `ALLOWED_ORIGINS`; hiện Prepare-IntelliJ tạo danh sách từ local/runtime, nên chỉ thêm trực tiếp vào file sinh `.env` sẽ bị ghi đè lần Run tiếp theo. Cần lưu origin Vercel trong cấu hình startup trước khi kiểm thử socket.
- Nếu dùng nút đăng nhập Keycloak PKCE, client `scanms-web` cần web origin đó và redirect URI `https://TEN-THAT.vercel.app/auth/keycloak/callback`. Google ID-token qua API không cần Google redirect URI giả định đó.
- Muốn nút chia sẻ từ FE local cũng dùng domain Vercel cố định, cần cập nhật bộ sinh cấu hình demo để dùng domain FE đó thay vì tunnel. Chỉ đổi `.env.local` chưa đủ vì runtime `demo-public-config.json` được ưu tiên khi bấm share.

Sau khi biết domain thật, cung cấp domain đó để hoàn tất các thay đổi local/runtime theo đúng địa chỉ; không dùng wildcard toàn bộ `*.vercel.app` cho relay hoặc Google.

API dùng `/api/v1` trên Vercel và được reverse proxy bởi `vercel.json`. Cách này giữ request đăng nhập/refresh cookie cùng origin FE; đừng đổi API sang gọi thẳng tunnel nếu chưa kiểm tra lại CORS, cookie và CSRF.

## 6. Kiểm thử

1. Mở tab ẩn danh với domain Production; thử email/mật khẩu và Google.
2. Shop tạo phiên, KOL chấp nhận, shop bắt đầu, KOL bật camera.
3. Sao chép link: phải bắt đầu bằng domain Production Vercel.
4. Máy khác mở link: nếu chưa đăng nhập phải vào login, đăng nhập xong quay lại đúng phòng.
5. Tải lại trực tiếp `/live/<id>` không được 404.
6. Kiểm tra video/audio và bình luận giữa hai thiết bị khác mạng. Chưa có TURN nên không thể bảo đảm mọi mạng sẽ truyền media trực tiếp.

Thay Environment Variables xong cần Redeploy vì Vite đưa giá trị vào bản build. Nếu backend tunnel đổi, vẫn cần sửa destination API/health trong `vercel.json`, đổi socket URL và redeploy FE; **domain Vercel gửi người dùng và origin Google không cần đổi** nếu giữ cùng Production domain. Để bỏ luôn bước cập nhật backend, cần địa chỉ backend ổn định.

Nguồn: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Environment Variables](https://vercel.com/docs/environment-variables), [Google Identity setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## Production đã cập nhật ngày 07/11/2026

- Website và origin Google cố định: `https://vercel-upload-20261107-1.vercel.app`.
- Backend/Socket.IO hiện tại: `https://heel-stamps-thing-formal.trycloudflare.com`.
- `VITE_PUBLIC_SITE_URL` dùng domain Vercel để chia sẻ từ localhost, tunnel hoặc Vercel đều quay về cùng frontend. `Ensure-PublicDemo.ps1` lưu riêng `siteUrl` và tunnel backend `url`; runtime JSON không dùng backend URL làm link chia sẻ nữa.
- Bản production `dpl_J2CSauPfU3HeRixsgdzbZzD87Znj` đã cập nhật; API/health qua Vercel, đăng nhập bằng tài khoản demo, đọc hồ sơ và WebSocket tới relay với origin Vercel đã kiểm tra thành công. Bốn kiểm tra link chia sẻ và build FE đều đạt.
- Nginx đang mount `.run-logs/demo-public/nginx.conf` từ workspace cha. Proxy API giữ đúng host Vercel cho origin đã xác định và xóa header `Forwarded` cũ trước khi tạo lại `X-Forwarded-*`; nếu thiếu bước này, POST đăng nhập qua Vercel có thể bị Spring từ chối 403.
- Chủ OAuth client cần thêm origin Vercel ở trên vào Authorized JavaScript origins. Chưa xác nhận Google sign-in thật vì bước cấp phép này do chủ dự án thực hiện.
- Khi Quick Tunnel backend đổi địa chỉ, cần cập nhật API/health rewrites và hai biến socket rồi deploy lại cùng project; domain frontend và origin Google vẫn giữ nguyên.