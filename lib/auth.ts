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
            clientId: "204942456162-vhnau15uv4nev781t2ptukjr2a9hjktp.apps.googleusercontent.com",
            clientSecret: "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",
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    plugins: [nextCookies()]
});