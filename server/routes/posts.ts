import { Hono } from 'hono';

import { type Context } from '@/context';
import { loggedIn } from '@/middleware/loggedIn';
import { zValidator } from '@hono/zod-validator';

export const postRouter = new Hono<Context>().post(
    '/',
    loggedIn,
    zValidator('form'),
);
