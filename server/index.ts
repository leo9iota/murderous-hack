import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';

import { type ErrorResponse } from '@/shared/types';
import type { Context } from './context';
import { auth } from './auth';
import { authMiddleware } from './middleware/auth';
import { authRouter } from './routes/auth';
import { commentsRouter } from './routes/comments';
import { postRouter } from './routes/posts';

const app = new Hono<Context>();

// Apply auth middleware
app.use('*', cors(), authMiddleware);

// Better Auth endpoints
app.on(['POST', 'GET'], '/api/auth/**', async (c) => {
    const response = await auth.handler(c.req.raw);
    return response;
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
    .basePath('/api')
    .route('/auth', authRouter)
    .route('/posts', postRouter)
    .route('/comments', commentsRouter);

// Serve static files
app.use('*', serveStatic({ root: './frontend/dist' }));
app.use('*', serveStatic({ path: './frontend/dist/index.html' }));

// Error handling
app.onError((err, c) => {
    if (err instanceof HTTPException) {
        const errResponse =
            err.res ??
            c.json<ErrorResponse>(
                {
                    success: false,
                    error: err.message,
                    isFormError: !!err.cause?.form,
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
                    ? 'Internal Server Error'
                    : (err?.stack ?? err?.message ?? 'Unknown Error'),
        },
        500,
    );
});

export default app;
export type ApiRoutes = typeof routes;
export type ApiRoutes = typeof routes;
