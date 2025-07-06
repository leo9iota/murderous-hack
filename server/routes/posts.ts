import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { and, asc, countDistinct, desc, eq, isNull, sql } from 'drizzle-orm';

import { db } from '@/adapter';
import { type Context } from '@/context';
import { users } from '@/db/schemas/auth';
import { comments } from '@/db/schemas/comments';
import { posts } from '@/db/schemas/posts';
import { commentUpvotes, postUpvotes } from '@/db/schemas/upvotes';
import { requireAuth } from '@/middleware/requireAuth';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import {
    createCommentSchema,
    createPostSchema,
    idParamSchema,
    paginationSchema,
    type Comment,
    type PaginatedResponse,
    type Post,
    type SuccessResponse,
} from '@/shared/types';
import { getISOFormatDateQuery } from '@/lib/utils';

export const postRouter = new Hono<Context>()
    .post('/', requireAuth, zValidator('json', createPostSchema), async (c) => {
        console.log('Post creation endpoint hit');
        const { title, url, content } = c.req.valid('json');
        console.log('Validated data:', { title, url, content });
        const user = c.get('user')!;
        const [post] = await db
            .insert(posts)
            .values({
                title,
                content,
                url,
                userId: user.id,
            })
            .returning({ id: posts.id });
        return c.json<SuccessResponse<{ postId: number }>>(
            {
                success: true,
                message: 'Post created',
                data: { postId: post.id },
            },
            201,
        );
    })
    .get('/', zValidator('query', paginationSchema), async (c) => {
        const { limit, page, sortBy, order, author, site } = c.req.valid('query');
        const user = c.get('user');

        const offset = (page - 1) * limit;

        const sortByColumn = sortBy === 'points' ? posts.points : posts.createdAt;
        const sortOrder = order === 'desc' ? desc(sortByColumn) : asc(sortByColumn);

        const [count] = await db
            .select({ count: countDistinct(posts.id) })
            .from(posts)
            .where(
                and(
                    author ? eq(posts.userId, author) : undefined,
                    site ? eq(posts.url, site) : undefined,
                ),
            );

        const postsQuery = db
            .select({
                id: posts.id,
                title: posts.title,
                url: posts.url,
                points: posts.points,
                createdAt: getISOFormatDateQuery(posts.createdAt),
                commentCount: posts.commentCount,
                author: sql<{ username: string; id: string }>`
                    CASE
                        WHEN COALESCE(${users.name}, ${users.username}) IS NULL OR COALESCE(${users.name}, ${users.username}) = '' THEN
                            json_build_object('username', '[deleted]', 'id', 'deleted')
                        ELSE
                            json_build_object('username', COALESCE(${users.name}, ${users.username}), 'id', ${users.id})
                    END
                `,
                isUpvoted: user
                    ? sql<boolean>`CASE WHEN ${postUpvotes.userId} IS NOT NULL THEN true ELSE false END`
                    : sql<boolean>`false`,
            })
            .from(posts)
            .leftJoin(users, eq(posts.userId, users.id))
            .orderBy(sortOrder)
            .limit(limit)
            .offset(offset)
            .where(
                and(
                    author ? eq(posts.userId, author) : undefined,
                    site ? eq(posts.url, site) : undefined,
                ),
            );

        if (user) {
            postsQuery.leftJoin(
                postUpvotes,
                and(
                    eq(postUpvotes.postId, posts.id),
                    eq(postUpvotes.userId, user.id),
                ),
            );
        }

        const postsResult = await postsQuery;

        return c.json<PaginatedResponse<Post[]>>(
            {
                data: postsResult as Post[],
                success: true,
                message: 'Posts fetched',
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
        requireAuth,
        zValidator('param', idParamSchema),
        async (c) => {
            const { id } = c.req.valid('param');
            const user = c.get('user')!;
            let pointsChange: -1 | 1 = 1;

            const points = await db.transaction(async (tx) => {
                const [existingUpvote] = await tx
                    .select()
                    .from(postUpvotes)
                    .where(
                        and(
                            eq(postUpvotes.postId, id),
                            eq(postUpvotes.userId, user.id),
                        ),
                    )
                    .limit(1);

                pointsChange = existingUpvote ? -1 : 1;

                const [updated] = await tx
                    .update(posts)
                    .set({ points: sql`${posts.points} + ${pointsChange}` })
                    .where(eq(posts.id, id))
                    .returning({ points: posts.points });

                if (!updated) {
                    throw new HTTPException(404, { message: 'Post not found' });
                }

                if (existingUpvote) {
                    await tx
                        .delete(postUpvotes)
                        .where(eq(postUpvotes.id, existingUpvote.id));
                } else {
                    await tx
                        .insert(postUpvotes)
                        .values({ postId: id, userId: user.id });
                }

                return updated.points;
            });

            return c.json<SuccessResponse<{ count: number; isUpvoted: boolean }>>(
                {
                    success: true,
                    message: 'Post updated',
                    data: { count: points, isUpvoted: pointsChange > 0 },
                },
                200,
            );
        },
    )
    .post(
        '/:id/comment',
        requireAuth,
        zValidator('param', idParamSchema),
        zValidator('json', createCommentSchema),
        async (c) => {
            const { id } = c.req.valid('param');
            const { content } = c.req.valid('json');
            const user = c.get('user')!;

            const [comment] = await db.transaction(async (tx) => {
                const [updated] = await tx
                    .update(posts)
                    .set({ commentCount: sql`${posts.commentCount} + 1` })
                    .where(eq(posts.id, id))
                    .returning({ commentCount: posts.commentCount });

                if (!updated) {
                    throw new HTTPException(404, {
                        message: 'Post not found',
                    });
                }

                return await tx
                    .insert(comments)
                    .values({
                        content,
                        userId: user.id,
                        postId: id,
                    })
                    .returning({
                        id: comments.id,
                        userId: comments.userId,
                        postId: comments.postId,
                        content: comments.content,
                        points: comments.points,
                        depth: comments.depth,
                        parentCommentId: comments.parentCommentId,
                        createdAt: getISOFormatDateQuery(comments.createdAt).as(
                            'created_at',
                        ),
                        commentCount: comments.commentCount,
                    });
            });
            return c.json<SuccessResponse<Comment>>({
                success: true,
                message: 'Comment created',
                data: {
                    ...comment,
                    commentUpvotes: [],
                    childComments: [],
                    author: {
                        username: user.name || 'unknown',
                        id: user.id,
                    },
                } as unknown as Comment,
            });
        },
    )
    .get(
        '/:id/comments',
        zValidator('param', idParamSchema),
        zValidator(
            'query',
            paginationSchema.extend({
                includeChildren: z.boolean({ coerce: true }).optional(),
            }),
        ),
        async (c) => {
            const { id } = c.req.valid('param');
            const { limit, page, includeChildren } = c.req.valid('query');
            const user = c.get('user');

            const offset = (page - 1) * limit;

            const [count] = await db
                .select({ count: countDistinct(comments.id) })
                .from(comments)
                .where(and(eq(comments.postId, id), isNull(comments.parentCommentId)));

            // Base query for top-level comments
            const topLevelCommentsQuery = db
                .select({
                    id: comments.id,
                    userId: comments.userId,
                    postId: comments.postId,
                    parentCommentId: comments.parentCommentId,
                    content: comments.content,
                    createdAt: getISOFormatDateQuery(comments.createdAt),
                    depth: comments.depth,
                    commentCount: comments.commentCount,
                    points: comments.points,
                    author: sql<{ username: string; id: string }>`
                    CASE
                        WHEN COALESCE(${users.name}, ${users.username}) IS NULL OR COALESCE(${users.name}, ${users.username}) = '' THEN
                            json_build_object('username', '[deleted]', 'id', 'deleted')
                        ELSE
                            json_build_object('username', COALESCE(${users.name}, ${users.username}), 'id', ${users.id})
                    END
                `,
                    isUpvoted: user
                        ? sql<boolean>`CASE WHEN ${commentUpvotes.userId} IS NOT NULL THEN true ELSE false END`
                        : sql<boolean>`false`,
                })
                .from(comments)
                .leftJoin(users, eq(comments.userId, users.id))
                .where(
                    and(
                        eq(comments.postId, id),
                        isNull(comments.parentCommentId), // Only fetch top-level comments
                    ),
                )
                .orderBy(desc(comments.points))
                .limit(limit)
                .offset(offset);

            if (user) {
                topLevelCommentsQuery.leftJoin(
                    commentUpvotes,
                    and(
                        eq(commentUpvotes.commentId, comments.id),
                        eq(commentUpvotes.userId, user.id),
                    ),
                );
            }

            const topLevelComments = (await topLevelCommentsQuery) as Comment[];

            if (includeChildren) {
                const commentIds = topLevelComments.map((comment) => comment.id);
                if (commentIds.length > 0) {
                    const childCommentsQuery = db
                        .select({
                            id: comments.id,
                            userId: comments.userId,
                            postId: comments.postId,
                            parentCommentId: comments.parentCommentId,
                            content: comments.content,
                            createdAt: getISOFormatDateQuery(comments.createdAt),
                            depth: comments.depth,
                            commentCount: comments.commentCount,
                            points: comments.points,
                            author: sql<{ username: string; id: string }>`
                            CASE
                                WHEN COALESCE(${users.name}, ${users.username}) IS NULL OR COALESCE(${users.name}, ${users.username}) = '' THEN
                                    json_build_object('username', '[deleted]', 'id', 'deleted')
                                ELSE
                                    json_build_object('username', COALESCE(${users.name}, ${users.username}), 'id', ${users.id})
                            END
                        `,
                            isUpvoted: user
                                ? sql<boolean>`CASE WHEN ${commentUpvotes.userId} IS NOT NULL THEN true ELSE false END`
                                : sql<boolean>`false`,
                        })
                        .from(comments)
                        .leftJoin(users, eq(comments.userId, users.id))
                        .where(sql`${comments.parentCommentId} IN ${commentIds}`);

                    if (user) {
                        childCommentsQuery.leftJoin(
                            commentUpvotes,
                            and(
                                eq(commentUpvotes.commentId, comments.id),
                                eq(commentUpvotes.userId, user.id),
                            ),
                        );
                    }
                    const childComments = (await childCommentsQuery) as Comment[];
                    const childCommentMap = childComments.reduce(
                        (acc, comment) => {
                            const parentId = comment.parentCommentId;
                            if (parentId) {
                                if (!acc[parentId]) {
                                    acc[parentId] = [];
                                }
                                acc[parentId].push(comment);
                            }
                            return acc;
                        },
                        {} as Record<number, Comment[]>,
                    );

                    topLevelComments.forEach((comment) => {
                        comment.childComments = childCommentMap[comment.id] || [];
                    });
                }
            }

            return c.json<PaginatedResponse<Comment[]>>({
                data: topLevelComments,
                success: true,
                message: 'Comments fetched',
                pagination: {
                    page,
                    totalPages: Math.ceil(count.count / limit),
                },
            });
        },
    )
    .get(
        '/:id',
        zValidator('param', idParamSchema),
        async (c) => {
            const { id } = c.req.valid('param');
            const user = c.get('user');

            const postsQuery = db
                .select({
                    id: posts.id,
                    title: posts.title,
                    url: posts.url,
                    content: posts.content,
                    points: posts.points,
                    createdAt: getISOFormatDateQuery(posts.createdAt),
                    commentCount: posts.commentCount,
                    author: sql<{ username: string; id: string }>`
                    CASE
                        WHEN COALESCE(${users.name}, ${users.username}) IS NULL OR COALESCE(${users.name}, ${users.username}) = '' THEN
                            json_build_object('username', '[deleted]', 'id', 'deleted')
                        ELSE
                            json_build_object('username', COALESCE(${users.name}, ${users.username}), 'id', ${users.id})
                    END
                `,
                    isUpvoted: user
                        ? sql<boolean>`CASE WHEN ${postUpvotes.userId} IS NOT NULL THEN true ELSE false END`
                        : sql<boolean>`false`,
                })
                .from(posts)
                .leftJoin(users, eq(posts.userId, users.id))
                .where(eq(posts.id, id));

            if (user) {
                postsQuery.leftJoin(
                    postUpvotes,
                    and(
                        eq(postUpvotes.postId, posts.id),
                        eq(postUpvotes.userId, user.id),
                    ),
                );
            }

            const [post] = await postsQuery;
            if (!post) {
                throw new HTTPException(404, { message: 'Post not found' });
            }
            return c.json<SuccessResponse<Post>>(
                {
                    success: true,
                    message: 'Post Fetched',
                    data: post as Post,
                },
                200,
            );
        },
    )
    .delete(
        '/:id',
        requireAuth,
        zValidator('param', idParamSchema),
        async (c) => {
            const { id } = c.req.valid('param');
            const user = c.get('user')!;

            // First check if the post exists and belongs to the user
            const [post] = await db
                .select({ userId: posts.userId })
                .from(posts)
                .where(eq(posts.id, id))
                .limit(1);

            if (!post) {
                throw new HTTPException(404, { message: 'Post not found' });
            }

            if (post.userId !== user.id) {
                throw new HTTPException(403, {
                    message: 'You can only delete your own posts',
                });
            }

            // Delete the post (this will cascade delete comments and upvotes if foreign keys are set up)
            await db.delete(posts).where(eq(posts.id, id));

            return c.json<SuccessResponse<null>>(
                {
                    success: true,
                    message: 'Post deleted',
                    data: null,
                },
                200,
            );
        },
    );
