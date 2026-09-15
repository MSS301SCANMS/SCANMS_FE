import test from "node:test";
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const testUrl = process.env.WITHDRAWAL_UI_TEST_URL;
const browserPath = process.env.WITHDRAWAL_UI_BROWSER_PATH;

test(
  "merchant payout UI requires a bill, submits multipart once and recovers exported batches",
  { skip: !testUrl || !browserPath },
  async () => {
    const url = new URL(testUrl);
    assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
    const browser = await puppeteer.launch({
      executablePath: browserPath,
      headless: true,
      pipe: true,
    });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 1000 });
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem("token", "isolated-browser-test-token");
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: "test-owner",
            role: "SHOP_MANAGER",
            fullName: "Test Owner",
          }),
        );
        localStorage.setItem("scanms-current-role", "shop");
        window.testDownloads = [];
        window.testUpload = null;
        const send = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (body) {
          if (body instanceof FormData) {
            const file = body.get("bill");
            window.testUpload = {
              ref: body.get("bankRefCode"),
              note: body.get("note"),
              filename: file?.name,
              type: file?.type,
              size: file?.size,
            };
          }
          return send.call(this, body);
        };
        const original = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function () {
          if (this.download) window.testDownloads.push(this.download);
          else original.call(this);
        };
      });
      const storeId = "38b2b124-12d2-47f8-881f-c3107ee71084";
      const requests = ["first", "second", "third"].map((name, i) => ({
        id: `38b2b124-12d2-47f8-881f-c3107ee7108${i}`,
        storeId,
        collaboratorId: name,
        collaboratorName: `Test KOL ${name}`,
        collaboratorPhone: "0901234567",
        collaboratorEmail: "kol@example.test",
        collaboratorTaxCode: "0123456789",
        kycStatus: "VERIFIED",
        amount: "2000000.00",
        taxAmount: "200000.00",
        netAmount: "1800000.00",
        status: "PENDING",
        bankName: "Test Bank",
        bankAccountName: "TEST KOL",
        bankAccountNumber: "00123456789",
        bankRefCode: null,
        batchId: null,
        hasBill: false,
        rejectedReason: null,
        createdAt: new Date().toISOString(),
        processedAt: null,
      }));
      const batches = [];
      let approvalCount = 0;
      let exportCount = 0;
      let downloadCount = 0;
      let failure;
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        void (async () => {
          const path = new URL(request.url());
          if (!path.pathname.startsWith("/api/")) {
            if (path.origin === url.origin) await request.continue();
            else await request.abort();
            return;
          }
          const headers = {
            "Access-Control-Allow-Origin": url.origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
          };
          if (request.method() === "OPTIONS") {
            await request.respond({ status: 204, headers });
            return;
          }
          let data = {};
          if (path.pathname === "/api/auth/me")
            data = {
              id: "test-owner",
              role: "SHOP_MANAGER",
              fullName: "Test Owner",
            };
          else if (path.pathname === "/api/stores/my-store")
            data = { id: storeId, name: "Test Shop" };
          else if (path.pathname.endsWith("/approve")) {
            assert.equal(request.method(), "POST");
            assert.match(path.pathname, /^\/api\/payouts\//);
            assert.ok(
              request
                .headers()
                ["content-type"].startsWith("multipart/form-data; boundary="),
              `Unexpected upload content type: ${request.headers()["content-type"]}`,
            );
            // CDP omits multipart file contents; verify the File at XHR.send below.
            approvalCount++;
            const payout = requests.find((item) =>
              path.pathname.includes(item.id),
            );
            payout.status = "APPROVED";
            payout.hasBill = true;
            payout.bankRefCode = "REF-001";
            data = payout;
          } else if (path.pathname.endsWith("/reject")) {
            const body = JSON.parse(request.postData());
            assert.equal(body.reason, "Bank details need review");
            const payout = requests.find((item) =>
              path.pathname.includes(item.id),
            );
            payout.status = "REJECTED";
            payout.rejectedReason = body.reason;
            data = payout;
          } else if (path.pathname.endsWith("/bill"))
            data = { url: "https://example.test/private-bill?expires=120" };
          else if (path.pathname.endsWith("/export-vietqr")) {
            const body = JSON.parse(request.postData());
            assert.deepEqual(body.payoutIds, [requests[1].id]);
            exportCount++;
            const batch = {
              id: "38b2b124-12d2-47f8-881f-c3107ee71099",
              createdAt: new Date().toISOString(),
              payoutCount: 1,
            };
            batches.push(batch);
            requests[1].status = "PROCESSING";
            requests[1].batchId = batch.id;
            await request.respond({
              status: 200,
              headers,
              contentType:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              body: Buffer.from("mock-workbook"),
            });
            return;
          } else if (path.pathname.endsWith("/download")) {
            downloadCount++;
            await request.respond({
              status: 200,
              headers,
              contentType:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              body: Buffer.from("mock-workbook"),
            });
            return;
          } else if (path.pathname.endsWith("/batches"))
            data = { batches, total: batches.length };
          else if (path.pathname.endsWith("/payouts")) {
            const status = path.searchParams.get("status");
            const filtered = requests.filter(
              (item) => !status || item.status === status,
            );
            data = {
              requests: filtered,
              total: filtered.length,
              page: 1,
              limit: 10,
              maxBillBytes: 5242880,
            };
          }
          await request.respond({
            status: 200,
            headers,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data }),
          });
        })().catch(async (error) => {
          failure = error;
          if (!request.isInterceptResolutionHandled()) await request.abort();
        });
      });
      await page.goto(`${url.origin}/merchant/payouts`, {
        waitUntil: "networkidle0",
      });
      await page
        .waitForFunction(() =>
          document
            .querySelector('table[aria-label="Danh sách payout"] tbody')
            ?.textContent.includes("Test KOL first"),
        )
        .catch(async (error) => {
          throw new Error(
            `Initial payout page did not load: ${await page.$eval("body", (el) => el.textContent.slice(0, 1200))}`,
            { cause: failure ?? error },
          );
        });
      const clickText = async (text) => {
        await page.evaluate((label) => {
          const button = [...document.querySelectorAll("button")].find(
            (item) => item.textContent.trim() === label,
          );
          if (!button || button.disabled)
            throw new Error(`Button unavailable: ${label}`);
          button.click();
        }, text);
      };
      const clickRow = async (id, text) => {
        await page.evaluate(
          ({ id, text }) => {
            const row = [...document.querySelectorAll("tbody tr")].find(
              (item) => item.textContent.includes(id),
            );
            const button = [...row.querySelectorAll("button")].find(
              (item) => item.textContent.trim() === text,
            );
            if (!button || button.disabled)
              throw new Error(`Row action unavailable: ${text}`);
            button.click();
          },
          { id, text },
        );
      };
      await clickRow(requests[0].id, "Duyệt và tải bill");
      assert.ok(await page.$eval("dialog", (el) => el.open));
      const dialogText = await page.$eval("dialog", (el) => el.textContent);
      for (const value of [
        "0901234567",
        "kol@example.test",
        "0123456789",
        "**** 6789",
        "1.800.000",
      ])
        assert.ok(dialogText.includes(value));
      assert.equal(
        await page.$eval(
          '[role="dialog"] button[type="submit"]',
          (el) => el.disabled,
        ),
        true,
      );
      await page.type('input[aria-label="Mã giao dịch ngân hàng"]', "REF-001");
      assert.equal(
        await page.$eval(
          '[role="dialog"] button[type="submit"]',
          (el) => el.disabled,
        ),
        true,
      );
      const setFile = async (type, name) => {
        await page.$eval(
          'input[type="file"]',
          (input, { type, name }) => {
            const files = new DataTransfer();
            files.items.add(
              new File([new Uint8Array([137, 80, 78, 71])], name, { type }),
            );
            input.files = files.files;
            input.dispatchEvent(new Event("change", { bubbles: true }));
          },
          { type, name },
        );
      };
      await setFile("image/gif", "bill.gif");
      assert.equal(
        await page.$eval(
          '[role="dialog"] button[type="submit"]',
          (el) => el.disabled,
        ),
        true,
      );
      await setFile("application/pdf", "bill.pdf");
      assert.ok(
        (await page.$eval("dialog", (el) => el.textContent)).includes(
          "Tài liệu PDF",
        ),
      );
      await page.click('button[aria-label="Xóa file bill"]');
      assert.equal(
        await page.$eval('dialog button[type="submit"]', (el) => el.disabled),
        true,
      );
      await setFile("image/png", "bill.png");
      await page.waitForSelector('img[alt="Preview bill ngân hàng"]');
      await page.type(
        'textarea[aria-label="Ghi chú duyệt payout"]',
        "Confirmed bank transfer",
      );
      await page.$eval('[role="dialog"] form', (form) => {
        form.requestSubmit();
        form.requestSubmit();
      });
      try {
        await page.waitForFunction(
          () => !document.querySelector('[role="dialog"]'),
          { timeout: 10000 },
        );
      } catch (error) {
        throw (
          failure ??
          new Error(
            await page.$eval('[role="dialog"]', (el) => el.textContent),
            { cause: error },
          )
        );
      }
      if (failure) throw failure;
      assert.equal(approvalCount, 1);
      assert.deepEqual(await page.evaluate(() => window.testUpload), {
        ref: "REF-001",
        note: "Confirmed bank transfer",
        filename: "bill.png",
        type: "image/png",
        size: 4,
      });
      assert.ok(
        (await page.$eval("tbody", (el) => el.textContent)).includes(
          "Đã xác nhận chi trả",
        ),
      );
      await clickRow(requests[0].id, "Xem bill");
      await page.waitForSelector(
        'a[href="https://example.test/private-bill?expires=120"]',
      );
      await page.click(`input[aria-label="Chọn payout ${requests[1].id}"]`);
      await clickText("Xuất Excel VietQR / Napas247 (1)");
      await page.waitForFunction(() =>
        document.body.textContent.includes("1 payout"),
      );
      assert.equal(exportCount, 1);
      assert.ok(
        (await page.$eval("tbody", (el) => el.textContent)).includes(
          "Đang thanh toán theo lô",
        ),
      );
      assert.equal(
        await page.$eval(
          `input[aria-label="Chọn payout ${requests[1].id}"]`,
          (el) => el.disabled,
        ),
        true,
      );
      await clickText("Tải lại Excel");
      await page.waitForFunction(() => window.testDownloads.length === 2);
      assert.equal(exportCount, 1);
      assert.equal(downloadCount, 1);
      await page.waitForFunction(
        () =>
          ![...document.querySelectorAll("button")].find(
            (el) => el.textContent.trim() === "Tải lại Excel",
          )?.disabled,
      );
      await clickRow(requests[2].id, "Từ chối");
      await page.type(
        'textarea[aria-label="Lý do từ chối"]',
        "Bank details need review",
      );
      await clickText("Từ chối & hoàn tiền");
      await page.waitForFunction(
        () => !document.querySelector('[role="dialog"]'),
      );
      if (failure) throw failure;
      assert.ok(
        (await page.$eval("tbody", (el) => el.textContent)).includes(
          "Đã từ chối",
        ),
      );
      await page.select(
        'select[aria-label="Lọc trạng thái payout"]',
        "PROCESSING",
      );
      await page.waitForFunction(
        () => document.querySelectorAll("tbody tr").length === 1,
      );
      assert.ok(
        (await page.$eval("tbody", (el) => el.textContent)).includes(
          requests[1].id,
        ),
      );
      // The prototype route now embeds the same live page, not demo payout IDs.
      await page.goto(`${url.origin}/app/payouts`, {
        waitUntil: "networkidle0",
      });
      await page.waitForFunction(() =>
        [...document.querySelectorAll("iframe")].some((el) =>
          el.contentDocument?.querySelector("#payout-approval-iframe"),
        ),
      );
      const frame = page
        .frames()
        .find((item) => item.url().includes("/merchant/payouts"));
      assert.ok(
        frame,
        "Prototype payout route must load the real merchant page",
      );
      await frame.waitForSelector('table[aria-label="Danh sách payout"]');
    } finally {
      await browser.close();
    }
  },
);
