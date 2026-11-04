import { DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

type SortableListProps<T> = {
  items: readonly T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  renderItem: (item: T, handle: ReactNode) => ReactNode;
  onReorder: (items: T[]) => void;
  className?: string;
};

export function SortableList<T>({
  items,
  getId,
  getLabel,
  renderItem,
  onReorder,
  className,
}: SortableListProps<T>) {
  return (
    <DragDropProvider
      onDragEnd={({ canceled, operation: { source } }) => {
        if (canceled || !isSortable(source)) return;

        const { initialIndex, index } = source;
        if (
          initialIndex === index ||
          initialIndex < 0 ||
          initialIndex >= items.length ||
          index < 0 ||
          index >= items.length ||
          getId(items[initialIndex]) !== source.id
        )
          return;

        const reordered = [...items];
        const [item] = reordered.splice(initialIndex, 1);
        reordered.splice(index, 0, item);
        onReorder(reordered);
      }}
    >
      <ul className={className}>
        {items.map((item, index) => {
          const id = getId(item);
          return (
            <SortableRow key={id} id={id} index={index} label={getLabel(item)}>
              {(handle) => renderItem(item, handle)}
            </SortableRow>
          );
        })}
      </ul>
    </DragDropProvider>
  );
}

function SortableRow({
  id,
  index,
  label,
  children,
}: {
  id: string;
  index: number;
  label: string;
  children: (handle: ReactNode) => ReactNode;
}) {
  const { ref, handleRef, isDragging } = useSortable({ id, index });

  return (
    <li
      ref={ref}
      data-dragging={isDragging || undefined}
      className="relative min-w-0 bg-background data-dragging:z-10 data-dragging:shadow-md"
    >
      {children(
        <Button
          ref={handleRef}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Reorder ${label}`}
          className="touch-none cursor-grab text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical aria-hidden="true" />
        </Button>,
      )}
    </li>
  );
}
