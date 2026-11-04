import { Download } from 'lucide-react';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { layoutLabels, marginSides, paperSizes, type CustomOptions, type PreviewSettings } from './constants';

function SelectSetting<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1 text-sm font-medium">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          const selected = options.find(([id]) => id === event.target.value);
          if (selected) onChange(selected[0]);
        }}
        className="h-8 min-w-0 rounded-lg border border-input bg-background px-2 font-normal focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </div>
  );
}

const layoutOptions = (Object.keys(layoutLabels) as PreviewSettings['style'][]).map((id) => [id, layoutLabels[id]] as const);
const paperOptions = (Object.keys(paperSizes) as PreviewSettings['paper'][]).map((id) => [id, paperSizes[id].label] as const);
const fontOptions = [['sans', 'Sans serif'], ['serif', 'Serif'], ['mono', 'Monospace']] as const;
const alignmentOptions = [['left', 'Left'], ['center', 'Centered']] as const;
const headingOptions = [['plain', 'Plain'], ['rule', 'Underline'], ['band', 'Tinted band']] as const;
const densityOptions = [['comfortable', 'Comfortable'], ['compact', 'Compact']] as const;

export function PreviewToolbar({ settings, onChange, saveStatus }: {
  settings: PreviewSettings;
  onChange: (settings: PreviewSettings) => void;
  saveStatus: 'saved' | 'unsaved' | 'error';
}) {
  const setCustom = <K extends keyof CustomOptions>(key: K, value: CustomOptions[K]) => {
    onChange({ ...settings, custom: { ...settings.custom, [key]: value } });
  };

  return (
    <div className="space-y-3 border-b bg-background p-3 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="resume-preview-heading" className="text-sm font-semibold">Live preview</h2>
        <div className="flex items-center gap-2">
          <span role="status" className="text-xs text-muted-foreground">
            {saveStatus === 'saved' ? 'Saved locally' : saveStatus === 'error' ? 'Local save failed' : 'Unsaved locally'}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Download aria-hidden="true" /> Download
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectSetting label="Style" value={settings.style} options={layoutOptions} onChange={(style) => onChange({ ...settings, style })} />
        <SelectSetting label="Paper size" value={settings.paper} options={paperOptions} onChange={(paper) => onChange({ ...settings, paper })} />
      </div>
      <details className="rounded-lg border p-2">
        <summary className="cursor-pointer text-sm font-medium">Colours and margins</summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(['accent', 'text'] as const).map((color) => (
            <label key={color} className="flex items-center gap-2 text-sm">
              <Input
                type="color"
                className="w-10 shrink-0 p-0.5"
                value={settings.theme[color]}
                onChange={(event) => onChange({ ...settings, theme: { ...settings.theme, [color]: event.target.value } })}
              />
              {color === 'accent' ? 'Accent' : 'Text'}
            </label>
          ))}
        </div>
        <fieldset className="mt-3">
          <legend className="mb-2 text-sm font-medium">Margins (mm)</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {marginSides.map((side) => (
              <label key={side} className="min-w-0 text-xs">
                {side[0].toUpperCase() + side.slice(1)}
                <Input
                  type="number"
                  min={0}
                  max={40}
                  step={1}
                  className="mt-1"
                  value={settings.margins[side]}
                  onChange={(event) => {
                    const margin = event.target.valueAsNumber;
                    onChange({ ...settings, margins: { ...settings.margins, [side]: Number.isFinite(margin) ? Math.min(40, Math.max(0, margin)) : 0 } });
                  }}
                />
              </label>
            ))}
          </div>
        </fieldset>
      </details>
      {settings.style === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <SelectSetting label="Font" value={settings.custom.font} options={fontOptions} onChange={(value) => setCustom('font', value)} />
          <SelectSetting label="Header alignment" value={settings.custom.alignment} options={alignmentOptions} onChange={(value) => setCustom('alignment', value)} />
          <SelectSetting label="Section headings" value={settings.custom.headings} options={headingOptions} onChange={(value) => setCustom('headings', value)} />
          <SelectSetting label="Spacing" value={settings.custom.density} options={densityOptions} onChange={(value) => setCustom('density', value)} />
        </div>
      )}
    </div>
  );
}
