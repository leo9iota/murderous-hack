import { Lucia } from 'lucia'; // FIXME: Revert to lucia@3.2.1 if errors occur with auth

import { adapter } from './adapter';

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            secure: process.env.NODE_ENV === 'production',
        },
    },
    getUserAttributes: (attr) => {
        return { username: attr.username };
    },
});

declare module 'lucia' {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: { username: string };
    }
}
