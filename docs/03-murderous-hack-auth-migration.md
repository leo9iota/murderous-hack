# Murderous Hack Auth Migration

**Project**: Murderous Hack  
**Estimated Time**: 2-4 hours  
**Complexity**: Low-Medium  
**Status**: Ready for Migration ✅

## 📋 Migration Overview

This document outlines the complete migration from Lucia v2 to Better Auth for the Murderous Hack project. The migration is straightforward due to our clean, minimal auth implementation.

### Current State Analysis
- ✅ Simple username/password authentication only
- ✅ Clean database schema (users + sessions tables)
- ✅ Well-organized auth code (isolated in proper modules)
- ✅ Standard patterns (no complex custom logic)
- ✅ Modern stack (Hono + Drizzle + TypeScript)

### Migration Benefits
- Better developer experience and TypeScript support
- More features out of the box
- Active maintenance and community
- Future-proofing and better documentation

---

## 🚀 Phase 1: Preparation & Setup (15-20 minutes)

### 1.1 Create Backup & Branch (5 min)
```bash
# Create backup branch
git checkout -b backup/lucia-v2-working
git push origin backup/lucia-v2-working

# Create migration branch
git checkout main
git checkout -b feature/migrate-to-better-auth
```

### 1.2 Document Current State (5 min)
- Take screenshots of working login/signup flows
- Note current database schema structure
- Document any custom auth logic (minimal in our case)

### 1.3 Install Better Auth Dependencies (5-10 min)
```bash
# Remove Lucia dependencies
bun remove lucia @lucia-auth/adapter-drizzle

# Install Better Auth
bun add better-auth
cd frontend && bun add better-auth
```

### 1.4 Review Better Auth Documentation (5 min)
- Quick review of Better Auth Hono integration
- Check Drizzle adapter documentation
- Review session management differences

---

## 🔧 Phase 2: Backend Migration (1.5-2.5 hours)

### 2.1 Update Database Schema (30-45 min)

**Current Lucia Schema:**
```typescript
// server/db/schemas/auth.ts - CURRENT
export const users = pgTable('users', {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
});

export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
```

**New Better Auth Schema:**
```typescript
// server/db/schemas/auth.ts - NEW
export const users = pgTable('users', {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    email: text('email'), // Better Auth expects email field
    emailVerified: boolean('email_verified').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    expiresAt: timestamp('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow(),
});
```

**Action Items:**
- [ ] Update `server/db/schemas/auth.ts` with new schema
- [ ] Run `bun run db:push` to update database
- [ ] Verify schema changes in database

### 2.2 Replace Lucia Configuration (20-30 min)

**Remove:** `server/lucia.ts`

**Create:** `server/auth.ts`
```typescript
// server/auth.ts - NEW FILE
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./adapter";
import { users, sessions } from "./db/schemas/auth";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: users,
            session: sessions,
        },
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Keep simple for now
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24 * 7, // 7 days
        },
    },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```

**Action Items:**
- [ ] Delete `server/lucia.ts`
- [ ] Create `server/auth.ts` with Better Auth config
- [ ] Update imports throughout codebase

### 2.3 Update Server Context (15 min)

**Update:** `server/context.ts`
```typescript
// server/context.ts - UPDATED
import type { Env } from 'hono';
import type { Session, User } from './auth';

export interface Context extends Env {
    Variables: {
        user: User | null;
        session: Session | null;
    };
}
```

**Action Items:**
- [ ] Update `server/context.ts` with new types
- [ ] Remove Lucia type imports

### 2.4 Update Database Adapter (10 min)

**Update:** `server/adapter.ts`
```typescript
// server/adapter.ts - UPDATED (remove Lucia adapter)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';

// Remove this line:
// import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';

// Remove this line:
// export const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

// Keep everything else the same
```

**Action Items:**
- [ ] Remove Lucia adapter import and export
- [ ] Keep database connection and schema exports

### 2.5 Update Authentication Middleware (20-30 min)

**Create:** `server/middleware/auth.ts`
```typescript
// server/middleware/auth.ts - NEW FILE
import { createMiddleware } from 'hono/factory';
import { auth } from '../auth';
import type { Context } from '../context';

export const authMiddleware = createMiddleware<Context>(async (c, next) => {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (session) {
        c.set('user', session.user);
        c.set('session', session.session);
    } else {
        c.set('user', null);
        c.set('session', null);
    }

    await next();
});

export const requireAuth = createMiddleware<Context>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
});
```

