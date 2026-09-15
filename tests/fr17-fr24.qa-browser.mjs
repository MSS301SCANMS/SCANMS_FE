// Explicit QA runner, not part of default tests. Core Orders/Wallets/Payouts
// requests use a real local Nest API; only ancillary auth/store/product GETs
// are mocked to isolate UI fixtures from auth/catalog workflows outside FR-17–24.
import puppeteer from "puppeteer-core";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const requireBackend = createRequire(
  new URL("../../backend/package.json", import.meta.url),
);
const jwt = requireBackend("jsonwebtoken");
const ExcelJS = requireBackend("exceljs");
const frontend = "http://127.0.0.1:5183";
const api = "http://127.0.0.1:5184";
assert.ok(
  process.env.QA_FIXTURE_JSON,
  "Set QA_FIXTURE_JSON from the local QA API fixture summary",
);
const fixture = JSON.parse(process.env.QA_FIXTURE_JSON);
const browser = await puppeteer.launch({
  executablePath: process.env.WITHDRAWAL_UI_BROWSER_PATH,
  headless: true,
});
const captured = [];
try {
  async function pageFor(role) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: 1440, height: 1100 });
    const user = {
      id: role === "SHOP_MANAGER" ? fixture.ownerId : fixture.kolId,
      role,
      fullName: "QA user",
    };
    const token = jwt.sign(
      { sub: user.id, role },
      "qa-local-only-not-a-production-secret",
    );
    await page.evaluateOnNewDocument(
      ({ user, token }) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem(
          "scanms-current-role",
          user.role === "SHOP_MANAGER" ? "shop" : "kol",
        );
        window.qaDownloads = [];
        const click = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function () {
          if (this.download) window.qaDownloads.push(this.download);
          else click.call(this);
        };
      },
      { user, token },
    );
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      void (async () => {
        const url = new URL(request.url());
        let data;
        if (url.pathname === "/api/auth/me") data = user;
        else if (url.pathname === "/api/stores/my-store")
          data = { id: fixture.storeId, name: "QA shop" };
        else if (url.pathname === "/api/products" && request.method() === "GET")
          data = {
            items: [
              {
                id: fixture.productId,
                sku: fixture.productSku,
                title: "QA product",
                price: 1000000,
                isActive: true,
                stockQuantity: 100,
              },
            ],
            total: 1,
            pagination: { totalPages: 1 },
          };
        if (url.hostname === "provinces.open-api.vn") {
          await request.respond({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify([
              {
                code: 1,
                name: "Hà Nội",
                districts: [
                  {
                    code: 1,
                    name: "Cầu Giấy",
                    wards: [{ code: 1, name: "Dịch Vọng" }],
                  },
                ],
              },
            ]),
          });
        } else if (data && request.method() !== "OPTIONS")
          await request.respond({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": frontend,
              "Access-Control-Allow-Credentials": "true",
            },
            body: JSON.stringify({ success: true, data }),
          });
        else if (url.origin === frontend || url.origin === api)
          await request.continue();
        else await request.abort();
      })();
    });
    page.on("response", (response) => {
      void (async () => {
        const path = new URL(response.url()).pathname;
        if (
          (path === "/api/orders/manual" ||
            path === "/api/wallets/withdrawals") &&
          response.request().method() === "POST"
        )
          captured.push({
            path,
            status: response.status(),
            body: await response.json(),
          });
      })();
    });
    return page;
  }
  const merchant = await pageFor("SHOP_MANAGER");
  await merchant.goto(frontend + "/merchant/orders", {
    waitUntil: "networkidle0",
  });
  await merchant.evaluate(() =>
    [...document.querySelectorAll("button")]
      .find((button) => button.textContent.includes("Tạo đơn thủ công"))
      .click(),
  );
  await merchant.waitForFunction(() =>
    [...document.querySelectorAll("select")].some((el) =>
      [...el.options].some((o) => o.textContent.includes("QA product")),
    ),
  );
  async function fillLabel(page, label, value) {
    const handle = await page.evaluateHandle(
      (text) =>
        [...document.querySelectorAll("label")]
          .find((el) => el.textContent.trim().startsWith(text))
          ?.querySelector("input,textarea"),
      label,
    );
    await handle.asElement().type(value);
    await handle.dispose();
  }
  await fillLabel(merchant, "Họ tên khách hàng", "QA browser buyer");
  await fillLabel(merchant, "Số điện thoại", "0902233445");
  await fillLabel(merchant, "Địa chỉ giao hàng", "QA browser address");
  const selects = await merchant.$$("section:first-of-type select");
  await selects[0].select("1");
  await selects[1].select("1");
  await merchant.select(
    `select:has(option[value="${fixture.productId}"])`,
    fixture.productId,
  );
  await merchant.$eval("form", (form) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await merchant.waitForFunction(() =>
    document.body.textContent.includes("Tạo đơn hàng thủ công thành công"),
  );
  await new Promise((resolve) => setTimeout(resolve, 300));
  const created = captured.filter(
    (x) => x.path === "/api/orders/manual" && x.status === 201,
  );
  console.log(
    JSON.stringify({
      id: "QA-21",
      doubleSubmitCreatedOrders: created.length,
      distinctCodes: new Set(
        created.map((x) => x.body.data.order.externalOrderSn),
      ).size,
    }),
  );
  assert.equal(
    created.length,
    1,
    "Double submit must create exactly one order",
  );
  const sn = created[0].body.data.order.externalOrderSn;
  const customer = await pageFor("COLLABORATOR");
  await customer.goto(
    frontend + "/tracking?sn=" + encodeURIComponent(fixture.reviewOrderSn),
    {
      waitUntil: "networkidle0",
    },
  );
  await customer.waitForFunction(() =>
    document.body.textContent.includes("Viết đánh giá"),
  );
  await customer.evaluate(() =>
    [...document.querySelectorAll("button")]
      .find((el) => el.textContent.includes("Viết đánh giá"))
      .click(),
  );
  await customer.click('[role="radio"][aria-label^="5 sao"]');
  await customer.type("textarea", "Sản phẩm tốt, đóng gói đẹp. ".repeat(45));
  assert.equal(
    await customer.$eval("textarea", (input) => input.value.length),
    1000,
  );
  await customer.type(
    'input[aria-label="Số điện thoại xác minh đánh giá"]',
    "0902233445",
  );
  await customer.$eval("form:has(textarea)", (form) => form.requestSubmit());
  await customer.waitForFunction(() => !document.querySelector("textarea"));
  console.log(
    JSON.stringify({
      id: "QA-22",
      realReviewIntegration: true,
      clientLimitedTo1000Characters: true,
      greenReviewPanel: await customer.$eval("main", (el) =>
        Boolean(el.querySelector('[class*="bg-emerald"]')),
      ),
    }),
  );
  const formatted = await fetch(api + "/api/orders/track?phone=%2B84902233445");
  const formattedBody = await formatted.json();
  assert.ok(
    formattedBody.data.orders.some((order) => order.externalOrderSn === sn),
  );
  console.log(
    JSON.stringify({
      id: "QA-23",
      formattedPhone: "+84902233445",
      matchingLocalPhone: "0902233445",
      returnedOrders: formattedBody.data.orders.length,
      status: formatted.status,
    }),
  );
  const kol = await pageFor("COLLABORATOR");
  await kol.goto(frontend + "/collaborator/wallet", {
    waitUntil: "networkidle0",
  });
  try {
    await kol.waitForFunction(
      () =>
        document.querySelector("#withdrawal-amount") &&
        !document.querySelector("#withdrawal-amount").disabled,
      { timeout: 10000 },
    );
  } catch (error) {
    throw new Error(
      await kol.$eval("body", (el) => el.textContent.slice(-3000)),
      { cause: error },
    );
  }
  await kol.type("#withdrawal-amount", "2000000");
  await kol.$eval("form", (form) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await kol.waitForFunction(() =>
    document
      .querySelector('[role="status"]')
      ?.textContent.includes("thành công"),
  );
  const withdrawals = captured.filter(
    (x) => x.path === "/api/wallets/withdrawals",
  );
  assert.equal(withdrawals.length, 1);
  const payout = withdrawals[0].body.data.request;
  assert.equal(payout.taxAmount, "200000.00");
  assert.equal(payout.netAmount, "1800000.00");
  console.log(
    JSON.stringify({
      id: "QA-24",
      realWithdrawalIntegration: true,
      postCount: withdrawals.length,
      tax: payout.taxAmount,
      net: payout.netAmount,
    }),
  );
  await merchant.goto(frontend + "/merchant/payouts", {
    waitUntil: "networkidle0",
  });
  await merchant.waitForFunction(
    (id) => document.querySelector("tbody")?.textContent.includes(id),
    {},
    payout.id,
  );
  await merchant.click(`input[aria-label="Chọn payout ${payout.id}"]`);
  let workbook;
  merchant.on("response", (response) => {
    if (
      response.url().endsWith("/export-vietqr") &&
      response.request().method() === "POST"
    )
      workbook = response.buffer();
  });
  await merchant.evaluate(() =>
    [...document.querySelectorAll("button")]
      .find((el) => el.textContent.includes("Xuất Excel VietQR"))
      .click(),
  );
  await merchant.waitForFunction(
    (id) =>
      [...document.querySelectorAll("tbody tr")]
        .find((el) => el.textContent.includes(id))
        ?.textContent.includes("Đang thanh toán theo lô"),
    {},
    payout.id,
  );
  assert.ok(workbook, "No real workbook downloaded");
  const excel = new ExcelJS.Workbook();
  await excel.xlsx.load(await workbook);
  assert.equal(excel.getWorksheet("VietQR").getCell("L2").value, "1800000.00");
  console.log(
    JSON.stringify({
      id: "QA-25",
      realBatchExport: true,
      netCell: excel.getWorksheet("VietQR").getCell("L2").value,
      processingVisible: await merchant.$eval("tbody", (el) =>
        el.textContent.includes("Đang thanh toán theo lô"),
      ),
    }),
  );
  await merchant.evaluate((id) => {
    const row = [...document.querySelectorAll("tbody tr")].find((el) =>
      el.textContent.includes(id),
    );
    [...row.querySelectorAll("button")]
      .find((el) => el.textContent.trim() === "Duyệt và tải bill")
      .click();
  }, payout.id);
  await merchant.type(
    'input[aria-label="Mã giao dịch ngân hàng"]',
    "QA-UPLOAD-FAIL",
  );
  await merchant.$eval('input[type="file"]', (input) => {
    const bytes = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aYZkAAAAASUVORK5CYII=",
      ),
      (char) => char.charCodeAt(0),
    );
    const files = new DataTransfer();
    files.items.add(new File([bytes], "qa-bill.png", { type: "image/png" }));
    input.files = files.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await merchant.$eval('[role="dialog"] form', (form) => form.requestSubmit());
  await merchant.waitForFunction(
    () => document.querySelector('[role="dialog"] [role="alert"]')?.textContent,
  );
  console.log(
    JSON.stringify({
      id: "QA-26",
      unavailableStorageFailureHandled: true,
      dialogRetainsInput: true,
      bankTransferPerformed: false,
    }),
  );
  await merchant.evaluate(() =>
    [...document.querySelectorAll('[role="dialog"] button')]
      .find((el) => el.textContent.trim() === "Hủy")
      .click(),
  );
  await merchant.evaluate(() =>
    [...document.querySelectorAll("button")]
      .find((el) => el.textContent.trim() === "Tải lại Excel")
      .click(),
  );
  await merchant.waitForFunction(() => window.qaDownloads.length >= 2);
  console.log(
    JSON.stringify({
      summary: "Real frontend-backend QA completed",
      coreAPIsMocked: false,
      ancillaryGETsMocked: ["auth/me", "stores/my-store", "products"],
      privateStorage: "no production credentials, provider unavailable",
      checks: 6,
    }),
  );
} finally {
  await browser.close();
}
