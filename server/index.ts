import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';

import type { ErrorResponse } from '@/shared/types';
import type { Context } from './context';
import { lucia } from './lucia';

const app = new Hono<Context>();

app.get('/', (c) => c.json({ message: 'Hello from Hono!' }));

app.use('*', cors(), async (ctx, next) => {
    const sessionId = lucia.readSessionCookie(ctx.req.header('Cookie') ?? '');

    if (!sessionId) {
        ctx.set('user', null);
        ctx.set('session', null);
        return next();
    }

    const { session, user } = await lucia.validateSession(sessionId);
    if (session && session.fresh) {
        ctx.header('Set-Cookie', lucia.createSessionCookie(session.id).serialize(), {
            append: true,
        });
    }
    if (!session) {
        ctx.header('Set-Cookie', lucia.createBlankSessionCookie().serialize(), { append: true });
    }
    ctx.set('session', session);
    ctx.set('user', user);
    return next();
});

// Hono error handler
app.onError((err, ctx) => {
    if (err instanceof HTTPException) {
        const errResponse =
            err.res ??
            ctx.json<ErrorResponse>(
                {
                    success: false,
                    error: err.message,
                    isFormError:
                        err.cause && typeof err.cause === 'object' && 'form' in err.cause
                            ? err.cause.form === true
                            : false,
                },
                err.status,
            );
        return errResponse;
    }

    // Handling unknown errors
    return ctx.json<ErrorResponse>(
        {
            success: false,
            error:
                process.env.NODE_ENV === 'production'
                    ? 'Internal Server Error' // Generic error message for production
                    : (err.stack ?? err.message), // Return error stack, if not available, return error message
        },
        500,
    );
});

export default app;
