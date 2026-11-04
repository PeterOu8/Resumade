import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';

type EditorSectionProps = {
  title: string;
  count?: number;
  handle?: ReactNode;
  initiallyOpen?: boolean;
  children: ReactNode;
};

export function EditorSection({
  title,
  count,
  handle,
  initiallyOpen = false,
  children,
}: EditorSectionProps) {
  const id = useId();
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <section aria-labelledby={`${id}-heading`} className="border-t border-border-muted">
      <div className="flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover [&_button:hover]:bg-transparent!">
        {handle ?? <span aria-hidden="true" className="w-7 shrink-0" />}
        <h2 id={`${id}-heading`} className="min-w-0 flex-1">
          <Button
            type="button"
            variant="ghost"
            aria-expanded={open}
            aria-controls={`${id}-body`}
            onClick={() => setOpen(!open)}
            className="group h-10 w-full justify-start gap-2 px-2 text-[15px] font-semibold text-foreground-strong aria-expanded:bg-transparent!"
          >
            <span className="truncate">{title}</span>
            {count !== undefined && (
              <span className="rounded-full bg-muted px-2 text-xs font-medium text-foreground-muted">
                {count}
              </span>
            )}
            <ChevronDown
              aria-hidden="true"
              className="ml-auto text-foreground-subtle transition-transform group-aria-expanded:rotate-180"
            />
          </Button>
        </h2>
      </div>
      <div id={`${id}-body`} hidden={!open} className="pt-3 pr-[calc(--spacing(4)+1px)] pb-6 pl-[calc(--spacing(12)+1px)]">
        {children}
      </div>
    </section>
  );
}
