import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const { POST: authPost, GET: authGet } = toNextJsHandler(auth);

export const POST = async (req: Request) => {
  console.log("[auth-api] POST request:", req.url)
  const clone = req.clone()
  const body = await clone.text()
  console.log("[auth-api] POST body:", body)
  return authPost(req)
}

export const GET = async (req: Request) => {
  console.log("[auth-api] GET request:", req.url)
  return authGet(req)
}