import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

import { users } from './auth';
import { posts } from './posts';
import { commentUpvotes } from './upvotes';

export const comments = pgTable('comments', {
    id: serial('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    postId: integer('post_id')
        .notNull()
        .references(() => posts.id, { onDelete: 'cascade' }),
    parentCommentId: integer('parent_comment_id'),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    depth: integer('depth').default(0).notNull(),
    commentCount: integer('comment_count').default(0).notNull(),
    points: integer('points').default(0).notNull(),
});

export const commentRelations = relations(comments, ({ one, many }) => ({
    author: one(users, {
        fields: [comments.userId],
        references: [users.id],
        relationName: 'author',
    }),
    parentComment: one(comments, {
        fields: [comments.parentCommentId],
        references: [comments.id],
        relationName: 'childComments',
    }),
    childComments: many(comments, {
        relationName: 'childComments',
    }),
    post: one(posts, {
        fields: [comments.postId],
        references: [posts.id],
    }),
    commentUpvotes: many(commentUpvotes, { relationName: 'commentUpvotes' }),
}));

export const insertCommentsSchema = createInsertSchema(comments, {
    content: z
        .string()
        .min(3, { message: 'Comment must be at least 3 characters long' }),
});
