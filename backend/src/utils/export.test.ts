import test from "node:test";
import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import { buildXlsx } from "../services/export.service.js";

test("XLSX export produces a valid OOXML workbook with escaped values", () => {
  const output = buildXlsx([{ Employee: "Ahmed & Sara", Score: 91 }]);
  assert.equal(output.subarray(0, 2).toString(), "PK");
  const files = unzipSync(output);
  assert.ok(files["xl/workbook.xml"]);
  assert.ok(files["xl/worksheets/sheet1.xml"]);
  const worksheet = Buffer.from(files["xl/worksheets/sheet1.xml"]).toString();
  assert.match(worksheet, /Ahmed &amp; Sara/);
  assert.match(worksheet, /autoFilter/);
});
