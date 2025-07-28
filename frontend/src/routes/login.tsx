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

import { toast } from 'sonner';
import { z } from 'zod';

import { loginSchema } from '@/shared/types';
import { signIn } from '@/lib/auth-client';
import { postLogin, userQueryOptions } from '@/lib/api';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { FieldInfo } from '@/components/FieldInfo';

const loginSearchSchema = z.object({
  redirect: fallback(z.string(), '/').default('/'),
});

export const Route = createFileRoute('/login')({
  component: () => <Login />,
  validateSearch: zodSearchValidator(loginSearchSchema),
  beforeLoad: async ({ context, search }) => {
    const user = await context.queryClient.ensureQueryData(userQueryOptions());
    if (user) {
      throw redirect({ to: search.redirect });
    }
  },
});

function Login() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    validators: {
      onChange: loginSchema,
    },

    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const res = await postLogin(value.username, value.password);

        if (res.success) {
          // Store remember me preference if needed
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }
          
          await queryClient.invalidateQueries({ queryKey: ['user'] });
          router.invalidate();
          await navigate({ to: search.redirect });
          return null;
        } else {
          if (!res.isFormError) {
            toast.error('Login failed', { description: res.error });
          }

          form.setErrorMap({
            onSubmit: (res.isFormError ? res.error : 'Unexpected error') as any,
          });
        }
      } catch (error) {
        toast.error('Login failed', { 
          description: 'An unexpected error occurred. Please try again.' 
        });
        form.setErrorMap({
          onSubmit: 'An unexpected error occurred. Please try again.' as any,
        });
      } finally {
        setIsSubmitting(false);
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
            <CardTitle className='text-center text-2xl'>Login</CardTitle>
            <CardDescription>
              Enter your username and password to log in
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
                      autoFocus
                      autoComplete="username"
                      disabled={isSubmitting}
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
                      autoComplete="current-password"
                      disabled={isSubmitting}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember-me" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={isSubmitting}
                  />
                  <Label 
                    htmlFor="remember-me" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
                <button 
                  type="button"
                  onClick={() => toast.info('Password reset feature coming soon!')}
                  className="text-sm text-primary hover:underline bg-transparent border-none cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <form.Subscribe
                selector={(state) => [state.errorMap]}
                children={([errorMap]) => {
                  const submitError = errorMap?.onSubmit;
                  return submitError ? (
                    <p className='text-[0.8rem] font-medium text-destructive'>
                      {String(submitError)}
                    </p>
                  ) : null;
                }}
              />
              
              <form.Subscribe
                selector={(state) => [state.canSubmit]}
                children={([canSubmit]) => (
                  <Button 
                    type='submit' 
                    disabled={!canSubmit || isSubmitting} 
                    className='w-full'
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Spinner size="sm" />
                        Logging in...
                      </div>
                    ) : (
                      'Login'
                    )}
                  </Button>
                )}
              />
            </div>
            <div className='mt-4 text-center text-sm'>
              Don't have an account?{' '}
              <Link to='/signup' className='underline'>
                Sign up
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
