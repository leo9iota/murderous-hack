import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { and, asc, countDistinct, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/adapter';
import { type Context } from '@/context';
import { comments } from '@/db/schemas/comments';
import { posts } from '@/db/schemas/posts';
import { commentUpvotes } from '@/db/schemas/upvotes';
import { requireAuth } from '@/middleware/requireAuth';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import {
    createCommentSchema,
    idParamSchema,
    paginationSchema,
    type Comment,
    type PaginatedResponse,
    type SuccessResponse,
} from '@/shared/types';
import { getISOFormatDateQuery } from '@/lib/utils';

export const commentsRouter = new Hono<Context>()
    .post(
        '/:id',
        requireAuth,
        zValidator('param', idParamSchema),
        zValidator('json', createCommentSchema),
        async (c) => {
            const { id } = c.req.valid('param');
            const { content } = c.req.valid('json');
            const user = c.get('user')!;

            const [comment] = await db.transaction(async (tx) => {
                const [parentComment] = await tx
                    .select({
                        id: comments.id,
                        postId: comments.postId,
                        depth: comments.depth,
                    })
                    .from(comments)
                    .where(eq(comments.id, id))
                    .limit(1);

                if (!parentComment) {
                    throw new HTTPException(404, {
                        message: 'Comment not found',
                    });
                }

                const postId = parentComment.postId;

                const [updateParentComment] = await tx
                    .update(comments)
                    .set({ commentCount: sql`${comments.commentCount} + 1` })
                    .where(eq(comments.id, parentComment.id))
                    .returning({ commentCount: comments.commentCount });

                const [updatedPost] = await tx
                    .update(posts)
                    .set({ commentCount: sql`${posts.commentCount} + 1` })
                    .where(eq(posts.id, postId))
                    .returning({ commentCount: posts.commentCount });

                if (!updateParentComment || !updatedPost) {
                    throw new HTTPException(404, {
                        message: 'Error creating comment',
                    });
                }

                return await tx
                    .insert(comments)
                    .values({
                        content,
                        userId: user.id,
                        postId: postId,
                        parentCommentId: parentComment.id,
                        depth: parentComment.depth + 1,
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
                    childComments: [],
                    commentUpvotes: [],
                    author: {
                        username: user.name || 'unknown',
                        id: user.id,
                    },
                } as Comment,
            });
        },
    )
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
                    .from(commentUpvotes)
                    .where(
                        and(
                            eq(commentUpvotes.commentId, id),
                            eq(commentUpvotes.userId, user.id),
                        ),
                    )
                    .limit(1);

                pointsChange = existingUpvote ? -1 : 1;

                const [updated] = await tx
                    .update(comments)
                    .set({ points: sql`${comments.points} + ${pointsChange}` })
                    .where(eq(comments.id, id))
                    .returning({ points: comments.points });

                if (!updated) {
                    throw new HTTPException(404, { message: 'Comment not found' });
                }

                if (existingUpvote) {
                    await tx
                        .delete(commentUpvotes)
                        .where(eq(commentUpvotes.id, existingUpvote.id));
                } else {
                    await tx
                        .insert(commentUpvotes)
                        .values({ commentId: id, userId: user.id });
                }

                return updated.points;
            });

            return c.json<
                SuccessResponse<{
                    count: number;
                    commentUpvotes: { userId: string }[];
                }>
            >(
                {
                    success: true,
                    message: 'Comment updated',
                    data: {
                        count: points,
                        commentUpvotes:
                            pointsChange === 1 ? [{ userId: user.id }] : [],
                    },
                },
                200,
            );
        },
    )
    .get(
        '/:id/comments',
        zValidator('param', idParamSchema),
        zValidator('query', paginationSchema),
        async (c) => {
            const user = c.get('user');
            const { id } = c.req.valid('param');
            const { limit, page, sortBy, order } = c.req.valid('query');
            const offset = (page - 1) * limit;

            const sortByColumn =
                sortBy === 'points' ? comments.points : comments.createdAt;
            const sortOrder =
                order === 'desc' ? desc(sortByColumn) : asc(sortByColumn);

            const [count] = await db
                .select({
                    count: countDistinct(comments.id),
                })
                .from(comments)
                .where(eq(comments.parentCommentId, id));

            const commentData = await db.query.comments.findMany({
                where: and(eq(comments.parentCommentId, id)),
                orderBy: sortOrder,
                limit: limit,
                offset: offset,
                with: {
                    author: {
                        columns: {
                            username: true,
                            id: true,
                            name: true,
                        },
                    },
                    commentUpvotes: {
                        columns: { userId: true },
                        where: eq(commentUpvotes.userId, user?.id ?? ''),
                        limit: 1,
                    },
                },
                extras: {
                    createdAt: getISOFormatDateQuery(comments.createdAt).as(
                        'created_at',
                    ),
                },
            });

            const processedComments = commentData.map((comment) => {
                if (!comment.author) {
                    return {
                        ...comment,
                        author: { id: 'deleted', username: '[deleted]' },
                    };
                }
                return {
                    ...comment,
                    author: {
                        ...comment.author,
                        username:
                            comment.author.name ||
                            comment.author.username ||
                            '[deleted]',
                    },
                };
            });

            return c.json<PaginatedResponse<Comment[]>>({
                success: true,
                message: 'Comments fetched',
                data: processedComments as Comment[],
                pagination: {
                    page,
                    totalPages: Math.ceil(count.count / limit) as number,
                },
            });
        },
    );
