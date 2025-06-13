import { drizzle } from 'drizzle-orm/postgres-js';

import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import postgres from 'postgres';
import { z } from 'zod';

import { sessionRelations, sessions, userRelations, users } from './db/schemas/auth';
import { commentRelations, comments } from './db/schemas/comments';
import { postRelations, posts } from './db/schemas/posts';
import {
    commentUpvoteRelations,
    commentUpvotes,
    postUpvoteRelations,
    postUpvotes,
} from './db/schemas/upvotes';

const EnvSchema = z.object({
    DATABASE_URL: z.string().url(),
});

const processEnv = EnvSchema.parse(process.env);

const queryClient = postgres(processEnv.DATABASE_URL);
export const db = drizzle(queryClient, {
    schema: {
        // Tables
        users: users,
        sessions: sessions,
        posts: posts,
        comments: comments,
        postUpvotes: postUpvotes,
        commentUpvotes: commentUpvotes,
        // Relations
        userRelations,
        sessionRelations,
        postRelations,
        commentRelations,
        postUpvoteRelations,
        commentUpvoteRelations,
    },
});

export const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);
