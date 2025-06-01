import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { eq } from 'drizzle-orm';

import { db } from '../adapter';
import { type Context } from '../context';
import { userTable } from '../db/schemas/auth';
import { lucia } from '../lucia';
import { loggedIn } from '../middleware/loggedIn';
import { zValidator } from '@hono/zod-validator';
import { generateId } from 'lucia'; // FIX: Use Lucia v2 (replace later with better auth or auth.js)
import postgres from 'postgres';

import { loginSchema, type SuccessResponse } from '../../shared/types';

export const authRouter = new Hono<Context>()
    .post('/signup', zValidator('form', loginSchema), async (ctx) => {
        const { username, password } = ctx.req.valid('form');
        const passwordHash = await Bun.password.hash(password);
        const userId = generateId(15);

        try {
            await db.insert(userTable).values({
                id: userId,
                username,
                passwordHash: passwordHash,
            });

            const session = await lucia.createSession(userId, {
                username,
            });
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
                throw new HTTPException(409, {
                    message: 'Username already exists',
                });
            }
            throw new HTTPException(500, {
                message: 'Failed to create user',
            });
        }
    })
    /**
     * Optional: Use "Incorrect username and/or password" as an error message to avoid leaking information about existing users
     */
    .post('/login', zValidator('form', loginSchema), async (ctx) => {
        const { username, password } = ctx.req.valid('form');

        const [existingUser] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.username, username))
            .limit(1);

        if (!existingUser) {
            throw new HTTPException(401, {
                message: 'Incorrect username',
            });
        }

        // Check if user entered valid password using the password API from Bun
        const validPassword = await Bun.password.verify(
            password,
            existingUser.passwordHash,
        );

        // Throw error if user didn't enter correct pw
        if (!validPassword) {
            throw new HTTPException(401, {
                message: 'Incorrect password',
            });
        }

        // Create session for existing user
        const session = await lucia.createSession(existingUser.id, {
            username,
        });
        const sessionCookie = lucia.createSessionCookie(session.id).serialize();

        // Attach cookie to every request, so that any API calls that I make after that are authorized
        ctx.header('Set-Cookie', sessionCookie, { append: true });

        return ctx.json<SuccessResponse>(
            {
                success: true,
                message: 'Logged in',
            },
            200,
        );
    })
    .get('/logout', async (ctx) => {
        // Check if there is a session already
        const session = ctx.get('session'); // Session is attached by the middleware

        // If no session is active then redirect user to home page
        if (!session) {
            return ctx.redirect('/');
        }

        // Invalidate session if user logs out
        await lucia.invalidateSession(session.id); // Pass session ID we got from "ctx.get('session')"

        // Set header with blank cookie
        ctx.header('Set-Cookie', lucia.createBlankSessionCookie().serialize());

        return ctx.redirect('/');
    })
    .get('/user', loggedIn, async (ctx) => {
        const user = ctx.get('user')!;

        return ctx.json<SuccessResponse<{ username: string }>>({
            success: true,
            message: 'User fetched',
            data: { username: user.username },
        });
    });
