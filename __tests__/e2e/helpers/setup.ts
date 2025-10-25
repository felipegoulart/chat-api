import { MongoMemoryServer } from "mongodb-memory-server";
import { connect, type Mongoose } from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";
import { redis } from "../../../src/shared/cache/redis.js";

let mongoServer: MongoMemoryServer;
let connection: Mongoose;

beforeAll(async () => {
  console.log("Up the database... 🚀");
  mongoServer = await MongoMemoryServer.create();
  connection = await connect(mongoServer.getUri());
  console.log("Database is up! ✨");
});

afterEach(async () => {
  await redis.flushAll();
});

afterAll(async () => {
  await connection.disconnect();
  await mongoServer.stop();
});
