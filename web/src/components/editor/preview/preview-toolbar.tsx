import { useId } from 'react';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

import { editorInputClass, editorOutlineButtonClass } from '../editor-styles';
import {
  layoutLabels,
  marginSides,
  paperSizes,
  type CustomOptions,
  type PreviewSettings,
} from './constants';

type SelectSettingProps<T extends string> = {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
};

function SelectSetting<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectSettingProps<T>) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
      <label htmlFor={id} className="text-xs font-semibold text-foreground-label">
        {label}
      </label>
      <Select
        id={id}
        value={value}
        onChange={(event) => {
          const selected = options.find(
            ([optionId]) => optionId === event.target.value,
          );
          if (selected) onChange(selected[0]);
        }}
      >
        {options.map(([optionId, name]) => (
          <option key={optionId} value={optionId}>
            {name}
          </option>
        ))}
      </Select>
    </div>
  );
}

const layoutOptions = (
  Object.keys(layoutLabels) as PreviewSettings['style'][]
).map((id) => [id, layoutLabels[id]] as const);
const paperOptions = (
  Object.keys(paperSizes) as PreviewSettings['paper'][]
).map((id) => [id, paperSizes[id].label] as const);
const fontOptions = [
  ['sans', 'Sans serif'],
  ['serif', 'Serif'],
  ['mono', 'Monospace'],
] as const;
const alignmentOptions = [
  ['left', 'Left'],
  ['center', 'Centered'],
] as const;
const headingOptions = [
  ['plain', 'Plain'],
  ['rule', 'Underline'],
  ['band', 'Tinted band'],
] as const;
const densityOptions = [
  ['comfortable', 'Comfortable'],
  ['compact', 'Compact'],
] as const;

const saveStatusDetails = {
  saved: { label: 'Saved locally', dotClass: 'bg-success' },
  unsaved: { label: 'Unsaved locally', dotClass: 'bg-warning' },
  error: { label: 'Local save failed', dotClass: 'bg-danger' },
} as const;

export function PreviewToolbar({
  settings,
  onChange,
  saveStatus,
  downloading,
  onDownload,
}: {
  settings: PreviewSettings;
  onChange: (settings: PreviewSettings) => void;
  saveStatus?: 'saved' | 'unsaved' | 'error';
  downloading: boolean;
  onDownload: () => void;
}) {
  const status = saveStatus ? saveStatusDetails[saveStatus] : undefined;
  const setCustom = <K extends keyof CustomOptions>(
    key: K,
    value: CustomOptions[K],
  ) => {
    onChange({ ...settings, custom: { ...settings.custom, [key]: value } });
  };

  return (
    <div className="space-y-4 border-b border-border-subtle bg-surface p-4 print:hidden sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold tracking-[0.13em] text-primary uppercase">
            ON THE PAGE
          </span>
          <h2
            id="resume-preview-heading"
            className="text-base font-semibold tracking-[-0.025em] text-foreground-strong"
          >
            Live preview
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <span
              role="status"
              className="flex items-center gap-1.5 text-xs text-foreground-muted"
            >
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${status.dotClass}`}
              />
              {status.label}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`${editorOutlineButtonClass} font-semibold text-primary`}
            disabled={downloading}
            onClick={onDownload}
          >
            <Download aria-hidden="true" />{' '}
            {downloading ? 'Downloading…' : 'Download'}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectSetting
          label="Style"
          value={settings.style}
          options={layoutOptions}
          onChange={(style) => onChange({ ...settings, style })}
        />
        <SelectSetting
          label="Paper size"
          value={settings.paper}
          options={paperOptions}
          onChange={(paper) => onChange({ ...settings, paper })}
        />
      </div>
      <details className="rounded-xl border border-border-subtle bg-surface-subtle p-3">
        <summary className="cursor-pointer text-sm font-semibold text-foreground-strong">
          Colours and margins
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(['accent', 'text'] as const).map((color) => (
            <label
              key={color}
              className="flex items-center gap-2 text-sm text-foreground-label"
            >
              <Input
                type="color"
                className="h-9 w-10 shrink-0 border-border-strong bg-surface p-0.5"
                value={settings.theme[color]}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    theme: { ...settings.theme, [color]: event.target.value },
                  })
                }
              />
              {color === 'accent' ? 'Accent' : 'Text'}
            </label>
          ))}
        </div>
        <fieldset className="mt-3">
          <legend className="mb-2 text-sm font-semibold text-foreground-strong">
            Margins (mm)
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {marginSides.map((side) => (
              <label key={side} className="min-w-0 text-xs text-foreground-label">
                {side[0].toUpperCase() + side.slice(1)}
                <Input
                  type="number"
                  min={0}
                  max={40}
                  step={1}
                  className={`${editorInputClass} mt-1`}
                  value={settings.margins[side]}
                  onChange={(event) => {
                    const margin = event.target.valueAsNumber;
                    onChange({
                      ...settings,
                      margins: {
                        ...settings.margins,
                        [side]: Number.isFinite(margin)
                          ? Math.min(40, Math.max(0, margin))
                          : 0,
                      },
                    });
                  }}
                />
              </label>
            ))}
          </div>
        </fieldset>
      </details>
      {settings.style === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <SelectSetting
            label="Font"
            value={settings.custom.font}
            options={fontOptions}
            onChange={(value) => setCustom('font', value)}
          />
          <SelectSetting
            label="Header alignment"
            value={settings.custom.alignment}
            options={alignmentOptions}
            onChange={(value) => setCustom('alignment', value)}
          />
          <SelectSetting
            label="Section headings"
            value={settings.custom.headings}
            options={headingOptions}
            onChange={(value) => setCustom('headings', value)}
          />
          <SelectSetting
            label="Spacing"
            value={settings.custom.density}
            options={densityOptions}
            onChange={(value) => setCustom('density', value)}
          />
        </div>
      )}
    </div>
  );
}
