import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { and, asc, countDistinct, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/adapter';
import { type Context } from '@/context';
import { userTable } from '@/db/schemas/auth';
import { postsTable } from '@/db/schemas/posts';
import { postUpvotesTable } from '@/db/schemas/upvotes';
import { loggedIn } from '@/middleware/loggedIn';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import {
    createPostSchema,
    paginationSchema,
    type PaginatedResponse,
    type Post,
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

        return ctx.json<PaginatedResponse<Post[]>>(
            {
                data: posts as Post[],
                success: true,
                message: 'Posts successfully fetched',
                pagination: {
                    page: page,
                    totalPages: Math.ceil(count.count / limit) as number,
                },
            },
            200,
        );
    })
    .post(
        '/:id/upvote',
        loggedIn,
        zValidator('param', z.object({ id: z.coerce.number() })),
        async (ctx) => {
            const { id } = ctx.req.valid('param');
            const user = ctx.get('user')!;
            let pointsChange: -1 | 1 = 1;

            // Drizzle DB transaction for upvotes
            const points = await db.transaction(async (tx) => {
                const [existingUpvote] = await tx
                    .select()
                    .from(postUpvotesTable)
                    .where(
                        and(
                            eq(postUpvotesTable.postId, id),
                            eq(postUpvotesTable.userId, user.id),
                        ),
                    )
                    .limit(1);

                pointsChange = existingUpvote ? -1 : 1;

                // Check if post has been updated
                const [updated] = await tx
                    .update(postsTable)
                    .set({ points: sql`${postsTable.points} + ${pointsChange}` })
                    .where(eq(postsTable.id, id))
                    .returning({ points: postsTable.points });

                // Check if post upvote failed, e.g. when the post doesn't exist
                if (!updated) {
                    throw new HTTPException(404, { message: 'Post not found' });
                }

                // Handle upvote deletion
                if (existingUpvote) {
                    await tx
                        .delete(postUpvotesTable)
                        .where(eq(postUpvotesTable.id, existingUpvote.id));
                } else {
                    await tx
                        .insert(postUpvotesTable)
                        .values({ postId: id, userId: user.id });
                }

                return updated.points;
            });

            return ctx.json<SuccessResponse<{ count: number; isUpvoted: boolean }>>(
                {
                    success: true,
                    message: 'Post successfully updated',
                    data: { count: points, isUpvoted: pointsChange > 0 },
                },
                200,
            );
        },
    );
