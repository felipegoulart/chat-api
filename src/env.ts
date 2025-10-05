import z from "zod/v4";

const envSchema = z.object({
  APP_EMAIL_ADDRESS: z.email().optional(), // TODO: It should be changed to Database source
  DATABASE_URL: z.url(),
  HOST: z.string().default("0.0.0.0"),
  JWT_SECRET: z.string(),
  MAILER_SEND_API_KEY: z.string(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  PORT: z.coerce.number().default(3001),
  REDIS_URL: z.url(),
});

export const env = envSchema.parse(process.env);
