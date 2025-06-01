import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import { type Context } from '../context';

export const loggedIn = createMiddleware<Context>(async (ctx, next) => {
    const user = ctx.get('user');

    if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }

    // Run whats next in the chain
    await next();
});
