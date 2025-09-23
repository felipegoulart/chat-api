import { createClient } from "redis";

export const redis = await createClient({ url: "redis://localhost:6379" }).connect();