**Update:** `server/middleware/loggedIn.ts`
```typescript
// server/middleware/loggedIn.ts - UPDATED
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { Context } from '@/context';

export const loggedIn = createMiddleware<Context>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }
    await next();
});
```

**Action Items:**
- [ ] Create new `server/middleware/auth.ts`
- [ ] Update `server/middleware/loggedIn.ts` (minimal changes)
- [ ] Test middleware functionality

### 2.6 Update Main Server File (15-20 min)

**Update:** `server/index.ts`
```typescript
// server/index.ts - UPDATED
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';

import { type ErrorResponse } from '@/shared/types';
import type { Context } from './context';
import { authMiddleware } from './middleware/auth'; // NEW
import { authRouter } from './routes/auth';
import { commentsRouter } from './routes/comments';
import { postRouter } from './routes/posts';

const app = new Hono<Context>();

// Replace Lucia middleware with Better Auth middleware
app.use('*', cors(), authMiddleware);

// Rest of the file remains the same...
const routes = app
    .basePath('/api')
    .route('/auth', authRouter)
    .route('/posts', postRouter)
    .route('/comments', commentsRouter);

// ... rest of server setup
```

**Action Items:**
- [ ] Replace Lucia session middleware with Better Auth middleware
- [ ] Remove Lucia imports
- [ ] Test server startup

### 2.7 Migrate Authentication Routes (45-60 min)

**Update:** `server/routes/auth.ts`
```typescript
// server/routes/auth.ts - MAJOR UPDATE
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';

import type { Context } from '@/context';
import { auth } from '@/auth';
import { loggedIn } from '@/middleware/loggedIn';
import { loginSchema, type SuccessResponse } from '@/shared/types';

export const authRouter = new Hono<Context>()
    .post('/signup', zValidator('form', loginSchema), async (c) => {
        const { username, password } = c.req.valid('form');

        try {
            const result = await auth.api.signUpEmail({
                body: {
                    email: `${username}@murderoushack.local`, // Fake email for username-only auth
                    password,
                    name: username,
                },
                headers: c.req.raw.headers,
            });

            if (result.error) {
                throw new HTTPException(400, {
                    message: result.error.message,
                    cause: { form: true },
                });
            }

            // Set session cookie
            const sessionCookie = result.headers?.get('set-cookie');
            if (sessionCookie) {
                c.header('Set-Cookie', sessionCookie);
            }

            return c.json<SuccessResponse>({
                success: true,
                message: 'User created',
            }, 201);
        } catch (error) {
            if (error instanceof HTTPException) throw error;
            throw new HTTPException(500, { message: 'Failed to create user' });
        }
    })
    .post('/login', zValidator('form', loginSchema), async (c) => {
        const { username, password } = c.req.valid('form');

        try {
            const result = await auth.api.signInEmail({
                body: {
                    email: `${username}@murderoushack.local`,
                    password,
                },
                headers: c.req.raw.headers,
            });

            if (result.error) {
                throw new HTTPException(401, {
                    message: 'Invalid credentials',
                    cause: { form: true },
                });
            }

            // Set session cookie
            const sessionCookie = result.headers?.get('set-cookie');
            if (sessionCookie) {
                c.header('Set-Cookie', sessionCookie);
            }

            return c.json<SuccessResponse>({
                success: true,
                message: 'Logged in',
            }, 200);
        } catch (error) {
            if (error instanceof HTTPException) throw error;
            throw new HTTPException(500, { message: 'Login failed' });
        }
    })
    .get('/logout', async (c) => {
        try {
            const result = await auth.api.signOut({
                headers: c.req.raw.headers,
            });

            // Clear session cookie
            const sessionCookie = result.headers?.get('set-cookie');
            if (sessionCookie) {
                c.header('Set-Cookie', sessionCookie);
            }

            return c.redirect('/');
        } catch (error) {
            return c.redirect('/');
        }
    })
    .get('/user', loggedIn, async (c) => {
        const user = c.get('user')!;
        return c.json<SuccessResponse<{ username: string }>>({
            success: true,
            message: 'User fetched',
            data: { username: user.name || user.email.split('@')[0] },
        });
    });
```

**Action Items:**
- [ ] Replace all Lucia auth calls with Better Auth API calls
- [ ] Update signup logic to handle username-as-email pattern
- [ ] Update login logic with Better Auth
- [ ] Update logout logic
- [ ] Update user endpoint
- [ ] Test all auth endpoints

