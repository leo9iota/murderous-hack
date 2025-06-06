import { createMiddleware } from 'hono/factory';

import type { Context } from '@/context';
import { auth } from '@/auth';

export const authMiddleware = createMiddleware<Context>(async (c, next) => {
    try {
        // Use Better Auth to get session
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });

        if (session) {
            c.set('session', session.session);
            c.set('user', {
                id: session.user.id,
                username: session.user.username || session.user.name || '',
                email: session.user.email,
                name: session.user.name,
            });
        } else {
            c.set('session', null);
            c.set('user', null);
        }
    } catch (error) {
        c.set('session', null);
        c.set('user', null);
    }

    await next();
});
