import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';

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
    baseURL: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000',
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        // Custom signup to handle username as email
        async signUpEmail(email, password, request) {
            // Extract username from email (format: username@murderous-hack.local)
            const username = email.split('@')[0];

            // Check if username already exists
            const existingUser = await db
                .select()
                .from(userTable)
                .where(eq(userTable.username, username))
                .limit(1);

            if (existingUser.length > 0) {
                throw new Error('Username already exists');
            }

            return {
                email,
                name: username,
                username,
            };
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24 * 7, // 7 days
        },
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
