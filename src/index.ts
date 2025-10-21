import { connect } from "mongoose";
import { createServer } from "./server.js";
import { env } from "./shared/env.js";

const app = createServer();

connect(env.DATABASE_URL)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.error("Error connecting to database", err);
    process.exit(1);
  });

app.listen({ port: env.PORT, host: env.HOST }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
