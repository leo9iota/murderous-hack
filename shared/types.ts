import { z } from 'zod';

import type { ApiRoutes } from '../server/index';

export { type ApiRoutes };

/**
 * Type definitions
 * Stuff that the API (server) returns to the user (client).
 */
export type SuccessResponse<T = void> = {
    success: true;
    message: string;
} & (T extends void ? {} : { data: T });

export type ErrorResponse = {
    success: false;
    error: string;
    isFormError?: boolean;
};

export type Post = {
    id: number;
    title: string;
    url: string | null;
    content: string | null;
    points: number;
    createdAt: string;
    commentCount: number;
    author: {
        id: string;
        username: string;
    };
    isUpvoted: boolean;
};

export type Comment = {
    id: number;
    userId: string;
    content: string;
    points: number;
    depth: number;
    commentCount: number;
    createdAt: string;
    postId: number;
    parentCommentId: number | null;
    commentUpvotes: {
        userId: string;
    }[];
    author: {
        username: string;
        id: string;
    };
    childComments?: Comment[];
};

export type SortBy = z.infer<typeof sortSchema>;
export type Order = z.infer<typeof orderSchema>;

export type PaginatedResponse<T> = {
    pagination: {
        page: number;
        totalPages: number;
    };
    data: T;
} & Omit<SuccessResponse, 'data'>;


/**
 * Schemas
 * Validation of user input
 */
export const loginSchema = z.object({
    username: z
        .string()
        .min(3, { message: 'Username must be at least 3 characters long.' })
        .max(31, { message: 'Username must be no longer than 31 characters.' })
        .regex(/^[a-zA-Z0-9_]+$/, {
            message: 'Username can contain only letters, numbers and underscores.',
        }),
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long.' })
        .max(255, { message: 'Password is too long.' }),
});

export const postSchema = z
    .object({
        title: z
            .string()
            .min(3, { message: 'Title must be at least 3 characters long' }),
        url: z.preprocess(
            (val: unknown) => (val === '' ? undefined : val),
            z.string().trim().url({ message: 'URL must be a valid URL' }).optional(),
        ),
        content: z.string().optional(),
    })
    .refine(
        (data: { url?: string; content?: string }) => !!data.url || !!data.content,
        {
            message: 'Either URL or content must be provided',
            path: ['url'],
        },
    );

export const commentSchema = z.object({
    content: z
        .string()
        .min(3, { message: 'Comment must be at least 3 characters long' }),
});

export const sortSchema = z.enum(['points', 'recent']);
export const orderSchema = z.enum(['asc', 'desc']);

export const paginationSchema = z.object({
    limit: z.number({ coerce: true }).optional().default(10),
    page: z.number({ coerce: true }).optional().default(1),
    sortBy: sortSchema.optional().default('points'),
    order: orderSchema.optional().default('desc'),
    author: z.optional(z.string()),
    site: z.string().optional(),
});

export const paramSchema = z.object({
    id: z.coerce.number(),
});
