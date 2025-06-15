import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from './adapter';
import { accounts, sessions, users, verifications } from './db/schemas/auth';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            user: users,
            session: sessions,
            account: accounts,
            verification: verifications,
        },
    }),
    baseURL: 'http://localhost:3000',
    trustedOrigins: ['http://localhost:3001', 'http://localhost:3002'],
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24 * 7,
        },
    },
});

export type Session = typeof auth.$Infer.Session;
export type User = Session['user'];
