import { Lucia } from 'lucia'; // TODO: Revert to lucia@3.2.1 if errors occur with auth

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            secure: process.env.NODE_ENV === 'production'
        }
    }
})

declare module 'lucia' {
    interface Register {
        Lucia: typeof lucia;
    }
}