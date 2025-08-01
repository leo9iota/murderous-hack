import {
  createFileRoute,
  useBlocker,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';

import { toast } from 'sonner';

import { postSubmit } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FieldInfo } from '@/components/FieldInfo';

export const Route = createFileRoute('/_auth/submit')({
  component: () => <Submit />,
});

function Submit() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      title: '',
      content: '',
      url: '',
    },

    onSubmit: async ({ value }) => {
      const res = await postSubmit(value.title, value.url, value.content);

      if (res.success) {
        await queryClient.invalidateQueries({ queryKey: ['posts'] });
        router.invalidate();
        await navigate({ to: '/post', search: { id: res.data.postId } });
        return;
      } else {
        if (!res.isFormError)
          toast.error('Failed to create post', { description: res.error });

        form.setErrorMap({
          onSubmit: (res.isFormError ? res.error : 'Unexpected error') as any,
        });
      }
    },
  });

  const shouldBlock = useStore(
    form.store,
    (state) => state.isDirty && !state.isSubmitting,
  );
  useBlocker({
    condition: shouldBlock,
    blockerFn: () => window.confirm('Are you sure you want to leave?'),
  });

  return (
    <div className='w-full'>
      <Card className='mx-auto mt-12 max-w-lg border-border/25'>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
          <CardDescription>
            Leave the URL field empty to submit a question.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
          className='grid gap-4'
        >
          <CardContent>
            <div className='grid gap-4'>
              <form.Field
                name='title'
                children={(field) => (
                  <div className='grid gap-2'>
                    <Label htmlFor={field.name}>Title</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />
              <form.Field
                name='url'
                children={(field) => (
                  <div className='grid gap-2'>
                    <Label htmlFor={field.name}>URL</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />
              <form.Field
                name='content'
                children={(field) => (
                  <div className='grid gap-2'>
                    <Label htmlFor={field.name}>Content</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
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
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button type='submit' disabled={!canSubmit} className='w-full'>
                    {isSubmitting ? '...' : 'Submit'}
                  </Button>
                )}
              />
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
