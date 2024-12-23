import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { db } from '@/adapter';
import type { Context } from '@/context';
import { userTable } from '@/db/schemas/auth';
import { lucia } from '@/lucia';
import { zValidator } from '@hono/zod-validator';
import { generateId } from 'lucia';
import postgres from 'postgres';

import { loginSchema, type SuccessResponse } from '@/shared/types';

export const authRouter = new Hono<Context>().post(
    '/signup',
    zValidator('form', loginSchema),
    async (ctx) => {
        const { username, password } = ctx.req.valid('form');
        const passwordHash = await Bun.password.hash(password);
        const userId = generateId(15);

        try {
            await db.insert(userTable).values({
                id: userId,
                username,
                passwordHash: passwordHash,
            });

            const session = await lucia.createSession(userId, { username });
            const sessionCookie = lucia.createSessionCookie(session.id).serialize();

            ctx.header('Set-Cookie', sessionCookie, { append: true });

            return ctx.json<SuccessResponse>(
                {
                    success: true,
                    message: 'User created',
                },
                201,
            );
        } catch (error) {
            if (error instanceof postgres.PostgresError && error.code === '23505') {
                throw new HTTPException();
            }
            throw new HTTPException(500, { message: 'Failed to create user' });
        }
    },
);
