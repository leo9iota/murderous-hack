import { relations } from 'drizzle-orm';
import {
    integer,
    pgTable,
    serial,
    text,
    timestamp,
    unique,
} from 'drizzle-orm/pg-core';

import { users } from './auth';
import { comments } from './comments';
import { posts } from './posts';

export const postUpvotes = pgTable(
    'post_upvotes',
    {
        id: serial('id').primaryKey(),
        postId: integer('post_id')
            .notNull()
            .references(() => posts.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [unique().on(table.userId, table.postId)],
);

export const postUpvoteRelations = relations(postUpvotes, ({ one }) => ({
    post: one(posts, {
        fields: [postUpvotes.postId],
        references: [posts.id],
        relationName: 'postUpvotes',
    }),
    user: one(users, {
        fields: [postUpvotes.userId],
        references: [users.id],
        relationName: 'userPostUpvotes',
    }),
}));

export const commentUpvotes = pgTable(
    'comment_upvotes',
    {
        id: serial('id').primaryKey(),
        commentId: integer('comment_id')
            .notNull()
            .references(() => comments.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        uniqueUserComment: unique().on(table.userId, table.commentId),
    }),
);

export const commentUpvoteRelations = relations(commentUpvotes, ({ one }) => ({
    comment: one(comments, {
        fields: [commentUpvotes.commentId],
        references: [comments.id],
        relationName: 'commentUpvotes',
    }),
    user: one(users, {
        fields: [commentUpvotes.userId],
        references: [users.id],
        relationName: 'userCommentUpvotes',
    }),
}));
