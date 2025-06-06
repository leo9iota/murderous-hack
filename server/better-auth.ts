import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from './adapter';
import { userTable, sessionTable } from './db/schemas/auth';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            user: userTable,
            session: sessionTable,
        },
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Disable for now since we're using username
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    advanced: {
        generateId: () => {
            // Generate a random ID similar to Lucia's generateId
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 15; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        },
    },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
