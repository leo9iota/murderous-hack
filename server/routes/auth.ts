import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { eq } from 'drizzle-orm';

import { db } from '@/adapter';
import { userTable, sessionTable } from '@/db/schemas/auth';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';

import { loginSchema, type SuccessResponse } from '@/shared/types';

// Simple ID generator similar to Lucia's generateId
function generateId(length: number = 15): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export const authRouter = new Hono()
    .post('/signup', zValidator('form', loginSchema), async (c) => {
        const { username, password } = c.req.valid('form');

        try {
            // Check if username already exists
            const [existingUser] = await db
                .select()
                .from(userTable)
                .where(eq(userTable.username, username))
                .limit(1);

            if (existingUser) {
                throw new HTTPException(409, {
                    message: 'Username already used',
                    cause: { form: true },
                });
            }

            // Create user with Better Auth using username as email
            const email = `${username}@murderous-hack.local`;

            // Hash password using Bun's built-in hasher for consistency
            const passwordHash = await Bun.password.hash(password);

            // Generate user ID
            const userId = generateId();

            // Insert user directly into database
            await db.insert(userTable).values({
                id: userId,
                username,
                email,
                password_hash: passwordHash,
                name: username,
            });

            // Create session manually
            const sessionId = generateId();
            const sessionToken = generateId();
            const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000); // 7 days

            await db.insert(sessionTable).values({
                id: sessionId,
                userId,
                token: sessionToken,
                expiresAt,
            });

            // Set session cookie
            c.header('Set-Cookie', `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);

            return c.json<SuccessResponse>(
                {
                    success: true,
                    message: 'User created',
                },
                201,
            );
        } catch (error) {
            if (error instanceof postgres.PostgresError && error.code === '23505') {
                throw new HTTPException(409, {
                    message: 'Username already used',
                    cause: { form: true },
                });
            }
            throw new HTTPException(500, { message: 'Failed to create user' });
        }
    })
    .post('/login', zValidator('form', loginSchema), async (c) => {
        const { username, password } = c.req.valid('form');

        // Find user by username first
        const [existingUser] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.username, username))
            .limit(1);

        if (!existingUser) {
            throw new HTTPException(401, {
                message: 'Incorrect username',
                cause: { form: true },
            });
        }

        // Verify password
        const validPassword = await Bun.password.verify(
            password,
            existingUser.password_hash,
        );
        if (!validPassword) {
            throw new HTTPException(401, {
                message: 'Incorrect password',
                cause: { form: true },
            });
        }

        // Create session manually
        const sessionId = generateId();
        const sessionToken = generateId();
        const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000); // 7 days

        await db.insert(sessionTable).values({
            id: sessionId,
            userId: existingUser.id,
            token: sessionToken,
            expiresAt,
        });

        // Set session cookie
        c.header('Set-Cookie', `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);

        return c.json<SuccessResponse>(
            {
                success: true,
                message: 'Logged in',
            },
            200,
        );
    })
    .get('/logout', async (c) => {
        // Get session token from cookie
        const cookies = c.req.header('Cookie') || '';
        const sessionTokenMatch = cookies.match(/better-auth\.session_token=([^;]+)/);

        if (sessionTokenMatch) {
            const sessionToken = sessionTokenMatch[1];
            // Delete session from database
            await db.delete(sessionTable).where(eq(sessionTable.token, sessionToken));
        }

        c.header('Set-Cookie', 'better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

        return c.json<SuccessResponse>({
            success: true,
            message: 'Logged out',
        });
    })
    .get('/user', async (c) => {
        // Get session token from cookie
        const cookies = c.req.header('Cookie') || '';
        const sessionTokenMatch = cookies.match(/better-auth\.session_token=([^;]+)/);

        if (!sessionTokenMatch) {
            throw new HTTPException(401, { message: 'Unauthorized' });
        }

        const sessionToken = sessionTokenMatch[1];

        // Find session in database
        const [session] = await db
            .select({
                userId: sessionTable.userId,
                expiresAt: sessionTable.expiresAt,
            })
            .from(sessionTable)
            .where(eq(sessionTable.token, sessionToken))
            .limit(1);

        if (!session || session.expiresAt < new Date()) {
            throw new HTTPException(401, { message: 'Unauthorized' });
        }

        // Get user with username from database
        const [user] = await db
            .select({ username: userTable.username })
            .from(userTable)
            .where(eq(userTable.id, session.userId))
            .limit(1);

        if (!user) {
            throw new HTTPException(404, { message: 'User not found' });
        }

        return c.json<SuccessResponse<{ username: string }>>({
            success: true,
            message: 'User fetched',
            data: { username: user.username },
        });
    });
