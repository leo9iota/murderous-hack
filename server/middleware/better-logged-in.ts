import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import type { BetterContext } from '@/better-context';

export const betterLoggedIn = createMiddleware<BetterContext>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }
    await next();
});
