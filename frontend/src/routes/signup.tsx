import { createFileRoute } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { fallback, zodSearchValidator } from '@tanstack/router-zod-adapter';

import { z } from 'zod';

import { loginSchema } from '@/shared/types';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const signupSearchSchema = z.object({
  redirect: fallback(z.string(), '/').default('/'),
});

export const Route = createFileRoute('/signup')({
  component: Signup,
  validateSearch: zodSearchValidator(signupSearchSchema),
  // beforeLoad: async ({ context, search }) => {
  //   const user = await context.queryClient.ensureQueryData(userQueryOptions());
  //   if (user) {
  //     throw redirect({ to: search.redirect });
  //   }
  // },
});

function Signup() {
  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    validators: {
      onChange: loginSchema,
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
              Enter your details below to create an account
            </CardDescription>
          </CardHeader>
        </form>
      </Card>
    </div>
  );
}
