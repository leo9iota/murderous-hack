import { createFileRoute } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { fallback, zodSearchValidator } from '@tanstack/router-zod-adapter';

import z from 'zod';

import { loginSchema } from '@/shared/types';
import { Card } from '@/components/ui/card';

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
  });

  return (
    <div className='w-full'>
      <Card className='mx-auto mt-12 max-w-sm border-border/25'>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit()
          }}
        ></form>
      </Card>
    </div>
  );
}

export default Signup;
