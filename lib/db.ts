import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL || "";

export const sql = dbUrl
  ? neon(dbUrl)
  : ((...args: any[]) => {
      console.warn("Neon SQL client invoked without DATABASE_URL environment variable.");
      throw new Error("DATABASE_URL is not set.");
    }) as any;