# SCANMS frontend

Chạy giao diện đang phát triển bằng `npm.cmd run dev` trong thư mục `frontend`.
Chạy bản build bằng `npm.cmd run preview`; lệnh này tự build lại trước khi mở
preview để tránh phục vụ giao diện cũ còn trong `dist`.

Trang chi trả dùng chung trang React tích hợp API qua hai đường dẫn:

- `/app/payouts`: nhúng trang chi trả React trong sidebar/header prototype vàng be.
- `/merchant/payouts`: trang React tích hợp API trong `src/pages/merchant/PayoutApprovalPage.tsx`.

Khi kiểm tra giao diện, dùng cùng một đường dẫn và địa chỉ server. Trang `/`
còn khôi phục màn hình prototype gần nhất từ localStorage. Thay đổi trong
`docs/ui-ux/NGUYENDINHTUAN` không tự đồng bộ sang `public/reference`.

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
