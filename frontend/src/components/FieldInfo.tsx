import { AnyFieldApi } from '@tanstack/react-form';

export function FieldInfo({ field }: { field: AnyFieldApi }) {
  const formatError = (error: any): string => {
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && error.message) {
      return error.message;
    }
    return String(error);
  };

  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className='text-[0.8rem] font-medium text-destructive'>
          {field.state.meta.errors.map(formatError).join(', ')}
        </p>
      ) : null}
    </>
  );
}
