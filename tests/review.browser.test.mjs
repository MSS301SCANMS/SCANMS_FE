import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const base = process.env.WITHDRAWAL_UI_TEST_URL;
const browserPath = process.env.WITHDRAWAL_UI_BROWSER_PATH;
test(
  "FR18 prototype opens accessible React modal, validates files, retries upload/review and calls real contract",
  { skip: !base || !browserPath },
  async () => {
    assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
    const folder = await mkdtemp(join(tmpdir(), "scanms-review-ui-"));
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDVEAAAAASUVORK5CYII=",
      "base64",
    );
    const paths = Array.from({ length: 6 }, (_, i) =>
      join(folder, `image-${i}.png`),
    );
    const invalid = join(folder, "invalid.svg");
    const videoPath = join(folder, "review.mp4");
    await Promise.all(paths.map((path) => writeFile(path, png)));
    await writeFile(invalid, "<svg/>");
    const video = Buffer.alloc(24);
    video.writeUInt32BE(24);
    video.write("ftyp", 4);
    video.write("isom", 8);
    await writeFile(videoPath, video);
    const browser = await puppeteer.launch({
      executablePath: browserPath,
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 1000 });
      const nativeDialogs = [];
      page.on("dialog", async (dialog) => {
        nativeDialogs.push(dialog.message());
        await dialog.dismiss();
      });
      let productTitle;
      const productId = "00000000-0000-4000-8000-000000000001";
      const orderId = "00000000-0000-4000-8000-000000000002";
      let uploads = 0;
      let submissions = 0;
      let body;
      await page.setRequestInterception(true);
      page.on("request", async (request) => {
        const url = new URL(request.url());
        if (url.pathname.startsWith("/api/")) {
          if (request.method() === "OPTIONS") {
            await request.respond({
              status: 204,
              headers: {
                "Access-Control-Allow-Origin": new URL(base).origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Headers": "content-type,authorization",
                "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
              },
            });
            return;
          }
          let status = 200;
          let data = {};
          if (url.pathname === "/api/orders/track")
            data = {
              orders: [
                {
                  id: orderId,
                  externalOrderSn: "QA-REVIEW-ORDER",
                  reviewToken: "signed-qa-token",
                  status: "DELIVERED",
                  items: [
                    {
                      productId,
                      productTitle,
                      imageUrl:
                        base + "/reference/assets/serum-hero-optimized.jpg",
                    },
                  ],
                },
              ],
            };
          if (url.pathname.endsWith("/review/media")) {
            uploads++;
            data = {
              secureUrl: `https://example.test/review-${uploads}.${uploads === 3 ? "mp4" : "png"}`,
            };
          }
          if (url.pathname.endsWith("/review")) {
            submissions++;
            body = JSON.parse(request.postData());
            if (submissions === 1) status = 500;
            else
              data = {
                review: {
                  id: "saved-review",
                  productId,
                  rating: body.rating,
                  comment: body.comment,
                  images: body.images,
                  video: body.video,
                  createdAt: new Date().toISOString(),
                },
              };
          }
          await request.respond({
            status,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": new URL(base).origin,
              "Access-Control-Allow-Credentials": "true",
              "Access-Control-Allow-Headers": "content-type,authorization",
              "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            },
            body: JSON.stringify(
              status >= 400
                ? { message: "Không gửi được đánh giá, vui lòng thử lại." }
                : { data },
            ),
          });
        } else if (
          url.origin === new URL(base).origin ||
          ["data:", "blob:"].includes(url.protocol)
        )
          await request.continue();
        else await request.abort();
      });
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem("scanms-current-role", "customer");
        localStorage.setItem("scanms-current-screen", "customer-reviews");
      });
      await page.goto(base + "/app/customer-reviews", {
        waitUntil: "networkidle0",
      });
      const frame = page
        .frames()
        .find((item) => item.url().includes("/reference/index.html"));
      assert.ok(frame);
      await frame.waitForSelector("[data-cust-open-review-form]");
      productTitle = await frame.$eval(
        "[data-cust-open-review-form]",
        (button) => button.parentElement.querySelector("strong").textContent,
      );
      await frame.click("[data-cust-open-review-form]");
      await page.waitForSelector("dialog[open]");
      assert.equal(nativeDialogs.length, 0);
      assert.ok(
        (await page.$eval("dialog h2", (el) => el.textContent)).includes(
          productTitle,
        ),
      );
      assert.equal(
        await page.$eval("dialog button[type=submit]", (el) => el.disabled),
        true,
      );
      await page.click('[role=radio][aria-label^="1 sao"]');
      await page.keyboard.press("ArrowRight");
      assert.equal(
        await page.$eval('[role=radio][aria-label^="2 sao"]', (el) =>
          el.getAttribute("aria-checked"),
        ),
        "true",
      );
      await page.click('[role=radio][aria-label^="4 sao"]');
      await page.$eval('dialog input[minlength="6"]', (el) => {
        el.value = "";
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await page.click('dialog input[minlength="6"]', { clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.type('dialog input[minlength="6"]', "QA-REVIEW-ORDER");
      await page.type(
        'input[aria-label="Số điện thoại xác minh đánh giá"]',
        "0902233445",
      );
      await page.type("textarea", "123456789");
      assert.equal(
        await page.$eval("dialog button[type=submit]", (el) => el.disabled),
        true,
      );
      await page.click("textarea", { clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.type(
        "textarea",
        "Sản phẩm dùng tốt, đóng gói đẹp. ".repeat(35),
      );
      assert.equal(await page.$eval("textarea", (el) => el.value.length), 1000);
      assert.ok(
        (await page.$eval("dialog", (el) => el.textContent)).includes(
          "1000/1000",
        ),
      );
      const images = await page.$("[data-testid=review-images]");
      await images.uploadFile(invalid);
      await page.waitForFunction(() =>
        document
          .querySelector("dialog")
          .textContent.includes("Chỉ chấp nhận ảnh"),
      );
      await images.uploadFile(...paths);
      await page.waitForFunction(() =>
        document.querySelector("dialog").textContent.includes("tối đa 5 ảnh"),
      );
      await images.uploadFile(paths[0], paths[1]);
      await page.waitForSelector('button[aria-label="Xóa ảnh image-0.png"]');
      await page.click('button[aria-label="Xóa ảnh image-0.png"]');
      assert.equal(
        await page.$('button[aria-label="Xóa ảnh image-0.png"]'),
        null,
      );
      await images.uploadFile(paths[0]);
      await (await page.$("[data-testid=review-video]")).uploadFile(videoPath);
      await page.waitForSelector("dialog video");
      await page.$eval("dialog form", (form) => {
        form.requestSubmit();
        form.requestSubmit();
      });
      await page.waitForFunction(() =>
        [...document.querySelectorAll("[role=alert]")].some((el) =>
          el.textContent.includes("Không gửi được"),
        ),
      );
      assert.equal(submissions, 1);
      assert.equal(uploads, 3);
      assert.equal(await page.$eval("textarea", (el) => el.value.length), 1000);
      await page.click("dialog button[type=submit]");
      await page.waitForFunction(() => !document.querySelector("dialog[open]"));
      assert.equal(submissions, 2);
      assert.equal(
        uploads,
        3,
        "Retry reuses uploaded media, not duplicate uploads",
      );
      assert.equal(body.productId, productId);
      assert.equal(body.reviewToken, "signed-qa-token");
      assert.equal(body.rating, 4);
      assert.equal(body.images.length, 2);
      assert.ok(body.video.startsWith("https://"));
      assert.equal(nativeDialogs.length, 0);
    } finally {
      await browser.close();
      await rm(folder, { recursive: true, force: true });
    }
  },
);
