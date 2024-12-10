// Zod Schema and TS Types

export type SuccessResponse<T = void> = {
    success: true;
    message: string;
} & (T extends void ? {} : { data: T });

// const data: SuccessResponse = {
//     success: true,
//     message: 'Post created',
//     data: { id: 1 },
// };

export type ErrorResponse = {
    success: false;
    error: string;
    isFormError?: boolean;
}
