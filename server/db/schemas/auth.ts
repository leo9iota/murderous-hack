import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { comments } from './comments';
import { posts } from './posts';
import { commentUpvotes, postUpvotes } from './upvotes';

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
});

export const userRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
    posts: many(posts, { relationName: 'author' }),
    comments: many(comments, { relationName: 'author' }),
    postUpvotes: many(postUpvotes, {
        relationName: 'userPostUpvotes',
    }),
    commentUpvotes: many(commentUpvotes, {
        relationName: 'userCommentUpvotes',
    }),
}));

export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', {
        withTimezone: true,
        mode: 'date',
    }).notNull(),
});

export const sessionRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));
