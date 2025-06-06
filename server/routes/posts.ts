import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { and, asc, countDistinct, desc, eq, isNull, sql } from 'drizzle-orm';

import { db } from '@/adapter';
import { type Context } from '@/context';
import { userTable } from '@/db/schemas/auth';
import { commentsTable } from '@/db/schemas/comments';
import { postsTable } from '@/db/schemas/posts';
import { commentUpvotesTable, postUpvotesTable } from '@/db/schemas/upvotes';
import { loggedIn } from '@/middleware/logged-in';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import {
    insertPostSchema,
    createCommentSchema,
    paginationSchema,
    type SuccessResponse,
} from '@/shared/types';

export const postRouter = new Hono<Context>()
    .get('/', zValidator('query', paginationSchema), async (c) => {
        const { page, sortBy, order, author, site } = c.req.valid('query');
        const user = c.get('user');
        const limit = 10;
        const offset = (page - 1) * limit;

        let orderByClause;
        switch (sortBy) {
            case 'recent':
                orderByClause = order === 'asc' ? asc(postsTable.createdAt) : desc(postsTable.createdAt);
                break;
            case 'points':
                orderByClause = order === 'asc' ? asc(postsTable.points) : desc(postsTable.points);
                break;
            case 'comments':
                orderByClause = order === 'asc' ? asc(postsTable.commentCount) : desc(postsTable.commentCount);
                break;
            default:
                orderByClause = desc(postsTable.points);
        }

        const whereConditions = [];
        if (author) {
            whereConditions.push(eq(userTable.username, author));
        }
        if (site) {
            whereConditions.push(sql`${postsTable.url} LIKE ${`%${site}%`}`);
        }

        const posts = await db
            .select({
                id: postsTable.id,
                title: postsTable.title,
                url: postsTable.url,
                content: postsTable.content,
                points: postsTable.points,
                commentCount: postsTable.commentCount,
                createdAt: postsTable.createdAt,
                author: userTable.username,
                isUpvoted: user
                    ? countDistinct(
                          sql`CASE WHEN ${postUpvotesTable.userId} = ${user.id} THEN 1 END`,
                      )
                    : sql`0`,
            })
            .from(postsTable)
            .innerJoin(userTable, eq(postsTable.userId, userTable.id))
            .leftJoin(
                postUpvotesTable,
                and(
                    eq(postUpvotesTable.postId, postsTable.id),
                    user ? eq(postUpvotesTable.userId, user.id) : undefined,
                ),
            )
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .groupBy(postsTable.id, userTable.username)
            .orderBy(orderByClause)
            .limit(limit)
            .offset(offset);

        const [{ totalCount }] = await db
            .select({ totalCount: countDistinct(postsTable.id) })
            .from(postsTable)
            .innerJoin(userTable, eq(postsTable.userId, userTable.id))
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        const totalPages = Math.ceil(totalCount / limit);

        return c.json<
            SuccessResponse<{
                data: typeof posts;
                pagination: {
                    page: number;
                    totalPages: number;
                    totalCount: number;
                };
            }>
        >({
            success: true,
            message: 'Posts fetched',
            data: {
                data: posts.map((post) => ({
                    ...post,
                    isUpvoted: Boolean(post.isUpvoted),
                })),
                pagination: {
                    page,
                    totalPages,
                    totalCount,
                },
            },
        });
    })
    .post('/', loggedIn, zValidator('form', insertPostSchema), async (c) => {
        const { title, url, content } = c.req.valid('form');
        const user = c.get('user')!;

        const [post] = await db
            .insert(postsTable)
            .values({
                userId: user.id,
                title,
                url: url || null,
                content: content || null,
            })
            .returning({ id: postsTable.id });

        return c.json<SuccessResponse<{ postId: number }>>(
            {
                success: true,
                message: 'Post created',
                data: { postId: post.id },
            },
            201,
        );
    })
    .get('/:id', zValidator('param', z.object({ id: z.string() })), async (c) => {
        const { id } = c.req.valid('param');
        const user = c.get('user');

        const [post] = await db
            .select({
                id: postsTable.id,
                title: postsTable.title,
                url: postsTable.url,
                content: postsTable.content,
                points: postsTable.points,
                commentCount: postsTable.commentCount,
                createdAt: postsTable.createdAt,
                author: userTable.username,
                isUpvoted: user
                    ? countDistinct(
                          sql`CASE WHEN ${postUpvotesTable.userId} = ${user.id} THEN 1 END`,
                      )
                    : sql`0`,
            })
            .from(postsTable)
            .innerJoin(userTable, eq(postsTable.userId, userTable.id))
            .leftJoin(
                postUpvotesTable,
                and(
                    eq(postUpvotesTable.postId, postsTable.id),
                    user ? eq(postUpvotesTable.userId, user.id) : undefined,
                ),
            )
            .where(eq(postsTable.id, Number(id)))
            .groupBy(postsTable.id, userTable.username)
            .limit(1);

        if (!post) {
            throw new HTTPException(404, { message: 'Post not found' });
        }

        return c.json<SuccessResponse<typeof post>>({
            success: true,
            message: 'Post fetched',
            data: {
                ...post,
                isUpvoted: Boolean(post.isUpvoted),
            },
        });
    })
    .post(
        '/:id/upvote',
        loggedIn,
        zValidator('param', z.object({ id: z.string() })),
        async (c) => {
            const { id } = c.req.valid('param');
            const user = c.get('user')!;

            const [existingUpvote] = await db
                .select()
                .from(postUpvotesTable)
                .where(
                    and(
                        eq(postUpvotesTable.postId, Number(id)),
                        eq(postUpvotesTable.userId, user.id),
                    ),
                )
                .limit(1);

            if (existingUpvote) {
                await db
                    .delete(postUpvotesTable)
                    .where(
                        and(
                            eq(postUpvotesTable.postId, Number(id)),
                            eq(postUpvotesTable.userId, user.id),
                        ),
                    );

                await db
                    .update(postsTable)
                    .set({
                        points: sql`${postsTable.points} - 1`,
                    })
                    .where(eq(postsTable.id, Number(id)));
            } else {
                await db.insert(postUpvotesTable).values({
                    postId: Number(id),
                    userId: user.id,
                });

                await db
                    .update(postsTable)
                    .set({
                        points: sql`${postsTable.points} + 1`,
                    })
                    .where(eq(postsTable.id, Number(id)));
            }

            return c.json<SuccessResponse>({
                success: true,
                message: existingUpvote ? 'Post downvoted' : 'Post upvoted',
            });
        },
    )
    .delete(
        '/:id',
        loggedIn,
        zValidator('param', z.object({ id: z.string() })),
        async (c) => {
            const { id } = c.req.valid('param');
            const user = c.get('user')!;

            const [post] = await db
                .select({ userId: postsTable.userId })
                .from(postsTable)
                .where(eq(postsTable.id, Number(id)))
                .limit(1);

            if (!post) {
                throw new HTTPException(404, { message: 'Post not found' });
            }

            if (post.userId !== user.id) {
                throw new HTTPException(403, { message: 'Forbidden' });
            }

            await db.delete(postsTable).where(eq(postsTable.id, Number(id)));

            return c.json<SuccessResponse>({
                success: true,
                message: 'Post deleted',
            });
        },
    )
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
                .where(eq(commentsTable.postId, Number(id)))
                .groupBy(commentsTable.id, userTable.username)
                .orderBy(orderByClause)
                .limit(limit)
                .offset(offset);

            const [{ totalCount }] = await db
                .select({ totalCount: countDistinct(commentsTable.id) })
                .from(commentsTable)
                .where(eq(commentsTable.postId, Number(id)));

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
        '/:id/comment',
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
                    postId: Number(id),
                    content,
                })
                .returning({ id: commentsTable.id });

            // Update post comment count
            await db
                .update(postsTable)
                .set({
                    commentCount: sql`${postsTable.commentCount} + 1`,
                })
                .where(eq(postsTable.id, Number(id)));

            return c.json<SuccessResponse<{ commentId: number }>>(
                {
                    success: true,
                    message: 'Comment created',
                    data: { commentId: comment.id },
                },
                201,
            );
        },
    );
