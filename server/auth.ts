import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./adapter";
import { users, sessions } from "./db/schemas/auth";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: users,
            session: sessions,
        },
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Keep simple for now
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24 * 7, // 7 days
        },
    },
});

export type Session = typeof auth.$Infer.Session;
export type User = Session['user'];
