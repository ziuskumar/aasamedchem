import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}
