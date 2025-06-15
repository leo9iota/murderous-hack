import { drizzle } from 'drizzle-orm/postgres-js';

import postgres from 'postgres';
import { z } from 'zod';

import {
    accounts,
    sessionRelations,
    sessions,
    userRelations,
    users,
    verifications,
} from './db/schemas/auth';
import { commentRelations, comments } from './db/schemas/comments';
import { postRelations, posts } from './db/schemas/posts';
import {
    commentUpvoteRelations,
    commentUpvotes,
    postUpvoteRelations,
    postUpvotes,
} from './db/schemas/upvotes';

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
});

const processEnv = envSchema.parse(process.env);

const queryClient = postgres(processEnv.DATABASE_URL);
export const db = drizzle(queryClient, {
    schema: {
        users: users,
        sessions: sessions,
        accounts: accounts,
        verifications: verifications,
        posts: posts,
        comments: comments,
        postUpvotes: postUpvotes,
        commentUpvotes: commentUpvotes,
        userRelations,
        sessionRelations,
        postRelations,
        commentRelations,
        postUpvoteRelations,
        commentUpvoteRelations,
    },
});
