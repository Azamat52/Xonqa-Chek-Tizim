import test from "node:test";
import assert from "node:assert/strict";
import { normalizeQty, unitLabel } from "../admin/lib/units.js";

test("Dona miqdori butun songa yaxlitlanadi", () => assert.equal(normalizeQty("piece", 2.6), 3));
test("Kg miqdori kasr bo'lishi mumkin", () => assert.equal(normalizeQty("kg", 1.234), 1.23));
test("Miqdor noldan kichik bo'lmaydi", () => assert.equal(normalizeQty("kg", -5), 0.01));
test("Noma'lum birlik dona deb ko'rsatiladi", () => assert.equal(unitLabel("xyz"), "dona"));

test("Eski birlik nomlari DB kalitlariga normallashtiriladi", async () => {
  const { normalizeUnit } = await import("../admin/lib/units.js");
  assert.equal(normalizeUnit("dona"), "piece");
  assert.equal(normalizeUnit("gramm"), "g");
  assert.equal(normalizeUnit("litr"), "l");
  assert.equal(normalizeUnit("qadoq"), "pack");
  assert.equal(normalizeUnit("kg"), "kg");
});
