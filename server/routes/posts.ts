import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { and, asc, countDistinct, desc, eq, isNull, sql } from 'drizzle-orm';

import { db } from '../adapter';
import { type Context } from '../context';
import { userTable } from '../db/schemas/auth';
import { commentsTable } from '../db/schemas/comments';
import { postsTable } from '../db/schemas/posts';
import { commentUpvotesTable, postUpvotesTable } from '../db/schemas/upvotes';
import { loggedIn } from '../middleware/loggedIn';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import {
    createCommentSchema,
    createPostSchema,
    paginationSchema,
    type Comment,
    type PaginatedResponse,
    type Post,
    type SuccessResponse,
} from '../../shared/types';
import { getISOFormatDateQuery } from '../lib/utils';

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
    )
    .post(
        '/:id/comment',
        loggedIn,
        zValidator('param', z.object({ id: z.coerce.number() })),
        zValidator('form', createCommentSchema),
        async (ctx) => {
            const { id } = ctx.req.valid('param');
            const { content } = ctx.req.valid('form');
            const user = ctx.get('user')!;

            const [comment] = await db.transaction(async (tx) => {
                // If this transaction fails, it means the post doesn't exist
                const [updated] = await tx
                    .update(postsTable)
                    .set({ commentCount: sql`${postsTable.commentCount} + 1` })
                    .where(eq(postsTable.id, id))
                    .returning({ commentCount: postsTable.commentCount });

                // Verify if the post exists
                if (!updated) {
                    throw new HTTPException(404, {
                        message: 'Post not found',
                    });
                }

                return await tx
                    .insert(commentsTable)
                    .values({
                        content,
                        userId: user.id,
                        postId: id,
                    })
                    .returning({
                        id: commentsTable.id,
                        userId: commentsTable.userId,
                        postId: commentsTable.postId,
                        content: commentsTable.content,
                        points: commentsTable.points,
                        depth: commentsTable.depth,
                        parent: commentsTable.depth,
                        parentCommentId: commentsTable.parentCommentId,
                        createdAt: getISOFormatDateQuery(commentsTable.createdAt).as(
                            'created_at',
                        ),
                        commentCount: commentsTable.commentCount,
                    });
            });
            return ctx.json<SuccessResponse<Comment>>({
                success: true,
                message: 'Comment successfully created',
                data: {
                    ...comment,
                    commentUpvotes: [],
                    childComments: [],
                    author: {
                        username: user.username,
                        id: user.id,
                    },
                } as Comment, // FIX: Explicitly define as 'Comment' type to mitigate issues with Hono when interacting with the frontend
            });
        },
    )
    .get(
        '/:id/comments',
        zValidator('param', z.object({ id: z.coerce.number() })),
        zValidator(
            'query',
            paginationSchema.extend({
                includeChildren: z.boolean({ coerce: true }).optional(),
            }),
        ),
        async (ctx) => {
            const user = ctx.get('user');
            const { id } = ctx.req.valid('param');
            const { limit, page, sortBy, order, includeChildren } =
                ctx.req.valid('query');
            const offset = (page - 1) * limit;

            const [postExists] = await db
                .select({ exists: sql`1` })
                .from(postsTable)
                .where(eq(postsTable.id, id))
                .limit(1);

            if (!postExists) {
                throw new HTTPException(404, { message: 'Post not found' });
            }

            const sortByColumn =
                sortBy === 'points' ? commentsTable.points : commentsTable.createdAt;

            const sortOrder =
                order === 'desc' ? desc(sortByColumn) : asc(sortByColumn);

            console.log(sortBy, order);

            const [count] = await db
                .select({ count: countDistinct(commentsTable.id) })
                .from(commentsTable)
                .where(
                    and(
                        eq(commentsTable.postId, id),
                        isNull(commentsTable.parentCommentId),
                    ),
                );

            const comments = await db.query.comments.findMany({
                where: and(
                    eq(commentsTable.postId, id),
                    isNull(commentsTable.parentCommentId),
                ),
                orderBy: sortOrder,
                limit: limit,
                offset: offset,
                with: {
                    author: {
                        columns: {
                            username: true,
                            id: true,
                        },
                    },
                    commentUpvotes: {
                        columns: { userId: true },
                        where: eq(commentUpvotesTable.userId, user?.id ?? ''),
                        limit: 1,
                    },
                    childComments: {
                        limit: includeChildren ? 2 : 0,
                        with: {
                            author: {
                                columns: {
                                    username: true,
                                    id: true,
                                },
                            },
                            commentUpvotes: {
                                columns: { userId: true },
                                where: eq(
                                    commentUpvotesTable.userId,
                                    user?.id ?? '',
                                ),
                                limit: 1,
                            },
                        },
                        orderBy: sortOrder,
                        extras: {
                            createdAt: getISOFormatDateQuery(
                                commentsTable.createdAt,
                            ).as('created_at'),
                        },
                    },
                },
                extras: {
                    createdAt: getISOFormatDateQuery(commentsTable.createdAt).as(
                        'created_at',
                    ),
                },
            });

            return ctx.json<PaginatedResponse<Comment[]>>(
                {
                    success: true,
                    message: 'Comments successfully fetched',
                    data: comments as Comment[], // FIX: Cast to 'Comment' array type for Hono
                    pagination: {
                        page,
                        totalPages: Math.ceil(count.count / limit) as number,
                    },
                },
                200,
            );
        },
    )
    .get(
        '/:id',
        zValidator('param', z.object({ id: z.coerce.number() })),
        async (ctx) => {
            const user = ctx.get('user');

            const { id } = ctx.req.valid('param');
            const postsQuery = db
                .select({
                    id: postsTable.id,
                    title: postsTable.title,
                    url: postsTable.url,
                    points: postsTable.points,
                    content: postsTable.content,
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
                .where(eq(postsTable.id, id));

            if (user) {
                postsQuery.leftJoin(
                    postUpvotesTable,
                    and(
                        eq(postUpvotesTable.postId, postsTable.id),
                        eq(postUpvotesTable.userId, user.id),
                    ),
                );
            }

            const [post] = await postsQuery;
            if (!post) {
                throw new HTTPException(404, { message: 'Post not found' });
            }
            return ctx.json<SuccessResponse<Post>>(
                {
                    success: true,
                    message: 'Post successfully fetched',
                    data: post as Post, // FIX: Use explicit type to not confuse Hono
                },
                200,
            );
        },
    );
