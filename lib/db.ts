import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Ncp5eMxuaJ0h@ep-bitter-tree-apwft6n8.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";

export const sql = neon(dbUrl);