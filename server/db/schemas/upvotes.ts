import { relations } from 'drizzle-orm';
import {
    integer,
    pgTable,
    serial,
    text,
    timestamp,
    unique,
} from 'drizzle-orm/pg-core';

import { userTable } from './auth';
import { commentsTable } from './comments';
import { postsTable } from './posts';

export const postUpvotesTable = pgTable(
    'post_upvotes',
    {
        id: serial('id').primaryKey(),
        postId: integer('post_id')
            .notNull()
            .references(() => postsTable.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => userTable.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        uniqueUserPost: unique().on(table.userId, table.postId),
    }),
);

export const postUpvoteRelations = relations(postUpvotesTable, ({ one }) => ({
    post: one(postsTable, {
        fields: [postUpvotesTable.postId],
        references: [postsTable.id],
        relationName: 'postUpvotes',
    }),
    user: one(userTable, {
        fields: [postUpvotesTable.userId],
        references: [userTable.id],
        relationName: 'userPostUpvotes',
    }),
}));

export const commentUpvotesTable = pgTable(
    'comment_upvotes',
    {
        id: serial('id').primaryKey(),
        commentId: integer('comment_id')
            .notNull()
            .references(() => commentsTable.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => userTable.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        uniqueUserComment: unique().on(table.userId, table.commentId),
    }),
);

export const commentUpvoteRelations = relations(commentUpvotesTable, ({ one }) => ({
    comment: one(commentsTable, {
        fields: [commentUpvotesTable.commentId],
        references: [commentsTable.id],
        relationName: 'commentUpvotes',
    }),
    user: one(userTable, {
        fields: [commentUpvotesTable.userId],
        references: [userTable.id],
        relationName: 'userCommentUpvotes',
    }),
}));
