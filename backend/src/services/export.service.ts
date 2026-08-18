import { strToU8, zipSync } from "fflate";
import PDFDocument from "pdfkit";
import { Attendance, DailyReport, Employee, Target, Task } from "../models/index.js";
import { calculate } from "./performance.service.js";

export type ExportFormat = "csv" | "xlsx" | "pdf";
function text(value: unknown) { if (value == null) return ""; if (value instanceof Date) return value.toISOString(); if (typeof value === "object") return String((value as any).fullName || (value as any).name || (value as any).email || (value as any)._id || ""); return String(value); }
export async function reportRows(type: string) {
  if (type === "employees") return (await Employee.find().populate("user", "email authRole").populate("role department").lean()).map((e: any) => ({ Name: e.fullName, Email: e.user?.email, Access: e.user?.authRole, Position: e.position, Role: e.role?.name, Department: e.department?.name, Status: e.status, Joined: e.joiningDate }));
  if (type === "tasks") return (await Task.find().populate("assignedTo", "fullName").lean()).map((t: any) => ({ Task: t.title, Employee: t.assignedTo?.fullName, Type: t.taskType, Priority: t.priority, Target: t.targetQuantity, Completed: t.completedQuantity, Status: t.status, Due: t.dueDate }));
  if (type === "targets") return (await Target.find().populate("employee", "fullName").lean()).map((t: any) => ({ Employee: t.employee?.fullName, Period: t.targetType, Metric: t.metric, Target: t.targetQuantity, Completed: t.completedQuantity, Achievement: t.targetQuantity ? `${Math.round(t.completedQuantity / t.targetQuantity * 1000) / 10}%` : "0%", Start: t.startDate, End: t.endDate }));
  if (type === "attendance") return (await Attendance.find().populate("employee", "fullName").lean()).map((a: any) => ({ Employee: a.employee?.fullName, Date: a.date, CheckIn: a.checkIn, CheckOut: a.checkOut, Hours: a.totalWorkingHours, Status: a.status }));
  if (type === "daily") return (await DailyReport.find().populate("employee", "fullName").lean()).map((r: any) => ({ Employee: r.employee?.fullName, Date: r.date, Products: r.productsResearched, Listings: r.listingsCreated, Orders: r.ordersProcessed, TargetAchieved: r.targetAchieved, Hours: r.totalWorkingHours, Status: r.status, Feedback: r.feedback }));
  if (["performance", "weekly", "monthly"].includes(type)) {
    const period = type === "weekly" ? "weekly" : "monthly"; const employees = await Employee.find({ status: "active" }).lean();
    return Promise.all(employees.map(async (e: any) => { const p = await calculate(String(e._id), period); return { Employee: e.fullName, Period: period, TaskCompletion: p.metrics.taskCompletion, TargetAchievement: p.metrics.targetAchievement, OnTime: p.metrics.onTimeCompletion, Attendance: p.metrics.attendance, Reports: p.metrics.reportSubmission, Overall: p.overallScore, Rating: p.rating }; }));
  }
  return [];
}
function csv(rows: Record<string, unknown>[]) { if (!rows.length) return "No records found\n"; const headers = Object.keys(rows[0]); const escape = (v: unknown) => `"${text(v).replace(/"/g, '""')}"`; return [headers.map(escape).join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n"); }
function xml(value: unknown) { return text(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function columnName(index: number) { let result = ""; for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + ((n - 1) % 26)) + result; return result; }
export function buildXlsx(rows: Record<string, unknown>[]) {
  const safeRows = rows.length ? rows : [{ Message: "No records found" }]; const headers = Object.keys(safeRows[0]); const allRows = [Object.fromEntries(headers.map((h) => [h, h])), ...safeRows];
  const sheetRows = allRows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${headers.map((header, columnIndex) => `<c r="${columnName(columnIndex)}${rowIndex + 1}" t="inlineStr"${rowIndex === 0 ? ' s="1"' : ""}><is><t xml:space="preserve">${xml(row[header])}</t></is></c>`).join("")}</row>`).join("");
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    "xl/styles.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font/><font><b/><color rgb="FFFFFFFF"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF145C55"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf xfId="0"/><xf xfId="0" fontId="1" fillId="1" applyFont="1" applyFill="1"/></cellXfs></styleSheet>`),
    "xl/worksheets/sheet1.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${headers.map((_, i) => `<col min="${i + 1}" max="${i + 1}" width="20" customWidth="1"/>`).join("")}</cols><sheetData>${sheetRows}</sheetData><autoFilter ref="A1:${columnName(headers.length - 1)}${allRows.length}"/></worksheet>`)
  };
  return Buffer.from(zipSync(files, { level: 6 }));
}
export async function buildExport(type: string, format: ExportFormat) {
  const rows = await reportRows(type); const name = `9t-angle-${type}-${new Date().toISOString().slice(0, 10)}`;
  if (format === "csv") return { buffer: Buffer.from(csv(rows)), mime: "text/csv; charset=utf-8", filename: `${name}.csv` };
  if (format === "xlsx") {
    return { buffer: buildXlsx(rows), mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename: `${name}.xlsx` };
  }
  const buffer = await new Promise<Buffer>((resolve) => { const doc = new PDFDocument({ margin: 36, size: "A4", layout: "landscape" }); const chunks: Buffer[] = []; doc.on("data", (chunk) => chunks.push(chunk)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.fontSize(18).fillColor("#145c55").text(`9T-Angle ${type.replace(/-/g, " ")} report`); doc.moveDown().fontSize(8).fillColor("#1f2937"); if (!rows.length) doc.text("No records found."); else rows.forEach((row, index) => { doc.font("Helvetica-Bold").text(`${index + 1}. ${Object.values(row).slice(0, 2).map(text).join(" — ")}`); doc.font("Helvetica").text(Object.entries(row).slice(2).map(([k, v]) => `${k}: ${text(v)}`).join("   |   ")); doc.moveDown(.45); }); doc.end(); });
  return { buffer, mime: "application/pdf", filename: `${name}.pdf` };
}
