import { relations } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { comments } from './comments';
import { posts } from './posts';
import { commentUpvotes, postUpvotes } from './upvotes';

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    // Better Auth fields (nullable for existing data)
    email: text('email'),
    emailVerified: boolean('email_verified').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
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
    // Better Auth fields (nullable for existing sessions)
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const sessionRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));
