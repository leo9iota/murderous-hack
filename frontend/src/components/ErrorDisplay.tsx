import { AlertTriangleIcon } from 'lucide-react';

import { Alert } from './ui/alert';

function ErrorDisplay({ error }: { error: Error }) {
  return (
    <div className='mt-8 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <Alert variant='destructive'>
          <AlertTriangleIcon />
        </Alert>
      </div>
    </div>
  );
}

export default ErrorDisplay;
