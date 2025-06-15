import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';

import { type ErrorResponse } from '@/shared/types';
import { auth } from './auth';
import type { Context } from './context';
import { authMiddleware } from './middleware/auth';
import { commentsRouter } from './routes/comments';
import { postRouter } from './routes/posts';

const app = new Hono<Context>();

app.use('*', cors(), authMiddleware);

app.get('/api/user', (c) => {
    const user = c.get('user');
    if (user) {
        return c.json({
            success: true,
            data: { username: user.name },
        });
    } else {
        return c.json(
            {
                success: false,
                error: 'Not authenticated',
            },
            401,
        );
    }
});

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
    return auth.handler(c.req.raw);
});

const routes = app
    .basePath('/api')
    .route('/posts', postRouter)
    .route('/comments', commentsRouter);

routes.onError((err, c) => {
    if (err instanceof HTTPException) {
        const errResponse =
            err.res ??
            c.json<ErrorResponse>(
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

    return c.json<ErrorResponse>(
        {
            success: false,
            error:
                process.env.NODE_ENV === 'production'
                    ? 'Internal server error'
                    : (err.stack ?? err.message),
        },
        500,
    );
});

app.get('*', serveStatic({ root: './frontend/dist' }));
app.get('*', serveStatic({ path: './frontend/dist/index.html' }));

export default {
    port: process.env['PORT'] || 3000,
    hostname: '0.0.0.0',
    fetch: app.fetch,
};

console.log('Server Running on port', process.env['PORT'] || 3000);
export type ApiRoutes = typeof routes;
