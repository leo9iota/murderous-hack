import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

import { users } from './auth';
import { comments } from './comments';
import { postUpvotes } from './upvotes';

export const posts = pgTable('posts', {
    id: serial('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    url: text('url'),
    content: text('content'),
    points: integer('points').default(0).notNull(),
    commentCount: integer('comment_count').default(0).notNull(),
    createdAt: timestamp('created_at', {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
});

export const insertPostSchema = createInsertSchema(posts, {
    title: z
        .string()
        .min(3, { message: 'Title must be at least 3 characters long' }),
    url: z.preprocess(
        (val: unknown) => (val === '' ? undefined : val),
        z
            .string()
            .trim()
            .url({ message: 'URL must be valid' })
            .optional(),
    ),
    content: z.string().optional(),
});

export const postRelations = relations(posts, ({ one, many }) => ({
    author: one(users, {
        fields: [posts.userId],
        references: [users.id],
        relationName: 'author',
    }),
    postUpvotesTable: many(postUpvotes, { relationName: 'postUpvotes' }),
    comments: many(comments),
}));
