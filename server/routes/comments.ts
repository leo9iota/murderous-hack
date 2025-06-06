import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { and, asc, countDistinct, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/adapter';
import { type Context } from '@/context';
import { userTable } from '@/db/schemas/auth';
import { commentsTable } from '@/db/schemas/comments';
import { postsTable } from '@/db/schemas/posts';
import { commentUpvotesTable } from '@/db/schemas/upvotes';
import { loggedIn } from '@/middleware/logged-in';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import {
    createCommentSchema,
    paginationSchema,
    type SuccessResponse,
} from '@/shared/types';

export const commentsRouter = new Hono<Context>()
    .get(
        '/:id/comments',
        zValidator('param', z.object({ id: z.string() })),
        zValidator('query', paginationSchema),
        async (c) => {
            const { id } = c.req.valid('param');
            const { page, sortBy, order } = c.req.valid('query');
            const user = c.get('user');
            const limit = 10;
            const offset = (page - 1) * limit;

            let orderByClause;
            switch (sortBy) {
                case 'recent':
                    orderByClause = order === 'asc' ? asc(commentsTable.createdAt) : desc(commentsTable.createdAt);
                    break;
                case 'points':
                    orderByClause = order === 'asc' ? asc(commentsTable.points) : desc(commentsTable.points);
                    break;
                default:
                    orderByClause = desc(commentsTable.points);
            }

            const comments = await db
                .select({
                    id: commentsTable.id,
                    content: commentsTable.content,
                    points: commentsTable.points,
                    createdAt: commentsTable.createdAt,
                    author: userTable.username,
                    isUpvoted: user
                        ? countDistinct(
                              sql`CASE WHEN ${commentUpvotesTable.userId} = ${user.id} THEN 1 END`,
                          )
                        : sql`0`,
                })
                .from(commentsTable)
                .innerJoin(userTable, eq(commentsTable.userId, userTable.id))
                .leftJoin(
                    commentUpvotesTable,
                    and(
                        eq(commentUpvotesTable.commentId, commentsTable.id),
                        user ? eq(commentUpvotesTable.userId, user.id) : undefined,
                    ),
                )
                .where(eq(commentsTable.commentId, Number(id)))
                .groupBy(commentsTable.id, userTable.username)
                .orderBy(orderByClause)
                .limit(limit)
                .offset(offset);

            const [{ totalCount }] = await db
                .select({ totalCount: countDistinct(commentsTable.id) })
                .from(commentsTable)
                .where(eq(commentsTable.commentId, Number(id)));

            const totalPages = Math.ceil(totalCount / limit);

            return c.json<
                SuccessResponse<{
                    data: typeof comments;
                    pagination: {
                        page: number;
                        totalPages: number;
                        totalCount: number;
                    };
                }>
            >({
                success: true,
                message: 'Comments fetched',
                data: {
                    data: comments.map((comment) => ({
                        ...comment,
                        isUpvoted: Boolean(comment.isUpvoted),
                    })),
                    pagination: {
                        page,
                        totalPages,
                        totalCount,
                    },
                },
            });
        },
    )
    .post(
        '/:id',
        loggedIn,
        zValidator('param', z.object({ id: z.string() })),
        zValidator('form', createCommentSchema),
        async (c) => {
            const { id } = c.req.valid('param');
            const { content } = c.req.valid('form');
            const user = c.get('user')!;

            const [comment] = await db
                .insert(commentsTable)
                .values({
                    userId: user.id,
                    commentId: Number(id),
                    content,
                })
                .returning({ id: commentsTable.id });

            return c.json<SuccessResponse<{ commentId: number }>>(
                {
                    success: true,
                    message: 'Comment created',
                    data: { commentId: comment.id },
                },
                201,
            );
        },
    )
    .post(
        '/:id/upvote',
        loggedIn,
        zValidator('param', z.object({ id: z.string() })),
        async (c) => {
            const { id } = c.req.valid('param');
            const user = c.get('user')!;

            const [existingUpvote] = await db
                .select()
                .from(commentUpvotesTable)
                .where(
                    and(
                        eq(commentUpvotesTable.commentId, Number(id)),
                        eq(commentUpvotesTable.userId, user.id),
                    ),
                )
                .limit(1);

            if (existingUpvote) {
                await db
                    .delete(commentUpvotesTable)
                    .where(
                        and(
                            eq(commentUpvotesTable.commentId, Number(id)),
                            eq(commentUpvotesTable.userId, user.id),
                        ),
                    );

                await db
                    .update(commentsTable)
                    .set({
                        points: sql`${commentsTable.points} - 1`,
                    })
                    .where(eq(commentsTable.id, Number(id)));
            } else {
                await db.insert(commentUpvotesTable).values({
                    commentId: Number(id),
                    userId: user.id,
                });

                await db
                    .update(commentsTable)
                    .set({
                        points: sql`${commentsTable.points} + 1`,
                    })
                    .where(eq(commentsTable.id, Number(id)));
            }

            return c.json<SuccessResponse>({
                success: true,
                message: existingUpvote ? 'Comment downvoted' : 'Comment upvoted',
            });
        },
    );
