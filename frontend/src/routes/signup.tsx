import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { fallback, zodSearchValidator } from '@tanstack/router-zod-adapter';

import { toast } from 'sonner';
import { z } from 'zod';

import { loginSchema } from '@/shared/client-types';
import { postSignup } from '@/lib/api';
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

const signupSearchSchema = z.object({
  redirect: fallback(z.string(), '/').default('/'),
});

export const Route = createFileRoute('/signup')({
  component: RouteComponent,
  validateSearch: zodSearchValidator(signupSearchSchema),
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await postSignup(value.username, value.password);

      if (result.success) {
        toast.success(result.message);
        navigate({ to: search.redirect });
      } else {
        toast.error(result.error);
      }
    },
  });

  return (
    <div className='w-full'>
      <Card className='mx-auto mt-12 max-w-sm border-border/25'>
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create a new account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
            className='space-y-4'
          >
            <form.Field
              name='username'
              children={(field) => (
                <div className='space-y-2'>
                  <Label htmlFor={field.name}>Username</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder='Enter your username'
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className='text-sm text-destructive'>
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            />

            <form.Field
              name='password'
              children={(field) => (
                <div className='space-y-2'>
                  <Label htmlFor={field.name}>Password</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type='password'
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder='Enter your password'
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className='text-sm text-destructive'>
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            />

            <Button
              type='submit'
              className='w-full'
              disabled={form.state.isSubmitting}
            >
              {form.state.isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
