import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getAuthSession(): Promise<any> {
  return await getServerSession(authOptions);
}