import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

import { userTable } from './auth';
import { commentUpvotesTable, postUpvotesTable } from './upvotes';

export const postsTable = pgTable('posts', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(), // IMPORTANT: May want to set this to nullable for soft deleting, like Reddit, where the post of the deleted user account is still there
    title: text('title').notNull(),
    url: text('url'),
    content: text('content'), // Either 'url' or 'content' cannot be null, we don't check this here
    points: integer('points').default(0).notNull(),
    commentCount: integer('comment_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const postRelations = relations(postsTable, ({ one, many }) => ({
    author: one(userTable, {
        fields: [postsTable.userId],
        references: [userTable.id],
        relationName: 'author',
    }),
    postUpvotesTable: many(postUpvotesTable, {
        relationName: 'postUpvotes',
    }),
    comments: many(commentUpvotesTable),
}));
