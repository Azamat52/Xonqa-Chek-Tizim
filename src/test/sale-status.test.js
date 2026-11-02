import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSaleStatus, saleNotice, salesLink } from "../admin/lib/sale-status.js";
test("Cancelled sale keeps cancelled status", () =>
  assert.equal(normalizeSaleStatus({ id: "a", status: "cancelled" }), "cancelled"));
test('Old "delivered" status falls back to the status saved on this device', () =>
  assert.equal(
    normalizeSaleStatus({ id: "a", status: "delivered" }, { a: "cancelled" }),
    "cancelled",
  ));
test("Unknown status without local record becomes printed", () =>
  assert.equal(normalizeSaleStatus({ id: "b", status: "delivered" }), "printed"));
test("Printed sale plays sound", () => assert.equal(saleNotice("printed").sound, true));
test("Saved sale plays sound", () => assert.equal(saleNotice("saved").sound, true));
test("Cancelled sale shows message without sound", () =>
  assert.equal(saleNotice("cancelled").sound, false));
test('Cancelled sale is not titled "Yangi savdo"', () =>
  assert.equal(/yangi savdo/i.test(saleNotice("cancelled").title), false));
test('"Ko‘rish" opens the sales page filtered by the sale status', () =>
  assert.equal(salesLink("cancelled"), "/sales?status=cancelled"));
