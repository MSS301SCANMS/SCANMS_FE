import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(
  new URL("../src/components/reviews/reviewValidation.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { validateReviewComment, validateReviewFile } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

test("review comment uses trimmed 10–1000 characters and rejects simple spam", () => {
  assert.ok(validateReviewComment("123456789"));
  assert.equal(validateReviewComment("1234567890"), null);
  assert.equal(
    validateReviewComment("Sản phẩm dùng tốt. ".repeat(60).slice(0, 1000)),
    null,
  );
  assert.ok(validateReviewComment("x".repeat(1001)));
  assert.ok(validateReviewComment("   123456789   "));
  assert.ok(validateReviewComment("xxxxxxxxxxxxxxxxxxxxxxxxxxx"));
  assert.ok(validateReviewComment("fuck sản phẩm này"));
});
test("review images require matching type/extension and at most 5MB per file", () => {
  assert.equal(
    validateReviewFile(
      { name: "a.JPG", type: "image/jpeg", size: 5 * 1024 * 1024 },
      "image",
    ),
    null,
  );
  assert.ok(
    validateReviewFile(
      { name: "a.jpg", type: "image/png", size: 100 },
      "image",
    ),
  );
  assert.ok(
    validateReviewFile(
      { name: "a.svg", type: "image/svg+xml", size: 100 },
      "image",
    ),
  );
  assert.ok(
    validateReviewFile(
      { name: "a.png", type: "image/png", size: 5 * 1024 * 1024 + 1 },
      "image",
    ),
  );
  assert.ok(
    validateReviewFile({ name: "a.png", type: "image/png", size: 0 }, "image"),
  );
});
test("review video permits MP4/MOV and at most 50MB", () => {
  assert.equal(
    validateReviewFile(
      { name: "a.mov", type: "video/quicktime", size: 50 * 1024 * 1024 },
      "video",
    ),
    null,
  );
  assert.ok(
    validateReviewFile(
      { name: "a.mp4", type: "video/mp4", size: 50 * 1024 * 1024 + 1 },
      "video",
    ),
  );
  assert.ok(
    validateReviewFile(
      { name: "a.webm", type: "video/webm", size: 100 },
      "video",
    ),
  );
});
