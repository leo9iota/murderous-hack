import * as React from 'react';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <div className=''>
        <Outlet />
      </div>
      <ReactQueryDevtools />
      <TanStackRouterDevtools position='bottom-left' />
    </>
  );
}
