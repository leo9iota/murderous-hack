import type { Env } from 'hono';

export interface BetterSession {
    id: string;
    token: string;
    expiresAt: Date;
    userId: string;
}

export interface BetterUser {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
}

export interface BetterContext extends Env {
    Variables: {
        user: BetterUser | null;
        session: BetterSession | null;
    };
}
