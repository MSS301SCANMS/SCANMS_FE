import test from "node:test";
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const testUrl = process.env.WITHDRAWAL_UI_TEST_URL;
const browserPath = process.env.WITHDRAWAL_UI_BROWSER_PATH;

test(
  "wallet UI validates money, prevents duplicate clicks and shows withdrawal history",
  {
    skip: !testUrl || !browserPath,
  },
  async () => {
    const url = new URL(testUrl);
    assert.ok(
      ["127.0.0.1", "localhost"].includes(url.hostname),
      "Only test a local frontend",
    );
    const browser = await puppeteer.launch({
      executablePath: browserPath,
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1365, height: 1000 });
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem("token", "isolated-browser-test-token");
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: "test-kol",
            role: "COLLABORATOR",
            fullName: "Test KOL",
          }),
        );
        localStorage.setItem("scanms-current-role", "kol");
      });
      const summary = {
        stores: [
          {
            storeId: "38b2b124-12d2-47f8-881f-c3107ee71084",
            storeName: "Test Shop",
            availableBalance: "500000.31",
            pendingBalance: "900000.00",
            isActive: true,
          },
        ],
        unallocatedAvailableBalance: "0.00",
        unallocatedPendingBalance: "0.00",
        availableBalance: "500000.31",
        pendingBalance: "900000.00",
        minimumWithdrawalAmount: "200000.00",
        withdrawalTaxPolicy: { threshold: "2000000.00", rate: "0.10" },
        kycStatus: "VERIFIED",
        canWithdraw: true,
        bankAccount: {
          bankName: "Test Bank",
          maskedAccountNumber: "••••6789",
          accountName: "TEST KOL",
        },
      };
      let withdrawals = [];
      let postCount = 0;
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        void (async () => {
          const requestUrl = new URL(request.url());
          if (requestUrl.pathname.startsWith("/api/")) {
            const headers = {
              "Access-Control-Allow-Origin": url.origin,
              "Access-Control-Allow-Credentials": "true",
              "Access-Control-Allow-Headers": "Authorization, Content-Type",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            };
            if (request.method() === "OPTIONS") {
              await request.respond({ status: 204, headers });
              return;
            }
            let data = {};
            if (requestUrl.pathname === "/api/auth/me") {
              data = {
                id: "test-kol",
                role: "COLLABORATOR",
                fullName: "Test KOL",
              };
            } else if (requestUrl.pathname === "/api/wallets/me") {
              data = summary;
            } else if (
              requestUrl.pathname === "/api/wallets/withdrawals" &&
              request.method() === "POST"
            ) {
              const body = JSON.parse(request.postData());
              assert.equal(body.amount, "200000.10");
              assert.deepEqual(Object.keys(body), ["amount", "storeId"]);
              assert.equal(body.storeId, summary.stores[0].storeId);
              postCount++;
              summary.availableBalance = "300000.21";
              summary.stores[0].availableBalance = "300000.21";
              const withdrawal = {
                id: "ui-test-request",
                storeId: body.storeId,
                store: { name: "Test Shop" },
                batchId: null,
                amount: body.amount,
                taxAmount: "0.00",
                netAmount: body.amount,
                taxCalculated: true,
                status: "PENDING",
                createdAt: new Date().toISOString(),
                processedAt: null,
              };
              withdrawals = [withdrawal];
              data = {
                message: "Tạo yêu cầu rút tiền thành công, đang chờ xử lý",
                request: withdrawal,
                availableBalance: summary.availableBalance,
              };
            } else if (requestUrl.pathname === "/api/wallets/me/ledger") {
              data = {
                entries: withdrawals.map((withdrawal) => ({
                  id: "ledger-" + withdrawal.id,
                  transactionType: "PAYOUT_WITHDRAW",
                  balanceBucket: "AVAILABLE",
                  amount: "-200000.10",
                  balanceBefore: "500000.31",
                  balanceAfter: "300000.21",
                  referenceId: withdrawal.id,
                  referenceType: "PAYOUT_REQUEST",
                  createdAt: withdrawal.createdAt,
                })),
                total: withdrawals.length,
                page: 1,
                limit: 10,
              };
            } else if (requestUrl.pathname === "/api/wallets/withdrawals") {
              data = {
                requests: withdrawals,
                total: withdrawals.length,
                page: 1,
                limit: 10,
              };
            }
            await request.respond({
              status: 200,
              contentType: "application/json",
              headers,
              body: JSON.stringify({ success: true, data }),
            });
            return;
          }
          // Do not contact external services or the actual project backend.
          if (requestUrl.origin === url.origin) await request.continue();
          else await request.abort();
        })();
      });

      await page.goto(`${url.origin}/collaborator/wallet`, {
        waitUntil: "networkidle0",
      });
      await page.waitForFunction(() => {
        const input = document.querySelector("#withdrawal-amount");
        return input && !input.disabled;
      });
      await page.type("#withdrawal-amount", "100000");
      await page.click('form button[type="submit"]');
      await page.waitForFunction(() =>
        document
          .querySelector('[role="alert"]')
          ?.textContent.includes("tối thiểu"),
      );
      assert.equal(postCount, 0);

      await page.focus("#withdrawal-amount");
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyA");
      await page.keyboard.up("Control");
      await page.type("#withdrawal-amount", "2000000");
      assert.ok(
        (
          await page.$eval(
            '[data-testid="withdrawal-tax-preview"]',
            (element) => element.textContent,
          )
        ).includes("200.000"),
      );
      assert.ok(
        (
          await page.$eval(
            '[data-testid="withdrawal-net-preview"]',
            (element) => element.textContent,
          )
        ).includes("1.800.000"),
      );

      await page.focus("#withdrawal-amount");
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyA");
      await page.keyboard.up("Control");
      await page.type("#withdrawal-amount", "200000.10");
      assert.equal(
        await page.$eval("#withdrawal-amount", (input) => input.value),
        "200000.10",
      );
      await page.$eval("form", (form) => {
        form.requestSubmit();
        form.requestSubmit();
      });
      try {
        await page.waitForFunction(
          () =>
            document
              .querySelector("tbody")
              ?.textContent.includes("ui-test-request"),
          { timeout: 5000 },
        );
      } catch (error) {
        const alert = await page
          .$eval('[role="alert"]', (element) => element.textContent)
          .catch(() => "No alert");
        throw new Error(
          `Withdrawal UI did not update: postCount=${postCount}, alert=${alert}`,
          { cause: error },
        );
      }
      assert.equal(postCount, 1);
      const ledgerText = await page.$eval(
        'table[aria-label="Sổ cái tài chính"] tbody',
        (element) => element.textContent,
      );
      assert.ok(ledgerText.includes("-200.000,1"));
      assert.ok(ledgerText.includes("300.000,21"));
      assert.ok(ledgerText.includes("PAYOUT_REQUEST"));
      assert.ok(
        (
          await page.$eval('[role="status"]', (element) => element.textContent)
        ).includes("thành công"),
      );
      assert.ok(
        (await page.$eval("tbody", (element) => element.textContent)).includes(
          "Chờ xử lý",
        ),
      );
      // Layout changes may place the pointer over the button. Check its resting
      // brand color only after leaving hover and completing the transition.
      await page.mouse.move(0, 0);
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector('form button[type="submit"]'))
            .backgroundColor === "rgb(197, 155, 88)",
      );
      assert.equal(
        await page.$eval(
          'form button[type="submit"]',
          (element) => getComputedStyle(element).backgroundColor,
        ),
        "rgb(197, 155, 88)",
      );

      summary.kycStatus = "UNVERIFIED";
      summary.canWithdraw = false;
      await page.click('button[aria-label="Tải lại ví"]');
      await page.waitForFunction(
        () => document.querySelector("#withdrawal-amount")?.disabled,
      );
      assert.ok(await page.$('a[href="/collaborator/kyc"]'));
    } finally {
      await browser.close();
    }
  },
);
