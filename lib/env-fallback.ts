// Always import this file before next-auth imports to ensure fallback environment variables are loaded
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = "mysecret123456789";
}
if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}
