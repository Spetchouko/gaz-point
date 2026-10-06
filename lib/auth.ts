import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { nextCookies } from "better-auth/next-js";

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
                // créés par une inscription (email OU Google). Toute tentative
                // d'élévation (ex: role: "admin") retombe en "client".
                // Un compte admin se crée uniquement par promotion manuelle en base.
                before: async (user) => {
                    const role = user.role === "vendor" ? "vendor" : "client";
                    return { data: { ...user, role } };
                },
            },
        },
    },
    plugins: [nextCookies()]
});