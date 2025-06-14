import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { auth } from '@/auth';
import type { Context } from '@/context';
import { requireAuth } from '@/middleware/requireAuth';
import { zValidator } from '@hono/zod-validator';

import { loginSchema, type SuccessResponse } from '@/shared/types';

export const authRouter = new Hono<Context>()
    .post('/signup', zValidator('form', loginSchema), async (c) => {
        const { username, password } = c.req.valid('form');

        try {
            const result = await auth.api.signUpEmail({
                body: {
                    email: `${username}@murderoushack.local`, // Fake email for username-only auth
                    password,
                    name: username,
                },
                headers: c.req.raw.headers,
            });

            return c.json<SuccessResponse>(
                {
                    success: true,
                    message: 'User created',
                },
                201,
            );
        } catch (error) {
            if (error instanceof HTTPException) throw error;
            throw new HTTPException(500, { message: 'Failed to create user' });
        }
    })
    .post('/login', zValidator('form', loginSchema), async (c) => {
        const { username, password } = c.req.valid('form');

        try {
            const result = await auth.api.signInEmail({
                body: {
                    email: `${username}@murderoushack.local`,
                    password,
                },
                headers: c.req.raw.headers,
            });

            return c.json<SuccessResponse>(
                {
                    success: true,
                    message: 'Logged in',
                },
                200,
            );
        } catch (err) {
            console.log(err);
            throw new HTTPException(401, {
                message: 'Invalid credentials',
                cause: { form: true },
            });
        }
    })
    .get('/logout', async (c) => {
        try {
            await auth.api.signOut({
                headers: c.req.raw.headers,
            });
            return c.redirect('/');
        } catch (err) {
            console.log(err);
            return c.redirect('/');
        }
    })
    .get('/user', requireAuth, async (c) => {
        const user = c.get('user')!;
        return c.json<SuccessResponse<{ username: string }>>({
            success: true,
            message: 'User fetched',
            data: {
                username: user.name || user.email?.split('@')[0] || 'unknown',
            },
        });
    });
