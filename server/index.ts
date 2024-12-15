import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { ErrorResponse } from '@/shared/types';

const app = new Hono(); // Create new Hono instance

app.get('/', (ctx) => {
    // throw new HTTPException(404, { message: 'Post not found', cause: { form: true } });
    // throw new Error('Unexpected error');
    return ctx.text('Hello Hono!');
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
