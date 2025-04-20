import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const commentsTable = pgTable('comments', {
    id: serial().primaryKey(),
    userId: text('user_id').notNull(),
    postId: integer('post_id').notNull(),
    parentCommentId: integer('parent_comment_id'),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    depth: integer('depth').default(0).notNull(),
    commentCount: integer('comment_count').default(0).notNull(),
    points: integer('points').default(0).notNull(),
});
