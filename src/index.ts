import { connect } from "mongoose";
import { HttpServer } from "./server.js";
import { env } from "./shared/env.js";

const httpServer = new HttpServer();

async function startApp() {
  const app = await httpServer.createServer();

  try {
    await connect(env.DATABASE_URL);
    app.log.info("Database connected");

    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`App running at the address: ${env.HOST}:${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

startApp();
