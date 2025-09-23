import { MongoMemoryServer } from "mongodb-memory-server";
import { connect } from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";
import { redis } from "../../../src/infra/cache/redis.js";
import { Room } from "../../../src/modules/room/model";

const mongod = await MongoMemoryServer.create();

const uri = mongod.getUri();

beforeAll(() => {
  console.log("Up the database... 🚀");
  connect(uri);
  console.log("Database is up! ✨");
});

afterEach(async () => {
  await Room.deleteMany({});
  await redis.flushAll();
});

afterAll(() => {
  mongod.stop();
  console.log("Database stopped! ✨");
});
