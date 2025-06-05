import { createFileRoute } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { fallback, zodSearchValidator } from '@tanstack/router-zod-adapter';

import z from 'zod';

import { loginSchema } from '@/shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const signupSearchSchema = z.object({
  redirect: fallback(z.string(), '/').default('/'),
});

export const Route = createFileRoute('/signup')({
  component: Signup,
  validateSearch: zodSearchValidator(signupSearchSchema),
});

function Signup() {
  const search = Route.useSearch();
  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      // TODO: Implement signup logic
      console.log('Signup form submitted:', value);
    },
  });

  return (
    <div className='w-full'>
      <Card className='mx-auto mt-12 max-w-sm border-border/25'>
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>
            Create a new account to get started.
          </CardDescription>
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
              name="username"
              children={(field) => (
                <div className='space-y-2'>
                  <Label htmlFor={field.name}>Username</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter your username"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className='text-sm text-destructive'>
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            />
            <form.Field
              name="password"
              children={(field) => (
                <div className='space-y-2'>
                  <Label htmlFor={field.name}>Password</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter your password"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className='text-sm text-destructive'>
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            />
            <Button type="submit" className='w-full'>
              Sign Up
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Signup;
