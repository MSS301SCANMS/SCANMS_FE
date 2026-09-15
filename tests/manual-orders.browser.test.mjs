import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import puppeteer from "puppeteer-core";
const requireBackend = createRequire(
  new URL("../../backend/package.json", import.meta.url),
);
const jwt = requireBackend("jsonwebtoken");
const ExcelJS = requireBackend("exceljs");
const base = process.env.WITHDRAWAL_UI_TEST_URL;
const browserPath = process.env.WITHDRAWAL_UI_BROWSER_PATH;
const rawFixture = process.env.QA_FIXTURE_JSON;

test(
  "FR20 prototype buttons open live manual/Excel dialogs; validation, double submit, template and row errors",
  { skip: !base || !browserPath || !rawFixture },
  async () => {
    assert.equal(new URL(base).hostname, "127.0.0.1");
    const fixture = JSON.parse(rawFixture);
    const browser = await puppeteer.launch({
      executablePath: browserPath,
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 1000 });
      const token = jwt.sign(
        { sub: fixture.ownerId, role: "SHOP_MANAGER" },
        "qa-local-only-not-a-production-secret",
      );
      await page.evaluateOnNewDocument(
        ({ token, ownerId }) => {
          localStorage.setItem("token", token);
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: ownerId,
              role: "SHOP_MANAGER",
              fullName: "QA owner",
            }),
          );
          localStorage.setItem("scanms-current-role", "shop");
        },
        { token, ownerId: fixture.ownerId },
      );
      const nativeDialogs = [];
      page.on("dialog", async (dialog) => {
        nativeDialogs.push(dialog.message());
        await dialog.dismiss();
      });
      const captured = [];
      page.on("response", async (response) => {
        if (
          response.url().endsWith("/api/orders/manual") &&
          response.request().method() === "POST"
        )
          captured.push({
            status: response.status(),
            body: await response.json(),
          });
      });
      await page.setRequestInterception(true);
      page.on("request", async (request) => {
        const url = new URL(request.url());
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
              {
                code: 2,
                name: "QA Province",
                districts: [{ code: 2, name: "QA District", wards: [] }],
              },
            ]),
          });
        } else if (["127.0.0.1", "localhost"].includes(url.hostname))
          await request.continue();
        else await request.abort();
      });
      await page.goto(base + "/app/orders", { waitUntil: "networkidle0" });
      const frame = page
        .frames()
        .find((frame) => frame.url().includes("/reference/index.html"));
      assert.ok(frame);
      await frame.click('[data-order-form="manual"]');
      await page.waitForSelector("dialog[open] form");
      await page.waitForFunction(
        (id) => document.querySelector(`select option[value="${id}"]`),
        {},
        fixture.productId,
      );
      async function fill(label, value) {
        const handle = await page.evaluateHandle(
          (text) =>
            [...document.querySelectorAll("dialog label")]
              .find((label) => label.textContent.trim().startsWith(text))
              ?.querySelector("input,textarea"),
          label,
        );
        assert.ok(handle.asElement(), label);
        await handle.asElement().click();
        await page.keyboard.down("Control");
        await page.keyboard.press("A");
        await page.keyboard.up("Control");
        await handle.asElement().type(value);
        await handle.dispose();
      }
      await fill("Họ tên", "QA browser nested buyer");
      await fill("Số điện thoại", "0");
      await fill("Email", "qa@example.test");
      await fill("Địa chỉ giao hàng", "123 QA Road");
      const addressSelects = await page.$$(
        "dialog section:first-of-type select",
      );
      await addressSelects[0].select("1");
      await addressSelects[1].select("1");
      await addressSelects[2].select("1");
      await addressSelects[0].select("2");
      assert.equal(
        await addressSelects[1].evaluate((select) => select.value),
        "",
      );
      assert.equal(
        await addressSelects[2].evaluate((select) => select.value),
        "",
      );
      await addressSelects[0].select("1");
      await addressSelects[1].select("1");
      await addressSelects[2].select("1");
      await page.select(
        'select[aria-label="Sản phẩm dòng 1"]',
        fixture.productId,
      );
      assert.equal(
        await page.$eval(
          'input[aria-label="Đơn giá dòng 1"]',
          (input) => input.value,
        ),
        "1000000",
      );
      await page.$eval("dialog form", (form) => form.requestSubmit());
      await page.waitForFunction(() =>
        document.querySelector('[role="alert"]')?.textContent.includes("SĐT"),
      );
      assert.equal(captured.length, 0);
      await fill("Số điện thoại", "0902 233 445");
      await fill("Phí vận chuyển", "30000");
      await page.$eval("dialog form", (form) => {
        form.requestSubmit();
        form.requestSubmit();
      });
      await page
        .waitForFunction(() =>
          document
            .querySelector('[role="status"]')
            ?.textContent.includes("Tạo đơn hàng thủ công thành công"),
        )
        .catch(async (error) => {
          console.log(
            "Manual form failure evidence",
            JSON.stringify(
              await page.$eval("dialog", (dialog) => ({
                text: dialog.textContent,
                invalid: [...dialog.querySelectorAll("input,select,textarea")]
                  .filter((input) => !input.checkValidity())
                  .map((input) => ({
                    label: input.closest("label")?.textContent,
                    value: input.value,
                    message: input.validationMessage,
                  })),
              })),
            ),
            JSON.stringify(captured),
          );
          throw error;
        });
      assert.equal(captured.length, 1);
      assert.equal(captured[0].status, 201);
      assert.equal(Number(captured[0].body.data.order.finalAmount), 1030000);
      const sn = captured[0].body.data.order.externalOrderSn;
      const tracked = await fetch(
        "http://127.0.0.1:5184/api/orders/track?phone=0902233445&orderSn=" +
          encodeURIComponent(sn),
      );
      const trackedBody = await tracked.json();
      assert.ok(
        trackedBody.data.orders.some(
          (order) =>
            order.externalOrderSn === sn &&
            order.shippingAddress.includes("Dịch Vọng"),
        ),
      );
      await page.click('dialog button[aria-label="Đóng"]');
      await frame.click('[data-order-form="excel"]');
      await page.waitForSelector('dialog[open] input[type="file"]');
      const template = await page.evaluate(
        async ({ token }) => {
          const response = await fetch(
            "http://127.0.0.1:5184/api/orders/import-excel/template",
            { headers: { Authorization: "Bearer " + token } },
          );
          return {
            status: response.status,
            bytes: [...new Uint8Array(await response.arrayBuffer())],
          };
        },
        { token },
      );
      assert.equal(template.status, 200);
      const book = new ExcelJS.Workbook();
      await book.xlsx.load(Buffer.from(template.bytes));
      const sheet = book.worksheets[0];
      const unique = crypto.randomUUID().slice(0, 8);
      sheet.addRow([
        "QA-UI-GOOD-" + unique,
        "QA",
        "0902233445",
        "QA Address",
        fixture.productSku,
        1,
        "PENDING",
        1000000,
        0,
      ]);
      sheet.addRow([
        "QA-UI-BAD-" + unique,
        "QA",
        "0902233445",
        "QA Address",
        fixture.productSku,
        0,
        "PENDING",
        1000000,
        0,
      ]);
      const bytes = [...Buffer.from(await book.xlsx.writeBuffer())];
      await page.$eval(
        'dialog input[type="file"]',
        (input, bytes) => {
          const transfer = new DataTransfer();
          transfer.items.add(
            new File([new Uint8Array(bytes)], "qa-orders.xlsx", {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
          );
          input.files = transfer.files;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        },
        bytes,
      );
      async function clickImport() {
        await page.evaluate(() =>
          [...document.querySelectorAll("dialog button")]
            .find((button) => button.textContent.trim() === "Import đơn hàng")
            .click(),
        );
      }
      await clickImport();
      await page.waitForFunction(() =>
        document
          .querySelector('[role="alert"]')
          ?.textContent.includes("1 đơn thành công"),
      );
      assert.ok(
        await page.$eval(
          "dialog",
          (dialog) =>
            dialog.textContent.includes("Số lượng") &&
            dialog.textContent.includes("QA-UI-BAD"),
        ),
      );
      await clickImport();
      await page.waitForFunction(() =>
        document
          .querySelector('[role="alert"]')
          ?.textContent.includes("0 đơn thành công"),
      );
      assert.ok(
        await page.$eval("dialog", (dialog) =>
          dialog.textContent.includes("trùng"),
        ),
      );
      await page.keyboard.press("Escape");
      assert.equal(await page.$("dialog[open]"), null);
      assert.equal(nativeDialogs.length, 0);
      console.log(
        "FR20 live Docker UI/API scenarios PASS: prototype bridge, address cascade, validation, double submit, shipping total, template, partial import and duplicate import",
      );
    } finally {
      await browser.close();
    }
  },
);
