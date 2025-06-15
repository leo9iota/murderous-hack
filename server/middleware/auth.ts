import { createMiddleware } from 'hono/factory';

import { auth } from '../auth';
import type { Context } from '../context';

export const authMiddleware = createMiddleware<Context>(async (c, next) => {
    console.log('Auth middleware called for:', c.req.path);
    console.log('Headers:', Object.fromEntries(c.req.raw.headers.entries()));

    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    console.log('Session result:', session);

    if (session) {
        console.log('Setting user and session in context');
        c.set('user', session.user);
        c.set('session', session);
    } else {
        console.log('No session found, setting null');
        c.set('user', null);
        c.set('session', null);
    }

    await next();
});
