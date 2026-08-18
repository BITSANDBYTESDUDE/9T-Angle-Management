import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { runScheduledJobs } from "./services/scheduler.service.js";

async function start() {
  await connectDatabase();
  const server = app.listen(env.PORT, "0.0.0.0", () => console.info(`9T-Angle API listening on http://0.0.0.0:${env.PORT}`));
  runScheduledJobs().catch((error) => console.error("Initial scheduled job failed", error));
  const scheduler = setInterval(() => runScheduledJobs().catch((error) => console.error("Scheduled job failed", error)), 60 * 60 * 1000); scheduler.unref();
  const shutdown = async (signal: string) => { console.info(`${signal} received, shutting down`); clearInterval(scheduler); server.close(async () => { await disconnectDatabase(); process.exit(0); }); setTimeout(() => process.exit(1), 10000).unref(); };
  process.on("SIGTERM", () => shutdown("SIGTERM")); process.on("SIGINT", () => shutdown("SIGINT"));
}
start().catch((error) => { console.error("Unable to start server", error); process.exit(1); });
