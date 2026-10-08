import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";

async function getRoleFromRegisterCookie(): Promise<"client" | "vendor"> {
  // Lecture côté serveur via l'en-tête cookie
  const headersList = await headers()
  const cookieHeader = headersList.get("cookie") ?? ""
  const match = cookieHeader.match(/gazpoint_register_role=([^;]+)/)
  const roleFromCookie = match?.[1]
  if (roleFromCookie === "vendor") return "vendor"
  return "client"
}

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    user: {
        additionalFields: {
            phoneNumber: {
                type: "string",
                required: false,
                input: true,
            },
            role: {
                type: "string",
                required: false,
                defaultValue: "client",
                input: true,
            },
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
            requireLocalEmailVerified: false,
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    databaseHooks: {
        user: {
            create: {
                // Sécurité : seuls les rôles "client" et "vendor" peuvent être
                // créés par une inscription (email OU Google).
                // Le rôle est déterminé AVANT la création :
                // - Si inscription email classique : rôle par défaut "client"
                // - Si Google Auth : rôle lu depuis cookie gazpoint_register_role
                // Toute tentative d'élévation (ex: role: "admin") retombe en "client".
                // Un compte admin se crée uniquement par promotion manuelle en base.
                before: async (user: Record<string, unknown>, ctx: unknown) => {
                    // Déterminer le rôle depuis le cookie si Google Auth
                    const roleFromCookie = await getRoleFromRegisterCookie()
                    
                    // Pour email/password : les champs additionnels sont dans ctx.body ou ctx.request
                    const ctxTyped = ctx as { body?: Record<string, unknown>; request?: Record<string, unknown> } | undefined
                    const roleFromBody = (ctxTyped?.body as { role?: string })?.role || (ctxTyped?.request as { role?: string })?.role
                    const phoneNumber = (ctxTyped?.body as { phoneNumber?: string })?.phoneNumber || (ctxTyped?.request as { phoneNumber?: string })?.phoneNumber
                    
                    console.log("[auth-hook] user:", JSON.stringify(user, null, 2))
                    console.log("[auth-hook] ctx.body:", JSON.stringify(ctxTyped?.body, null, 2))
                    console.log("[auth-hook] ctx.request:", JSON.stringify(ctxTyped?.request, null, 2))
                    console.log("[auth-hook] roleFromBody:", roleFromBody, "phoneNumber:", phoneNumber, "roleFromCookie:", roleFromCookie)
                    
                    const role = roleFromBody === "vendor" ? "vendor" : roleFromCookie
                    
                    return { data: { ...user, role, phoneNumber } }
                },
            },
        },
    },
    plugins: [nextCookies()]
});