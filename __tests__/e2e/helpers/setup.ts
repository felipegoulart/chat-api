import { MongoMemoryServer } from "mongodb-memory-server";
import { connect } from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";
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
});

afterAll(() => {
  mongod.stop();
  console.log("Database stopped! ✨");
});