---

## 🎨 Phase 3: Frontend Updates (30-60 minutes)

### 3.1 Update API Client (15-20 min)

**Update:** `frontend/src/lib/api.ts`
```typescript
// frontend/src/lib/api.ts - MINIMAL CHANGES
// Most of the file stays the same, just update error handling if needed

export const postSignup = async (username: string, password: string) => {
    try {
        const res = await client.auth.signup.$post({
            form: {
                username,
                password,
            },
        });
        // Rest stays the same...
    } catch (e) {
        return {
            success: false,
            error: String(e),
            isFormError: false,
        } as ErrorResponse;
    }
};

// postLogin function stays mostly the same
// getUser function may need minor updates
```

**Action Items:**
- [ ] Test API calls still work
- [ ] Update error handling if needed
- [ ] Verify cookie handling works

### 3.2 Test Frontend Auth Flows (15-20 min)

**Test Checklist:**
- [ ] Signup flow works
- [ ] Login flow works
- [ ] Logout flow works
- [ ] Protected routes work
- [ ] User session persists on refresh
- [ ] Error handling works properly

### 3.3 Update TypeScript Types (10-15 min)

**Update types if needed:**
- [ ] Check if any frontend types need updating
- [ ] Update user interface if structure changed
- [ ] Verify all TypeScript errors are resolved

---

## 🧹 Phase 4: Cleanup & Testing (30-60 minutes)

### 4.1 Remove Lucia Dependencies (10 min)
```bash
# Verify Lucia is completely removed
bun remove lucia @lucia-auth/adapter-drizzle
cd frontend && bun remove lucia

# Clean up any remaining imports
grep -r "lucia" server/ frontend/ --exclude-dir=node_modules
```

### 4.2 Database Migration & Cleanup (15-20 min)
```bash
# Push final schema changes
bun run db:push

# Verify database structure
# Check that new columns exist and old sessions still work
```

### 4.3 Comprehensive Testing (20-30 min)

**Backend Testing:**
- [ ] Server starts without errors
- [ ] All auth endpoints respond correctly
- [ ] Database connections work
- [ ] Session management works
- [ ] Protected routes work

**Frontend Testing:**
- [ ] Login page works
- [ ] Signup page works
- [ ] Logout works
- [ ] Protected pages work
- [ ] Session persistence works
- [ ] Error states work

**Integration Testing:**
- [ ] Full user journey: signup → login → use app → logout
- [ ] Session expiration handling
- [ ] Error scenarios (wrong password, etc.)

### 4.4 Final Code Review (10 min)
- [ ] Remove any commented-out Lucia code
- [ ] Clean up unused imports
- [ ] Verify all TypeScript errors resolved
- [ ] Check for any console errors

---

## 📚 Reference Information

### Key Differences: Lucia vs Better Auth

| Aspect | Lucia v2 | Better Auth |
|--------|----------|-------------|
| **Session Creation** | `lucia.createSession()` | `auth.api.signInEmail()` |
| **Session Validation** | `lucia.validateSession()` | `auth.api.getSession()` |
| **User Creation** | Manual DB insert + session | `auth.api.signUpEmail()` |
| **Logout** | `lucia.invalidateSession()` | `auth.api.signOut()` |
| **Middleware** | Custom session reading | Built-in middleware |
| **Types** | Custom interfaces | Generated types |

### Rollback Plan

If migration fails:
1. `git checkout backup/lucia-v2-working`
2. `bun run db:push` (restore old schema)
3. `bun install` (restore dependencies)
4. Test that everything works

### Post-Migration Enhancements

After successful migration, consider:
- [ ] Add email verification
- [ ] Add password reset functionality
- [ ] Add OAuth providers (Google, GitHub)
- [ ] Add 2FA support
- [ ] Add session management UI

---

## 🎯 Success Criteria

Migration is complete when:
- ✅ All auth flows work (signup, login, logout)
- ✅ Protected routes work correctly
- ✅ Sessions persist across browser refreshes
- ✅ No TypeScript errors
- ✅ No console errors
- ✅ Database schema is updated
- ✅ All tests pass
- ✅ Lucia dependencies removed

**Estimated Total Time: 2-4 hours**
**Risk Level: Low** (due to simple auth requirements)
**Rollback Time: 15 minutes** (if needed)
