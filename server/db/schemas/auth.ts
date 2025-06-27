import { relations } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { comments } from './comments';
import { posts } from './posts';
import { commentUpvotes, postUpvotes } from './upvotes';

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    username: text('username').unique(), // Made nullable for Better Auth compatibility
    passwordHash: text('password_hash'), // Made nullable for Better Auth compatibility
    // Better Auth fields (nullable for existing data)
    name: text('name'), // Better Auth expects 'name' field
    email: text('email'),
    emailVerified: boolean('email_verified').default(false),
    image: text('image'), // Better Auth expects 'image' field
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
    token: text('token').notNull(), // Better Auth requires this
    expiresAt: timestamp('expires_at', {
        withTimezone: true,
        mode: 'date',
    }).notNull(),
    // Better Auth fields (nullable for existing sessions)
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const sessionRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

// Better Auth requires these additional tables
export const accounts = pgTable('accounts', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    idToken: text('id_token'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const verifications = pgTable('verifications', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
