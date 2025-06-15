import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import type { Context } from '@/context';

export const requireAuth = createMiddleware<Context>(async (c, next) => {
    const user = c.get('user');
    console.log('RequireAuth middleware - user from context:', user);
    if (!user) {
        console.log('RequireAuth: No user found, throwing 401');
        throw new HTTPException(401, { message: 'Unauthorized' });
    }
    console.log('RequireAuth: User found, proceeding');
    await next();
});
