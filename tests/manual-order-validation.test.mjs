import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
  new URL("../src/components/orders/manualOrderValidation.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { moneyInCents, validateManualItems, validateExcelFile } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const product = {
  id: "p1",
  sku: "SKU-1",
  title: "QA product",
  isActive: true,
  stockQuantity: 3,
};
const item = { id: "row1", productId: "p1", quantity: "1", unitPrice: "0.10" };

test("manual order money uses integer cents and rejects invalid/unsafe values", () => {
  assert.equal(moneyInCents("0.10") + moneyInCents("0.20"), 30);
  assert.equal(moneyInCents("150000.25"), 15000025);
  for (const value of [
    "",
    "NaN",
    "1e3",
    "-1",
    "0.001",
    "1,000",
    "99999999999999999",
  ])
    assert.equal(moneyInCents(value), null);
});
test("manual items enforce positive prices, integer quantity, aggregate stock and product validity", () => {
  assert.equal(validateManualItems([item], [product]), null);
  assert.match(
    validateManualItems([{ ...item, quantity: "0" }], [product]),
    /số nguyên/,
  );
  assert.match(
    validateManualItems([{ ...item, quantity: "1.5" }], [product]),
    /số nguyên/,
  );
  assert.match(
    validateManualItems([{ ...item, unitPrice: "0" }], [product]),
    /đơn giá/,
  );
  assert.match(
    validateManualItems(
      [
        { ...item, quantity: "2" },
        { ...item, id: "row2", quantity: "2" },
      ],
      [product],
    ),
    /vượt tồn kho/,
  );
  assert.ok(validateManualItems([], [product]));
  assert.ok(validateManualItems([item], [{ ...product, isActive: false }]));
});
test("Excel chooser rejects wrong extension, empty and oversized files", () => {
  assert.equal(validateExcelFile({ name: "orders.XLSX", size: 100 }), null);
  for (const file of [
    { name: "orders.csv", size: 100 },
    { name: "orders.xlsx", size: 0 },
    { name: "orders.xlsx", size: 5 * 1024 * 1024 + 1 },
  ])
    assert.ok(validateExcelFile(file));
});
