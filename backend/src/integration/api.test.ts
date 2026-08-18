import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request, { type Agent } from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app.js";
import { Department, Employee, Role, Settings, User } from "../models/index.js";

let mongo: MongoMemoryServer;
let adminAgent: Agent;
let employeeAgent: Agent;
let otherAgent: Agent;
let employeeId = "";
let taskId = "";
let reportId = "";

async function createEmployee(email: string, name: string, roleId: string, departmentId: string) {
  const user = await User.create({ email, password: "Testing@123", authRole: "employee" });
  const employee = await Employee.create({ user: user._id, fullName: name, role: roleId, department: departmentId, position: "Product Researcher", joiningDate: new Date(), workingHours: { start: "09:00", end: "17:00", hoursPerDay: 8 } });
  user.employee = employee._id; await user.save({ validateBeforeSave: false }); return employee;
}
async function login(agent: Agent, email: string) { const response = await agent.post("/api/auth/login").send({ email, password: "Testing@123" }); assert.equal(response.status, 200); }

before(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const role = await Role.create({ name: "Product Researcher" }); const department = await Department.create({ name: "Research" }); await Settings.create({ key: "organization" });
  await User.create({ email: "admin@test.local", password: "Testing@123", authRole: "admin" });
  const employee = await createEmployee("employee@test.local", "Assigned Employee", String(role._id), String(department._id)); employeeId = String(employee._id);
  await createEmployee("other@test.local", "Other Employee", String(role._id), String(department._id));
  adminAgent = request.agent(app); employeeAgent = request.agent(app); otherAgent = request.agent(app);
  await login(adminAgent, "admin@test.local"); await login(employeeAgent, "employee@test.local"); await login(otherAgent, "other@test.local");
});
after(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });

test("authentication rejects invalid credentials and protects private API routes", async () => {
  const invalid = await request(app).post("/api/auth/login").send({ email: "admin@test.local", password: "WrongPass123" }); assert.equal(invalid.status, 401);
  const unauthenticated = await request(app).get("/api/tasks"); assert.equal(unauthenticated.status, 401);
});

test("admin assigns a task and employee ownership is enforced", async () => {
  const response = await adminAgent.post("/api/tasks").send({ title: "Research ten products", description: "Validate demand and margin.", taskType: "Product Research", assignedTo: employeeId, priority: "high", startDate: new Date().toISOString(), dueDate: new Date(Date.now() + 86400000).toISOString(), targetQuantity: 10, estimatedHours: 4, instructions: "Use the current SOP." });
  assert.equal(response.status, 201); taskId = response.body.data._id;
  const forbidden = await otherAgent.get(`/api/tasks/${taskId}`); assert.equal(forbidden.status, 403);
  const overTarget = await employeeAgent.patch(`/api/tasks/${taskId}/progress`).send({ quantity: 11, note: "Invalid" }); assert.equal(overTarget.status, 422);
  const valid = await employeeAgent.patch(`/api/tasks/${taskId}/progress`).send({ quantity: 10, note: "All products validated" }); assert.equal(valid.status, 200); assert.equal(valid.body.data.status, "completed"); assert.equal(valid.body.data.progress, 100);
});

test("daily report review locks approved employee reports", async () => {
  const create = await employeeAgent.post("/api/reports/daily").send({ date: new Date().toISOString(), tasksCompleted: [taskId], targetAchieved: 10, productsResearched: 10, listingsCreated: 0, ordersProcessed: 0, otherCompletedWork: "Supplier validation", problemsFaced: "None", notes: "Complete", tomorrowPlan: "Start next category", totalWorkingHours: 8, status: "submitted" });
  assert.equal(create.status, 201); reportId = create.body.data._id;
  const otherList = await otherAgent.get("/api/reports/daily"); assert.equal(otherList.status, 200); assert.equal(otherList.body.data.length, 0);
  const review = await adminAgent.patch(`/api/reports/daily/${reportId}/review`).send({ action: "approve", feedback: "Accurate and complete." }); assert.equal(review.status, 200); assert.equal(review.body.data.status, "reviewed");
  const locked = await employeeAgent.put(`/api/reports/daily/${reportId}`).send({ notes: "Changed after approval" }); assert.equal(locked.status, 409);
});

test("attendance prevents duplicate daily check-ins and records checkout", async () => {
  const checkIn = await employeeAgent.post("/api/attendance/check-in"); assert.equal(checkIn.status, 201);
  const duplicate = await employeeAgent.post("/api/attendance/check-in"); assert.equal(duplicate.status, 409);
  const checkOut = await employeeAgent.post("/api/attendance/check-out"); assert.equal(checkOut.status, 200); assert.ok(checkOut.body.data.checkOut);
});
