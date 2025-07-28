import { useState } from 'react';
import { createFileRoute, Link, redirect, useNavigate, useRouter } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { fallback, zodSearchValidator } from '@tanstack/router-zod-adapter';

import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { signupSchema } from '@/shared/types';
import { postSignup, userQueryOptions } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
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
      confirmPassword: '',
    },
    validators: {
      onChange: signupSchema,
    },
    onSubmit: async ({ value }) => {
      setIsPending(true);
      try {
        const res = await postSignup(value.username, value.password);

        if (res.success) {
          await queryClient.invalidateQueries({ queryKey: ['user'] });
          router.invalidate();
          await navigate({ to: search.redirect });
          return null;
        } else {
          if (!res.isFormError) {
            toast.error('Signup failed', { description: res.error });
          }

          form.setErrorMap({
            onSubmit: (res.isFormError ? res.error : 'Unexpected error') as any,
          });
        }
      } catch (error) {
        toast.error('Signup failed', {
          description: 'An unexpected error occurred. Please try again.',
        });
        form.setErrorMap({
          onSubmit: 'An unexpected error occurred. Please try again.' as any,
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
            <CardDescription>Enter your username and password to sign up</CardDescription>
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
                      autoFocus
                      autoComplete='username'
                      disabled={isPending}
                    />
                    <div className='min-h-[0.75rem]'>
                      <FieldInfo field={field} />
                    </div>
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
                      autoComplete='new-password'
                      disabled={isPending}
                    />
                    <div className='min-h-[0.75rem]'>
                      <FieldInfo field={field} />
                    </div>
                  </div>
                )}
              />
              <form.Field
                name='confirmPassword'
                children={(field) => {
                  const passwordValue = form.getFieldValue('password');
                  const confirmValue = field.state.value;
                  const showIcon = passwordValue && confirmValue;
                  const isMatch = passwordValue === confirmValue;
                  const shouldShowField = passwordValue && passwordValue.length >= 3;

                  return (
                    <div
                      className={`overflow-hidden transition-all duration-500 ease-out ${
                        shouldShowField ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className='grid gap-2'>
                        <Label htmlFor={field.name}>Confirm Password</Label>
                        <div className='relative'>
                          <Input
                            type='password'
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            autoComplete='new-password'
                            disabled={isPending || !shouldShowField}
                            className={showIcon ? 'pr-10' : ''}
                          />
                          {showIcon && (
                            <div
                              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out animate-in fade-in zoom-in-50 ${
                                isMatch ? 'text-green-500' : 'text-red-500'
                              }`}
                            >
                              {isMatch ? <Check className='h-4 w-4' /> : <X className='h-4 w-4' />}
                            </div>
                          )}
                        </div>
                        <div className='min-h-[0.75rem]'>
                          {shouldShowField && <FieldInfo field={field} />}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <form.Subscribe
                selector={(state) => [state.errorMap]}
                children={([errorMap]) => {
                  const submitError = errorMap?.onSubmit;
                  return (
                    <div className='min-h-[0.75rem]'>
                      {submitError ? (
                        <p className='text-[0.8rem] font-medium text-destructive'>
                          {typeof submitError === 'string' ? submitError : 'An error occurred'}
                        </p>
                      ) : null}
                    </div>
                  );
                }}
              />
              <form.Subscribe
                selector={(state) => [state.canSubmit]}
                children={([canSubmit]) => (
                  <Button type='submit' disabled={!canSubmit || isPending} className='w-full'>
                    {isPending ? (
                      <div className='flex items-center gap-2'>
                        <Spinner size='sm' />
                        Creating account...
                      </div>
                    ) : (
                      'Signup'
                    )}
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
