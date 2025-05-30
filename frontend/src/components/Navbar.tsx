import { Link } from '@tanstack/react-router';

function Navbar() {
  return (
    <header className='sticky top-0 z-50 w-full border-border/40 bg-primary/95 backdrop-blur supports-[backdrop-filter]:bg-primary/90'>
      <div className='container mx-auto flex items-center justify-between p-4'>
        <div className='flex items-center space-x-4'>
          <Link to='/' className='text-2xl font-bold'>
            Murderous Hack
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
            <Link to='/' className='hover:underline'>
              submit
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
