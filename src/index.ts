import { connect } from "mongoose";
import { HttpServer } from "./server.js";
import { env } from "./shared/env.js";

async function start() {
  const server = new HttpServer();
  const app = await server.createServer();
  try {
    await connect(env.DATABASE_URL, {
      appName: "Checkpoint Chat",
      dbName: "checkpoint-development",
    });
    console.log("Connected to database");

    app.listen({ port: env.PORT, host: env.HOST }, (err, address) => {
      if (err) {
        process.exit(1);
      }
      app.log.info(`Server listening at ${address}`);
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
