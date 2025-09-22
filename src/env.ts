import z from "zod/v4";

const envSchema = z.object({
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.url(),
});

export const env = envSchema.parse(process.env);
