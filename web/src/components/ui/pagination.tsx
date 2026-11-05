import type { ComponentProps } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from 'cn';

import { Button } from '@/components/ui/button';

function Pagination({ className, ...props }: ComponentProps<'nav'>) {
  return (
    <nav
      aria-label="Pagination"
      data-slot="pagination"
      className={cn('cn-pagination mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('cn-pagination-content flex items-center gap-2', className)}
      {...props}
    />
  );
}

function PaginationItem(props: ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />;
}

function PaginationArrow({ direction, href }: {
  direction: 'previous' | 'next';
  href?: ComponentProps<typeof Link>['href'];
}) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;
  const label = direction === 'previous' ? 'Previous page' : 'Next page';

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      disabled={href === undefined}
      nativeButton={href === undefined}
      render={href === undefined ? undefined : <Link href={href} />}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}

export { Pagination, PaginationArrow, PaginationContent, PaginationItem };
