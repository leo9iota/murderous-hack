import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
    baseURL: '/api/auth',
});

export const signUp = async (username: string, password: string) => {
    try {
        // Convert username to email format for Better Auth
        const email = `${username}@murderous-hack.local`;

        const result = await authClient.signUp.email({
            email,
            password,
            name: username,
        });

        return {
            success: true,
            message: 'User created',
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Signup failed',
            isFormError: true,
        };
    }
};

export const signIn = async (username: string, password: string) => {
    try {
        // Convert username to email format for Better Auth
        const email = `${username}@murderous-hack.local`;

        const result = await authClient.signIn.email({
            email,
            password,
        });

        return {
            success: true,
            message: 'Logged in',
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Login failed',
            isFormError: true,
        };
    }
};

export const signOut = async () => {
    try {
        await authClient.signOut();
        return {
            success: true,
            message: 'Logged out',
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Logout failed',
            isFormError: false,
        };
    }
};

export const getSession = async () => {
    try {
        const session = await authClient.getSession();
        return session?.user?.username || session?.user?.name || null;
    } catch (error) {
        return null;
    }
};
