import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';

import { type ErrorResponse } from '@/shared/types';
import type { Context } from './context';
import { lucia } from './lucia';
import { authRouter } from './routes/auth';

const app = new Hono<Context>();

app.get('/', (ctx) => {
    // Purposeful exception
    // throw new HTTPException(404, { message: 'Post not found', cause: { form: true } });

    // Unexpected exception, when some logic in the code may break something that is unexpected
    // throw new Error("Unexpected error")

    return ctx.text('Hello from Hono!');
});

app.use('*', cors(), async (ctx, next) => {
    const sessionId = lucia.readSessionCookie(
        ctx.req.header('Cookie') ?? '',
    );

    if (!sessionId) {
        ctx.set('user', null);
        ctx.set('session', null);
        return next();
    }

    // Check if session is active and is valid
    const { session, user } = await lucia.validateSession(sessionId);

    if (session && session.fresh) {
        ctx.header(
            'Set-Cookie',
            lucia.createSessionCookie(session.id).serialize(),
            {
                append: true,
            },
        );
    }

    if (!session) {
        ctx.header(
            'Set-Cookie',
            lucia.createBlankSessionCookie().serialize(),
            { append: true },
        );
    }

    // If it is valid set it as context
    ctx.set('session', session);
    ctx.set('user', user);
    return next();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app.basePath('/api').route('/auth', authRouter);

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
                        err.cause &&
                        typeof err.cause === 'object' &&
                        'form' in err.cause
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
export type ApiRoutes = typeof routes;
