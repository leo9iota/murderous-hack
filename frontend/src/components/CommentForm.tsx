import { useForm } from '@tanstack/react-form';

import { toast } from 'sonner';

import { commentSchema } from '@/shared/types';
import { useCreateComment } from '@/lib/api-hooks';
import { FieldInfo } from './FieldInfo';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

export function CommentForm({
  id,
  isParent,
  onSuccess,
}: {
  id: number;
  isParent?: boolean;
  onSuccess?: () => void;
}) {
  const createComment = useCreateComment();
  const form = useForm({
    defaultValues: {
      content: '',
    },
    validators: {
      onChange: commentSchema,
    },
    onSubmit: async ({ value }) => {
      await createComment.mutateAsync(
        {
          id,
          content: value.content,
          isParent: !!isParent,
        },
        {
          onSuccess: (data) => {
            if (!data.success) {
              if (!data.isFormError) {
                toast.error('Failed to create comment', {
                  description: data.error,
                });
              }
              form.setErrorMap({
                onSubmit: (data.isFormError
                  ? data.error
                  : 'Unexpected error') as any,
              });
              throw new Error(data.error);
            } else {
              form.reset();
              onSuccess?.();
            }
          },
        },
      );
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
      className='grid gap-2'
    >
      <form.Field
        name='content'
        children={(field) => (
          <div className='grid gap-2'>
            <Textarea
              id={field.name}
              aria-label={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.currentTarget.value)}
              placeholder='What are your thoughts?'
              rows={4}
              className='w-full p-2 text-sm'
            />
            <FieldInfo field={field} />
          </div>
        )}
      />
      <form.Subscribe
        selector={(state) => [state.errorMap]}
        children={([errorMap]) =>
          (errorMap as any).onSubmit ? (
            <p className='text-[0.8rem] font-medium text-destructive'>
              {String((errorMap as any).onSubmit)}
            </p>
          ) : null
        }
      />
      <div className='flex justify-end space-x-2'>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button type='submit' disabled={!canSubmit}>
              {isSubmitting ? '...' : 'Add comment'}
            </Button>
          )}
        />
      </div>
    </form>
  );
}
