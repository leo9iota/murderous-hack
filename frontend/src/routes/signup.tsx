import { useState } from 'react';
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { fallback, zodSearchValidator } from '@tanstack/router-zod-adapter';
import { signUp } from '@/lib/auth-client';

import { toast } from 'sonner';
import { z } from 'zod';

import { loginSchema } from '@/shared/types';
import { userQueryOptions } from '@/lib/api';
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
import { FieldInfo } from '@/components/FieldInfo';

const signupSearchSchema = z.object({
  redirect: fallback(z.string(), '/').default('/'),
});
export const Route = createFileRoute('/signup')({
  component: () => <Signup />,
  validateSearch: zodSearchValidator(signupSearchSchema),
  beforeLoad: async ({ context, search }) => {
    const user = await context.queryClient.ensureQueryData(userQueryOptions());
    if (user) {
      throw redirect({ to: search.redirect });
    }
  },
});

function Signup() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [isPending, setIsPending] = useState(false);

  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setIsPending(true);
      try {
        const result = await signUp.email({
          email: `${value.username}@murderoushack.local`,
          password: value.password,
          name: value.username,
        });
        
        if (result.error) {
          throw new Error(result.error.message);
        }
        
        router.invalidate();
        await navigate({ to: search.redirect });
      } catch (err: any) {
        const errorMessage = err?.message || 'Signup failed';
        toast.error('Signup failed', { description: errorMessage });
        form.setErrorMap({
          onSubmit: errorMessage,
        });
      } finally {
        setIsPending(false);
      }
    },
  });
  return (
    <div className='w-full'>
      <Card className='mx-auto mt-12 max-w-sm border-border/25'>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <CardHeader>
            <CardTitle className='text-center text-2xl'>Signup</CardTitle>
            <CardDescription>
              Enter your username and password to sign up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4'>
              <form.Field
                name='username'
                children={(field) => (
                  <div className='grid gap-2'>
                    <Label htmlFor={field.name}>Username</Label>
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
                name='password'
                children={(field) => (
                  <div className='grid gap-2'>
                    <Label htmlFor={field.name}>Password</Label>
                    <Input
                      type='password'
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
                selector={(state) => [state.canSubmit]}
                children={([canSubmit]) => (
                  <Button type='submit' disabled={!canSubmit || isPending} className='w-full'>
                    {isPending ? '...' : 'Signup'}
                  </Button>
                )}
              />
            </div>
            <div className='mt-4 text-center text-sm'>
              Already have an account?{' '}
              <Link to='/login' className='underline'>
                Log in
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
