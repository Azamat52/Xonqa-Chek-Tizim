import test from "node:test";
import assert from "node:assert/strict";
import { availableStock, canSellQuantity, isSaleProduct } from "../admin/lib/stock.js";

test("Three available pieces permit three and reject four", () => {
  const product = { stock: 3, unit: "piece" };
  assert.equal(canSellQuantity(product, 3), true);
  assert.equal(canSellQuantity(product, 4), false);
  assert.equal(canSellQuantity(product, "4"), false);
  assert.equal(canSellQuantity(product, 3.1), false);
});
test("Repeated additions must not exceed available quantity", () => {
  const product = { stock: 3, unit: "piece" };
  let quantity = 0;
  for (let i = 0; i < 4; i++) if (canSellQuantity(product, quantity + 1)) quantity++;
  assert.equal(quantity, 3);
});
test("Fractional units respect the exact stock boundary", () => {
  const product = { stock: 0.35, unit: "kg" };
  assert.equal(canSellQuantity(product, 0.35), true);
  assert.equal(canSellQuantity(product, 0.36), false);
});
test("Missing, empty or unavailable stock cannot be sold", () => {
  assert.equal(availableStock(undefined), 0);
  for (const product of [
    undefined,
    { stock: 0 },
    { stock: -3 },
    { stock: NaN },
    { stock: 3, available: false },
  ]) {
    assert.equal(canSellQuantity(product, 1), false);
  }
});

test("New sale hides products with no stock", () => {
  assert.equal(isSaleProduct({ stock: 0, available: true }), false);
  assert.equal(isSaleProduct({ stock: -1, available: true }), false);
  assert.equal(isSaleProduct({ available: true }), false);
  assert.equal(isSaleProduct({ stock: 0.35, unit: "kg", available: true }), true);
});
test("New sale hides products removed from sale even with stock", () => {
  assert.equal(isSaleProduct({ stock: 3, available: false }), false);
  assert.equal(isSaleProduct({ stock: 3, available: true }), true);
});
