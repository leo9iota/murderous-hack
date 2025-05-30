import { hc } from 'hono/client';

import { ErrorResponse, SuccessResponse, type ApiRoutes } from '@/shared/types';

// @ts-expect-error - Hono client type constraint issue with Context type
const client = hc<ApiRoutes>('/', {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, {
            ...init,
            credentials: 'include',
        }),
}).api;

export const postSignup = async (username: string, password: string) => {
    try {
        const res = await client.auth.signup.$post({
            form: {
                username,
                password,
            },
        });
        if (res.ok) {
            const data = (await res.json()) as SuccessResponse;
            return data;
        }
        const data = (await res.json()) as unknown as ErrorResponse;
        return data;
    } catch (err) {
        return {
            success: false as const,
            error: String(err),
            isFormError: false,
        } as ErrorResponse;
    }
};
