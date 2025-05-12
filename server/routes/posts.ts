import { Hono } from 'hono';

import { db } from '@/adapter';
import { type Context } from '@/context';
import { postsTable } from '@/db/schemas/posts';
import { loggedIn } from '@/middleware/loggedIn';
import { zValidator } from '@hono/zod-validator';

import { createPostSchema, type SuccessResponse } from '@/shared/types';

export const postRouter = new Hono<Context>().post(
    '/',
    loggedIn,
    zValidator('form', createPostSchema),
    async (ctx) => {
        // Define what we wanna do with the posts
        const { title, url, content } = ctx.req.valid('form');
        const user = ctx.get('user');
        const [post] = await db
            .insert(postsTable)
            .values({
                title,
                content: content || null,
                url: url || null,
                userId: user!.id,
            })
            .returning({ id: postsTable.id });
        return ctx.json<SuccessResponse<{ postId: number }>>({
            success: true,
            message: 'Post created',
            data: { postId: post.id },
        }, 201);
    },
);

