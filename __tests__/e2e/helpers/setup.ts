import { MongoMemoryServer } from "mongodb-memory-server";
import { connect } from "mongoose";
import { afterAll, beforeAll } from "vitest";

const mongod = await MongoMemoryServer.create();

const uri = mongod.getUri();

beforeAll(() => {
  console.log("Up the database... 🚀");
  connect(uri);
  console.log("Database is up! ✨");
});

afterAll(() => {
  mongod.stop();
  console.log("Database stopped! ✨");
});
