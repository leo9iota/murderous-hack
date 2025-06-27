import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { MenuIcon } from 'lucide-react';

import { userQueryOptions } from '@/lib/api';
import { useLogout } from '@/lib/api-hooks';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: user } = useQuery(userQueryOptions());
  const { mutate: logout } = useLogout();

  return (
    <header className='bg-mh-primary/95 supports-backdrop-filter:bg-mh-primary/90 sticky top-0 z-50 w-full border-border/40 backdrop-blur-sm'>
      <div className='container mx-auto flex items-center justify-between p-4'>
        <div className='flex items-center space-x-4'>
          <Link to='/' className='flex items-center'>
            <img src='/logo.svg' alt='Murderous Hack' className='size-10' />
          </Link>
          <nav className='hidden items-center space-x-4 md:flex'>
            <Link
              to={'/'}
              search={{ sortBy: 'recent', order: 'desc' }}
              className='hover:underline'
            >
              new
            </Link>
            <Link
              className='hover:underline'
              to={'/'}
              search={{ sortBy: 'points', order: 'desc' }}
            >
              top
            </Link>
            <Link to='/submit' className='hover:underline'>
              submit
            </Link>
          </nav>
        </div>
        <div className='hidden items-center space-x-4 md:flex'>
          {user ? (
            <>
              <span>{user}</span>
              <Button
                size='sm'
                variant='secondary'
                onClick={() => logout()}
                className='bg-secondary-foreground text-primary-foreground hover:bg-secondary-foreground/70'
              >
                Log out
              </Button>
            </>
          ) : (
            <Button
              asChild
              size='sm'
              variant='secondary'
              className='bg-secondary-foreground text-primary-foreground hover:bg-secondary-foreground/70'
            >
              <Link to='/login'>Log in</Link>
            </Button>
          )}
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant='secondary' size='icon' className='md:hidden'>
              <MenuIcon className='size-6' />
            </Button>
          </SheetTrigger>
          <SheetContent className='mb-2'>
            <SheetHeader>
              <SheetTitle className='flex items-center gap-2'>
                <img src='/logo.svg' alt='Murderous Hack' className='size-6' />
                Murderous Hack
              </SheetTitle>
              <SheetDescription className='sr-only'>Navigation</SheetDescription>
            </SheetHeader>
            <nav className='flex flex-col space-y-4'>
              <Link
                onClick={() => setIsOpen(false)}
                className='hover:underline'
                to={'/'}
                search={{ sortBy: 'recent', order: 'desc' }}
              >
                new
              </Link>
              <Link
                onClick={() => setIsOpen(false)}
                className='hover:underline'
                to={'/'}
                search={{ sortBy: 'points', order: 'desc' }}
              >
                top
              </Link>
              <Link
                onClick={() => setIsOpen(false)}
                className='hover:underline'
                to='/submit'
              >
                submit
              </Link>
              {user ? (
                <>
                  <span>user: {user}</span>
                  <Button
                    size='sm'
                    variant='secondary'
                    onClick={() => logout()}
                    className='bg-secondary-foreground text-primary-foreground hover:bg-secondary-foreground/70'
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  size='sm'
                  variant='secondary'
                  className='bg-secondary-foreground text-primary-foreground hover:bg-secondary-foreground/70'
                >
                  <Link onClick={() => setIsOpen(false)} to='/login'>
                    Log in
                  </Link>
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
