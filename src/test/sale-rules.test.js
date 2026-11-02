import test from "node:test";
import assert from "node:assert/strict";
import { saleDate, saleDuration } from "../admin/lib/sale-details.js";
test("Sale time uses year.month.day hour:minute in Tashkent", () =>
  assert.equal(saleDate("2026-10-31T07:57:00Z"), "2026.10.31 12:57"));
test("Elapsed processing time preserves minutes and seconds", () =>
  assert.equal(saleDuration(125), "2 daqiqa 5 soniya"));
test("Historical sale without duration stays unknown", () => assert.equal(saleDuration(null), "—"));
