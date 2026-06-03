import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await sql`SELECT 1 as message`;

  return NextResponse.json({
    success: true,
    data: result,
  });
}