import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
  new URL("../src/components/payouts/payoutBillValidation.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { validatePayoutBill, maskBankAccount } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const file = (name, type, size = 100) => ({ name, type, size });

test("payout bills allow JPG, PNG and PDF, rejecting empty, spoofed, multiple extensions and oversized files", () => {
  for (const [name, type] of [
    ["bill.JPG", "image/jpeg"],
    ["bill.jpeg", "image/jpeg"],
    ["bill.png", "image/png"],
    ["bill.pdf", "application/pdf"],
  ])
    assert.equal(validatePayoutBill(file(name, type)), "");
  for (const value of [
    file("bill.pdf", "image/png"),
    file("bill.png.exe", "image/png"),
    file("bill.webp", "image/webp"),
    file("bill.pdf", "application/pdf", 0),
    file("bill.png", "image/png", 5242881),
  ])
    assert.notEqual(validatePayoutBill(value), "");
  assert.equal(
    validatePayoutBill(file("bill.pdf", "application/pdf", 5242880)),
    "",
  );
  assert.notEqual(
    validatePayoutBill(file("bill.pdf", "application/pdf", 1025), 1024),
    "",
  );
  assert.notEqual(
    validatePayoutBill(file("bill.pdf", "application/pdf", 5242881), 20000000),
    "",
  );
});

test("payout UI masks bank accounts and handles missing information", () => {
  assert.equal(maskBankAccount("0012348842"), "**** 8842");
  assert.equal(maskBankAccount(null), "Chưa cập nhật");
});
