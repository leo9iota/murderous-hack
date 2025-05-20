import { Hono } from 'hono';
import { and, asc, countDistinct, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/adapter';
import { type Context } from '@/context';
import { userTable } from '@/db/schemas/auth';
import { postsTable } from '@/db/schemas/posts';
import { postUpvotesTable } from '@/db/schemas/upvotes';
import { loggedIn } from '@/middleware/loggedIn';
import { zValidator } from '@hono/zod-validator';

import {
    createPostSchema,
    paginationSchema,
    type SuccessResponse,
} from '@/shared/types';
import { getISOFormatDateQuery } from '@/lib/utils';

export const postRouter = new Hono<Context>()
    .post('/', loggedIn, zValidator('form', createPostSchema), async (ctx) => {
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
        return ctx.json<SuccessResponse<{ postId: number }>>(
            {
                success: true,
                message: 'Post created',
                data: { postId: post.id },
            },
            201,
        );
    })
    .get('/', zValidator('query', paginationSchema), async (ctx) => {
        const { limit, page, sortBy, order, author, site } = ctx.req.valid('query');
        const user = ctx.get('user');

        const offset = (page - 1) * limit;

        const sortByColumn =
            sortBy === 'points' ? postsTable.points : postsTable.createdAt;
        const sortOrder = order === 'desc' ? desc(sortByColumn) : asc(sortByColumn);

        const [count] = await db
            .select({ count: countDistinct(postsTable.id) })
            .from(postsTable)
            .where(
                and(
                    author ? eq(postsTable.userId, author) : undefined,
                    site ? eq(postsTable.url, site) : undefined,
                ),
            );

        const postsQuery = db
            .select({
                id: postsTable.id,
                title: postsTable.title,
                url: postsTable.url,
                points: postsTable.points,
                createdAt: getISOFormatDateQuery(postsTable.createdAt),
                commentCount: postsTable.commentCount,
                author: {
                    username: userTable.username,
                    id: userTable.id,
                },
                isUpvoted: user
                    ? sql<boolean>`CASE WHEN ${postUpvotesTable.userId} IS NOT NULL THEN true ELSE false END`
                    : sql<boolean>`false`,
            })
            .from(postsTable)
            .leftJoin(userTable, eq(postsTable.userId, userTable.id))
            .orderBy(sortOrder)
            .limit(limit)
            .offset(offset)
            .where(
                and(
                    author ? eq(postsTable.userId, author) : undefined,
                    site ? eq(postsTable.url, site) : undefined,
                ),
            );

        // Only run left join if the user exists
        if (user) {
            postsQuery.leftJoin(
                postUpvotesTable,
                and(
                    eq(postUpvotesTable.postId, postsTable.id),
                    eq(postUpvotesTable.userId, user.id),
                ),
            );
        }

        // Fetch posts from database
        const posts = await postsQuery;
    });
