import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { ChevronUpIcon, MoreVerticalIcon, Trash2Icon } from 'lucide-react';

import { Post as PostType } from '@/shared/types';
import { userQueryOptions } from '@/lib/api';
import { useDeletePost } from '@/lib/api-hooks';
import { cn, relativeTime } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { badgeVariants } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardTitle } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const Post = ({
  post,
  onUpvote,
}: {
  post: PostType;
  onUpvote?: (id: number) => void;
}) => {
  const { data: user } = useQuery(userQueryOptions());
  const deletePostMutation = useDeletePost();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isOwner = user && post.author.username === user;

  const handleDelete = () => {
    deletePostMutation.mutate(post.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className='flex items-start justify-start pt-3'>
        <button
          onClick={() => {
            onUpvote?.(post.id);
          }}
          className={cn(
            'ml-3 flex flex-col items-center justify-center text-muted-foreground hover:text-primary',
            post.isUpvoted ? 'text-primary' : '',
          )}
          disabled={!user}
        >
          <ChevronUpIcon size={20} />
          <span className='text-xs font-medium'>{post.points}</span>
        </button>
        <div className='flex grow flex-col justify-between'>
          <div className='flex items-start p-3 py-0'>
            <div className='flex grow flex-wrap items-center gap-x-2 pb-1'>
              <CardTitle className='text-xl font-medium'>
                {post.url ? (
                  <a
                    href={post.url}
                    className='text-foreground hover:text-primary hover:underline'
                  >
                    {post.title}
                  </a>
                ) : (
                  <Link
                    to={'/post'}
                    search={{ id: post.id }}
                    className='text-foreground hover:text-primary hover:underline'
                  >
                    {post.title}
                  </Link>
                )}
              </CardTitle>
              {post.url ? (
                <Link
                  className={cn(
                    badgeVariants({ variant: 'secondary' }),
                    'cursor-pointer text-xs font-normal transition-colors hover:bg-primary/80 hover:underline',
                  )}
                  to='/'
                  search={{ site: post.url }}
                >
                  {new URL(post.url).hostname}
                </Link>
              ) : null}
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm' className='size-8 p-0'>
                    <MoreVerticalIcon className='size-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className='text-destructive focus:text-destructive'
                  >
                    <Trash2Icon className='mr-2 size-4' />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <CardContent className='p-3 pt-0'>
            {post.content && (
              <p className='mb-2 text-sm text-foreground'>{post.content}</p>
            )}
            <div className='flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground'>
              <span>
                by{' '}
                <Link
                  className='hover:underline'
                  to={'/'}
                  search={{ author: post.author.id }}
                >
                  {post.author.username}
                </Link>
              </span>
              <span>·</span>
              <span>{relativeTime(post.createdAt)}</span>
              <span>·</span>
              <Link
                to={'/post'}
                search={{ id: post.id }}
                className='hover:underline'
              >
                {post.commentCount} comments
              </Link>
            </div>
          </CardContent>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
