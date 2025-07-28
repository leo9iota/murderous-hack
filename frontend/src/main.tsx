import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAuthClient } from 'better-auth/react';

import ReactDOM from 'react-dom/client';

import { routeTree } from './routeTree.gen';

import './globals.css';

import { Loader2Icon } from 'lucide-react';

import { ErrorInfo } from './components/ErrorInfo';
import { NotFound } from './components/NotFound';

const queryClient = new QueryClient();

// Create Better Auth client
const authClient = createAuthClient({
  baseURL: 'http://localhost:3000/api/auth',
});

// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  context: { queryClient },
  defaultPendingComponent: () => (
    <div className='mx-auto mt-8 flex flex-col items-center justify-center'>
      <Loader2Icon className='animate-spin' />
      <p className='mt-2 text-sm text-muted-foreground'>Loading...</p>
    </div>
  ),
  defaultNotFoundComponent: NotFound,
  defaultErrorComponent: ({ error }) => <ErrorInfo error={error} />,
});

// Register things for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('app')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
