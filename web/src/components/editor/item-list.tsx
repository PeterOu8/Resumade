import { useId, useRef, useState, type ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { editorOutlineButtonClass } from './editor-styles';
import { SortableList } from './sortable-list';

type ItemListProps<T> = {
  items: readonly T[];
  onChange: (items: T[]) => void;
  itemName: string;
  getTitle?: (item: T) => string;
  createItem: () => T;
  renderItem: (item: T, onChange: (item: T) => void, label: string) => ReactNode;
};

export function ItemList<T>({
  items,
  onChange,
  itemName,
  getTitle,
  createItem,
  renderItem,
}: ItemListProps<T>) {
  const listId = useId();
  const nextId = useRef(items.length);
  // Keep React and drag identities local so the resume payload keeps its existing shape.
  const [ids, setIds] = useState(() => items.map((_, index) => `${listId}-${index}`));
  const rows = items.map((item, index) => ({
    id: ids[index],
    item,
    index,
    label: getTitle ? getTitle(item).trim() || itemName : `${itemName} ${index + 1}`,
  }));

  return (
    <div className="space-y-6">
      {rows.length > 0 && (
        <SortableList
          items={rows}
          getId={(row) => row.id}
          getLabel={(row) => row.label}
          className="space-y-4"
          onReorder={(reordered) => {
            setIds(reordered.map(({ id }) => id));
            onChange(reordered.map(({ item }) => item));
          }}
          renderItem={({ id, item, index, label }, handle) => (
            <div className="space-y-4 rounded-lg border-t border-[#dbe2ee] bg-[#f8faff] p-4">
              <div className="flex items-center gap-1">
                {handle}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#273348]">{label}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${label}`}
                  className="text-[#aa5960] hover:bg-[#fbecee] hover:text-[#9a3d48]"
                  onClick={() => {
                    setIds((previous) => previous.filter((key) => key !== id));
                    onChange(items.filter((_, position) => position !== index));
                  }}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              {renderItem(item, (value) => {
                onChange(items.map((entry, position) => (position === index ? value : entry)));
              }, label)}
            </div>
          )}
        />
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={`${editorOutlineButtonClass} mt-1 font-semibold text-[#3558c8]`}
        onClick={() => {
          const id = `${listId}-${nextId.current++}`;
          setIds((previous) => [...previous, id]);
          onChange([...items, createItem()]);
        }}
      >
        <Plus aria-hidden="true" /> Add {itemName.toLowerCase()}
      </Button>
    </div>
  );
}
