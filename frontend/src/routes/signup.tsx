import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/signup')({
  component: Signup,
});

function Signup() {
  return(
    <div>
      Hello World!
    </div>
  )
}

export default Signup;
