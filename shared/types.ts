import { insertPostSchema } from '@/db/schemas/posts';
import { z } from 'zod';

export type SuccessResponse<T = void> = {
    success: true;
    message: string;
} & (T extends void ? {} : { data: T });

export type ErrorResponse = {
    success: false;
    error: string;
    isFormError?: boolean;
};

export const loginSchema = z.object({
    username: z
        .string()
        .min(3)
        .max(31)
        .regex(/^[a-zA-Z0-9_]+$/),
    password: z.string().min(3).max(255),
});

export const createPostSchema = insertPostSchema
    .pick({
        title: true,
        url: true,
        content: true,
    })
    .refine((data) => data.url || data.content, {
        message: 'Either URL or content must be provided',
        path: ['url', 'content'],
    });

export const sortBySchema = z.enum(['points', 'recent']);
export const orderSchema = z.enum(['asc', 'desc']);

// Pagination schema
export const paginationSchema = z.object({
    limit: z.number({ coerce: true }).optional().default(10),
    page: z.number({ coerce: true }).optional().default(1),
    sortBy: sortBySchema.optional().default('points'),
    order: orderSchema.optional().default('desc'),
    author: z.string().optional(),
    site: z.string().optional(),
});

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

export type PaginatedResponse<T> = {
    pagination: {
        page: number;
        totalPages: number;
    };
    data: T;
} & Omit<SuccessResponse, 'data'>;
