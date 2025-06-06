import type { Env } from 'hono';

export interface Session {
    id: string;
    token: string;
    expiresAt: Date;
    userId: string;
}

export interface User {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
}

export interface Context extends Env {
    Variables: {
        user: User | null;
        session: Session | null;
    };
}
