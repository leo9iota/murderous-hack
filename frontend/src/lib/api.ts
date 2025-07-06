import { hc, InferResponseType } from 'hono/client';
import { notFound } from '@tanstack/react-router';
import { queryOptions } from '@tanstack/react-query';

import type {
    ApiRoutes,
    ErrorResponse,
    Order,
    SortBy,
    SuccessResponse,
} from '@/shared/types';

const client = hc<ApiRoutes>('/', {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, {
            ...init,
            credentials: 'include',
        }),
}).api;

export const postSignup = async (username: string, password: string) => {
    try {
        const res = await fetch('/api/auth/sign-up/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                email: `${username}@murderoushack.local`,
                password: password,
                name: username,
            }),
        });

        if (res.ok) {
            const result = await res.json();
            return {
                success: true,
                message: 'Signup successful',
                data: { username: result.user.name },
            } as SuccessResponse;
        }

        const result = await res.json();
        return {
            success: false,
            error: result.message || 'Signup failed',
            isFormError: true,
        } as ErrorResponse;
    } catch (err) {
        return {
            success: false,
            error: String(err),
            isFormError: false,
        } as ErrorResponse;
    }
};

export const postLogin = async (username: string, password: string) => {
    try {
        const res = await fetch('/api/auth/sign-in/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                email: `${username}@murderoushack.local`,
                password: password,
            }),
        });

        if (res.ok) {
            const result = await res.json();
            return {
                success: true,
                message: 'Login successful',
                data: { username: result.user.name },
            } as SuccessResponse;
        }

        const result = await res.json();
        return {
            success: false,
            error: result.message || 'Login failed',
            isFormError: true,
        } as ErrorResponse;
    } catch (err) {
        return {
            success: false,
            error: String(err),
            isFormError: false,
        } as ErrorResponse;
    }
};

export type GetPostsSuccess = InferResponseType<typeof client.posts.$get>;
export const getPosts = async ({
    pageParam = 1,
    pagination,
}: {
    pageParam: number;
    pagination: {
        sortBy?: SortBy;
        order?: Order;
        author?: string;
        site?: string;
    };
}) => {
    const res = await client.posts.$get({
        query: {
            page: pageParam.toString(),
            sortBy: pagination.sortBy,
            order: pagination.order,
            author: pagination.author,
            site: pagination.site,
        },
    });
    if (!res.ok) {
        const data = (await res.json()) as unknown as ErrorResponse;
        throw new Error(data.error);
    }
    const data = await res.json();
    return data;
};

export const getUser = async () => {
    try {
        const res = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include',
        });

        if (res.ok) {
            const result = await res.json();
            return result.data?.username || null;
        }
        return null;
    } catch (err) {
        return null;
    }
};
export const userQueryOptions = () =>
    queryOptions({
        queryKey: ['user'],
        queryFn: getUser,
        staleTime: Infinity,
    });

export async function upvotePost(id: string) {
    const res = await client.posts[':id'].upvote.$post({
        param: {
            id,
        },
    });
    if (res.ok) {
        const data = await res.json();
        return data;
    }
    const data = (await res.json()) as unknown as ErrorResponse;
    throw new Error(data.error);
}

export const postSubmit = async (title: string, url: string, content: string) => {
    try {
        console.log('Submitting post with data:', { title, url, content });

        // Temporary: Use manual fetch instead of Hono client
        const res = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                title,
                url,
                content,
            }),
        });

        console.log('Response status:', res.status);
        if (res.ok) {
            const data = await res.json();
            return data;
        }
        const data = (await res.json()) as unknown as ErrorResponse;
        return data;
    } catch (err) {
        return {
            success: false,
            error: String(err),
            isFormError: false,
        } as ErrorResponse;
    }
};

export const getPost = async (id: number) => {
    const res = await client.posts[':id'].$get({
        param: {
            id: id.toString(),
        },
    });
    if (res.ok) {
        const data = await res.json();
        return data;
    } else {
        if (res.status === 404) {
            throw notFound();
        }
        const data = (await res.json()) as unknown as ErrorResponse;
        throw new Error(data.error);
    }
};

export async function getComments(
    id: number,
    page: number = 1,
    limit: number = 10,
    pagination: {
        sortBy?: SortBy;
        order?: Order;
    },
) {
    const res = await client.posts[':id'].comments.$get({
        param: {
            id: id.toString(),
        },
        query: {
            page: page.toString(),
            limit: limit.toString(),
            includeChildren: 'true',
            sortBy: pagination.sortBy,
            order: pagination.order,
        },
    });

    if (res.ok) {
        const data = await res.json();
        return data;
    } else {
        const data = (await res.json()) as unknown as ErrorResponse;
        throw new Error(data.error);
    }
}

export async function getCommentComments(
    id: number,
    page: number = 1,
    limit: number = 2,
) {
    const res = await client.comments[':id'].comments.$get({
        param: {
            id: id.toString(),
        },
        query: {
            page: page.toString(),
            limit: limit.toString(),
        },
    });
    if (res.ok) {
        const data = await res.json();
        return data;
    } else {
        const data = (await res.json()) as unknown as ErrorResponse;
        throw new Error(data.error);
    }
}

export async function upvoteComment(id: string) {
    const res = await client.comments[':id'].upvote.$post({
        param: {
            id,
        },
    });
    if (res.ok) {
        return await res.json();
    }
    const data = (await res.json()) as unknown as ErrorResponse;
    throw Error(data.error);
}

export async function postComment(id: number, content: string, isNested?: boolean) {
    try {
        const res = isNested
            ? await client.comments[':id'].$post({
                  json: {
                      content,
                  },
                  param: {
                      id: id.toString(),
                  },
              })
            : await client.posts[':id'].comment.$post({
                  json: {
                      content,
                  },
                  param: {
                      id: id.toString(),
                  },
              });

        if (res.ok) {
            return await res.json();
        }
        const data = (await res.json()) as unknown as ErrorResponse;
        return data;
    } catch (err) {
        return {
            success: false,
            error: String(err),
            isFormError: false,
        } as ErrorResponse;
    }
}

export async function deletePost(id: number) {
    try {
        const res = await client.posts[':id'].$delete({
            param: {
                id: id.toString(),
            },
        });

        if (res.ok) {
            const data = await res.json();
            return data;
        }

        const data = (await res.json()) as unknown as ErrorResponse;
        return data;
    } catch (err) {
        return {
            success: false,
            error: String(err),
            isFormError: false,
        } as ErrorResponse;
    }
}

export const postLogout = async () => {
    try {
        await fetch('/api/auth/sign-out', {
            method: 'POST',
            credentials: 'include',
        });
        return { success: true } as SuccessResponse;
    } catch (err) {
        return {
            success: false,
            error: String(err),
            isFormError: false,
        } as ErrorResponse;
    }
};
