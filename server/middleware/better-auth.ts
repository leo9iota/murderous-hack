import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';

import type { BetterContext } from '@/better-context';
import { db } from '@/adapter';
import { userTable, sessionTable } from '@/db/schemas/auth';

export const betterAuthMiddleware = createMiddleware<BetterContext>(async (c, next) => {
    try {
        // Get session token from cookie
        const cookies = c.req.header('Cookie') || '';
        const sessionTokenMatch = cookies.match(/better-auth\.session_token=([^;]+)/);

        if (!sessionTokenMatch) {
            c.set('session', null);
            c.set('user', null);
            return next();
        }

        const sessionToken = sessionTokenMatch[1];

        // Find session in database with user data
        const [sessionWithUser] = await db
            .select({
                sessionId: sessionTable.id,
                sessionToken: sessionTable.token,
                sessionExpiresAt: sessionTable.expiresAt,
                sessionUserId: sessionTable.userId,
                userId: userTable.id,
                username: userTable.username,
                email: userTable.email,
                name: userTable.name,
            })
            .from(sessionTable)
            .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
            .where(eq(sessionTable.token, sessionToken))
            .limit(1);

        if (!sessionWithUser || sessionWithUser.sessionExpiresAt < new Date()) {
            c.set('session', null);
            c.set('user', null);
            return next();
        }

        // Set session and user in context
        c.set('session', {
            id: sessionWithUser.sessionId,
            token: sessionWithUser.sessionToken,
            expiresAt: sessionWithUser.sessionExpiresAt,
            userId: sessionWithUser.sessionUserId,
        });

        c.set('user', {
            id: sessionWithUser.userId,
            username: sessionWithUser.username,
            email: sessionWithUser.email,
            name: sessionWithUser.name,
        });
    } catch (error) {
        c.set('session', null);
        c.set('user', null);
    }

    await next();
});
