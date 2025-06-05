import { createFileRoute } from '@tanstack/react-router';

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

export const Route = createFileRoute('/signup')({
  component: Signup,
});

function Signup() {
  return (
    <div className='w-full'>
      <Card className='mx-auto mt-12 max-w-sm border-border/25'>
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create a new account to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='username'>Username</Label>
              <Input
                id='username'
                name='username'
                placeholder='Enter your username'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                name='password'
                type='password'
                placeholder='Enter your password'
              />
            </div>
            <Button type='submit' className='w-full'>
              Sign Up
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
