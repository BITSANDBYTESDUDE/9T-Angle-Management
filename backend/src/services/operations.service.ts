import type { Model } from "mongoose";
import { Listing, Order, Product, Task } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { escapeRegex } from "../utils/query.js";

const models: Record<string, Model<any>> = { products: Product, listings: Listing, orders: Order };
const populate: Record<string, any[]> = {
  products: [{ path: "researcher", select: "fullName profileImage position" }, { path: "linkedTask", select: "title status" }],
  listings: [{ path: "product", select: "productName sellingPrice" }, { path: "employee", select: "fullName profileImage position" }, { path: "linkedTask", select: "title status" }],
  orders: [{ path: "product", select: "productName" }, { path: "assignedEmployee", select: "fullName profileImage position" }, { path: "linkedTask", select: "title status" }]
};
function modelFor(type: string) { const model = models[type]; if (!model) throw new ApiError(404, "Operation type not found."); return model; }
export async function list(type: string, options: { page: number; limit: number; status?: string; search?: string; employeeId?: string }) {
  const model = modelFor(type); const filter: Record<string, any> = {};
  if (options.status) filter.status = options.status;
  if (options.employeeId) filter[type === "products" ? "researcher" : type === "listings" ? "employee" : "assignedEmployee"] = options.employeeId;
  if (options.search) {
    const regex = new RegExp(escapeRegex(options.search), "i");
    filter.$or = type === "products" ? [{ productName: regex }] : type === "listings" ? [{ listingTitle: regex }, { sku: regex }, { ebayAccount: regex }] : [{ orderId: regex }, { customer: regex }, { ebayAccount: regex }];
  }
  const query = model.find(filter);
  for (const item of populate[type]) query.populate(item);
  const [items, total] = await Promise.all([query.sort({ createdAt: -1 }).skip((options.page - 1) * options.limit).limit(options.limit), model.countDocuments(filter)]);
  return { items, total, pages: Math.ceil(total / options.limit) || 1 };
}
export async function create(type: string, input: any) {
  const model = modelFor(type); const record = await model.create(input);
  if (input.linkedTask) await Task.findByIdAndUpdate(input.linkedTask, { source: type === "products" ? "product" : type === "listings" ? "listing" : "order", sourceId: record._id });
  const query = model.findById(record._id); for (const item of populate[type]) query.populate(item);
  return query;
}
export async function update(type: string, id: string, input: any) {
  const model = modelFor(type);
  if (type === "products" && input.costPrice !== undefined && input.sellingPrice !== undefined) input.estimatedProfit = Math.round((Number(input.sellingPrice) - Number(input.costPrice)) * 100) / 100;
  const query = model.findByIdAndUpdate(id, input, { new: true, runValidators: true }); for (const item of populate[type]) query.populate(item);
  const record = await query; if (!record) throw new ApiError(404, "Operation record not found.");
  if (input.linkedTask) await Task.findByIdAndUpdate(input.linkedTask, { source: type === "products" ? "product" : type === "listings" ? "listing" : "order", sourceId: record._id });
  return record;
}
export async function remove(type: string, id: string) { const result = await modelFor(type).findByIdAndDelete(id); if (!result) throw new ApiError(404, "Operation record not found."); }
