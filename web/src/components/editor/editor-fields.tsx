import { useId, type ComponentProps } from 'react';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { editorInputClass } from './editor-styles';
import { ItemList } from './item-list';
import { RichTextEditor } from './rich-text-editor';

type TextFieldProps = Pick<ComponentProps<typeof Input>, 'type' | 'disabled' | 'placeholder' | 'className'> & {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
};

export function TextField({ label, value, onChange, className, ...props }: TextFieldProps) {
  const id = useId();
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id} className="text-xs font-semibold text-[#566173]">
        {label}
      </FieldLabel>
      <Input
        id={id}
        className={editorInputClass}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </Field>
  );
}

type DateRange = { startDate: string; endDate?: string | null; current: boolean };

export function DateRangeFields({
  value,
  currentLabel,
  onChange,
}: {
  value: DateRange;
  currentLabel: string;
  onChange: (value: DateRange) => void;
}) {
  return (
    <>
      <TextField
        label="Start date"
        placeholder="YYYY or YYYY-MM"
        value={value.startDate}
        onChange={(startDate) => onChange({ ...value, startDate })}
      />
      <TextField
        label="End date"
        placeholder={value.current ? 'Present' : 'YYYY or YYYY-MM'}
        value={value.current ? '' : value.endDate}
        disabled={value.current}
        onChange={(endDate) => onChange({ ...value, endDate })}
      />
      <label className="flex items-center gap-2 text-sm text-[#566173] sm:col-span-2">
        <input
          type="checkbox"
          className="accent-[#3558c8]"
          checked={value.current}
          onChange={(event) => onChange({ ...value, current: event.target.checked })}
        />
        {currentLabel}
      </label>
    </>
  );
}

export function TextListField({
  label,
  itemName,
  items,
  onChange,
  richText = false,
}: {
  label: string;
  itemName: string;
  items: string[];
  onChange: (items: string[]) => void;
  richText?: boolean;
}) {
  return (
    <fieldset className="min-w-0 pt-4">
      <legend className="mb-2 text-sm font-semibold text-[#273348]">{label}</legend>
      <ItemList
        items={items}
        onChange={onChange}
        itemName={itemName}
        createItem={() => ''}
        renderItem={(item, update, label) => richText
          ? <RichTextEditor label={label} value={item} onChange={update} />
          : <TextField label={label} value={item} onChange={update} />}
      />
    </fieldset>
  );
}
