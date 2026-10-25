import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  HMAC_SECRET: z.string().min(32, 'HMAC_SECRET must be at least 32 characters'),
  PRINTER_AGENT_RAW_KEY: z.string().min(16, 'PRINTER_AGENT_RAW_KEY must be at least 16 characters'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  PORT: z.string().default('3000'),
  META_WA_PHONE_NUMBER_ID: z.string().optional().default(''),
  META_WA_ACCESS_TOKEN: z.string().optional().default(''),
  META_WA_WEBHOOK_VERIFY_TOKEN: z.string().optional().default(''),
  META_WA_APP_SECRET: z.string().optional().default(''),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  HMAC_SECRET: process.env.HMAC_SECRET,
  PRINTER_AGENT_RAW_KEY: process.env.PRINTER_AGENT_RAW_KEY,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  PORT: process.env.PORT,
  META_WA_PHONE_NUMBER_ID: process.env.META_WA_PHONE_NUMBER_ID,
  META_WA_ACCESS_TOKEN: process.env.META_WA_ACCESS_TOKEN,
  META_WA_WEBHOOK_VERIFY_TOKEN: process.env.META_WA_WEBHOOK_VERIFY_TOKEN,
  META_WA_APP_SECRET: process.env.META_WA_APP_SECRET,
});
