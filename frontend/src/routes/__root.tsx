import React from 'react';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { type QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/SiteHeader';

interface RouterContext {
  queryClient: QueryClient;
}

const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import('@tanstack/router-devtools').then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      );

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <div className='flex min-h-screen flex-col bg-[#f5f5ed] text-foreground'>
        <Header />
        <main className='container mx-auto grow p-4'>
          <Outlet />
        </main>
        <footer className='p-4 text-center'>
          <p className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
            <img src='/logo.svg' alt='Murderous Hack' className='size-4' />
            Murderous Hack &copy;
          </p>
        </footer>
      </div>
      <Toaster />
      <ReactQueryDevtools />
      <TanStackRouterDevtools position='bottom-left' />
    </>
  );
}
