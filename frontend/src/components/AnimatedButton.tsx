import { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = {
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const AnimatedButton = (props: Props) => {
  return (
    <div>
      <button {...props}>Click Me!</button>
    </div>
  );
};

export default AnimatedButton;
