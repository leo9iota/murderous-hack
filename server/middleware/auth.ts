import { createMiddleware } from 'hono/factory';
import { auth } from '../auth';
import type { Context } from '../context';

export const authMiddleware = createMiddleware<Context>(async (c, next) => {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (session) {
        c.set('user', session.user);
        c.set('session', session);
    } else {
        c.set('user', null);
        c.set('session', null);
    }

    await next();
});


