'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { KeyRound, ShieldCheck, Sparkles, X } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';

export const aiProviderSchema = z.enum([
  'openai',
  'claude',
  'grok',
  'gemini',
  'deepseek',
]);
export type AiProvider = z.infer<typeof aiProviderSchema>;

const providers: ReadonlyArray<{
  value: AiProvider;
  label: string;
  defaultModel: string;
}> = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-6-astra' },
  {
    value: 'claude',
    label: 'Claude',
    defaultModel: 'claude-sonnet-4-5-20250929',
  },
  { value: 'grok', label: 'Grok', defaultModel: 'grok-4.7' },
  { value: 'gemini', label: 'Gemini', defaultModel: 'gemini-3.8-flash' },
  { value: 'deepseek', label: 'DeepSeek', defaultModel: 'deepseek-flash' },
];

const defaultModels = Object.fromEntries(
  providers.map(({ value, defaultModel }) => [value, defaultModel]),
) as Record<AiProvider, string>;

const persistedSettingsSchema = z.object({
  provider: aiProviderSchema,
  models: z.record(aiProviderSchema, z.string().max(120)),
  aiParsingEnabled: z.boolean(),
});

const apiKeysSchema = z.partialRecord(aiProviderSchema, z.string().max(512));
const settingsKey = 'resumade.ai.settings.v1';
const secretsKey = 'resumade.ai.keys.v1';

type AiSettings = z.infer<typeof persistedSettingsSchema>;
export type AiConnection = {
  provider: AiProvider;
  model: string;
  apiKey: string;
};

type AiSettingsContextValue = {
  settings: AiSettings;
  connection: AiConnection;
  openSettings: () => void;
};

const defaultSettings: AiSettings = {
  provider: 'openai',
  models: defaultModels,
  aiParsingEnabled: false,
};

const AiSettingsContext = createContext<AiSettingsContextValue | null>(null);

export function useAiSettings() {
  const value = useContext(AiSettingsContext);
  if (!value)
    throw new Error('useAiSettings must be used inside AiSettingsProvider');
  return value;
}

export function AiSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AiSettings>(defaultSettings);
  const [apiKeys, setApiKeys] = useState<Partial<Record<AiProvider, string>>>(
    {},
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const storedSettings = persistedSettingsSchema.safeParse(
          JSON.parse(localStorage.getItem(settingsKey) ?? 'null'),
        );
        if (storedSettings.success) setSettings(storedSettings.data);

        const storedKeys = apiKeysSchema.safeParse(
          JSON.parse(sessionStorage.getItem(secretsKey) ?? 'null'),
        );
        if (storedKeys.success) setApiKeys(storedKeys.data);
      } catch {
        // Invalid or blocked browser storage falls back to safe defaults.
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function save(
    nextSettings: AiSettings,
    nextKeys: Partial<Record<AiProvider, string>>,
  ) {
    setSettings(nextSettings);
    setApiKeys(nextKeys);
    try {
      localStorage.setItem(settingsKey, JSON.stringify(nextSettings));
      sessionStorage.setItem(secretsKey, JSON.stringify(nextKeys));
    } catch {
      // Settings remain available for this render even when storage is blocked.
    }
  }

  const value = useMemo<AiSettingsContextValue>(
    () => ({
      settings,
      connection: {
        provider: settings.provider,
        model: settings.models[settings.provider],
        apiKey: apiKeys[settings.provider] ?? '',
      },
      openSettings: () => setOpen(true),
    }),
    [apiKeys, settings],
  );

  return (
    <AiSettingsContext.Provider value={value}>
      {children}
      <AiSettingsDialog
        open={open}
        settings={settings}
        apiKeys={apiKeys}
        onClose={() => setOpen(false)}
        onSave={(nextSettings, nextKeys) => {
          save(nextSettings, nextKeys);
          setOpen(false);
        }}
      />
    </AiSettingsContext.Provider>
  );
}

function AiSettingsDialog({
  open,
  settings,
  apiKeys,
  onClose,
  onSave,
}: {
  open: boolean;
  settings: AiSettings;
  apiKeys: Partial<Record<AiProvider, string>>;
  onClose: () => void;
  onSave: (
    settings: AiSettings,
    keys: Partial<Record<AiProvider, string>>,
  ) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(settings);
  const [draftKeys, setDraftKeys] = useState(apiKeys);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    setDraft(settings);
    setDraftKeys(apiKeys);
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [apiKeys, open, settings]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      event.currentTarget.close();
  }

  const selected = providers.find(({ value }) => value === draft.provider)!;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="ai-settings-heading"
      onClose={onClose}
      onClick={handleBackdropClick}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[620px] overflow-hidden rounded-[24px] border border-[#dce2ec] bg-white p-0 text-[#1e2636] shadow-[0_28px_90px_#0d142755] backdrop:bg-[#10182acc] backdrop:backdrop-blur-[3px]"
    >
      <div className="ai-dialog-scroll mr-3 max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
        <div className="flex items-start justify-between gap-4 border-b border-[#e5eaf2] px-6 py-5 sm:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] text-[#3558c8] uppercase">
              <Sparkles size={13} aria-hidden="true" /> AI preferences
            </span>
            <h2
              id="ai-settings-heading"
              className="mt-2 text-2xl font-semibold tracking-[-0.04em]"
            >
              Connect your provider
            </h2>
            <p className="mt-1 text-sm text-[#687282]">
              Choose the model used for parsing and job-specific tailoring.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close AI settings"
            onClick={() => dialogRef.current?.close()}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#d7deea] text-[#687282] hover:bg-[#eef2fa] hover:text-[#273348] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#95a9f0]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form
          className="space-y-6 px-6 py-6 sm:px-8"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(draft, draftKeys);
          }}
        >
          <fieldset>
            <legend className="text-sm font-semibold text-[#273348]">
              Provider
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {providers.map((provider) => (
                <label
                  key={provider.value}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition-colors ${
                    draft.provider === provider.value
                      ? 'border-[#3558c8] bg-[#edf2ff] text-[#2847a9]'
                      : 'border-[#d7deea] text-[#596579] hover:bg-[#f7f9fd]'
                  }`}
                >
                  <input
                    type="radio"
                    name="ai-provider"
                    value={provider.value}
                    checked={draft.provider === provider.value}
                    onChange={() =>
                      setDraft({ ...draft, provider: provider.value })
                    }
                    className="sr-only"
                  />
                  {provider.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-[#273348]">
              <KeyRound size={15} aria-hidden="true" /> {selected.label} API key
            </span>
            <input
              type="password"
              autoComplete="off"
              value={draftKeys[draft.provider] ?? ''}
              placeholder="Paste your API key"
              onChange={(event) =>
                setDraftKeys({
                  ...draftKeys,
                  [draft.provider]: event.target.value,
                })
              }
              className="mt-2 h-11 w-full rounded-lg border border-[#d7deea] bg-white px-3 text-sm outline-none focus:border-[#3558c8] focus:ring-3 focus:ring-[#3558c8]/15"
            />
            <span className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-[#687282]">
              <ShieldCheck
                size={14}
                className="mt-0.5 shrink-0 text-[#43805c]"
                aria-hidden="true"
              />
              Kept only in this browser tab. It is sent to the Resumade backend
              for your request and never saved with a resume.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#273348]">Model</span>
            <input
              type="text"
              value={draft.models[draft.provider]}
              maxLength={120}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  models: {
                    ...draft.models,
                    [draft.provider]: event.target.value,
                  },
                })
              }
              className="mt-2 h-11 w-full rounded-lg border border-[#d7deea] bg-white px-3 text-sm outline-none focus:border-[#3558c8] focus:ring-3 focus:ring-[#3558c8]/15"
            />
            <span className="mt-1.5 block text-xs text-[#8a94a5]">
              Change this if your account uses a different model ID.
            </span>
          </label>

          <label className="flex cursor-pointer items-start justify-between gap-5 rounded-2xl border border-[#dce3ef] bg-[#f8faff] p-4">
            <span>
              <span className="block text-sm font-semibold text-[#273348]">
                Use AI when importing PDFs
              </span>
              <span className="mt-1 block text-xs leading-5 text-[#687282]">
                Off by default. When off, imports continue to use
                Resumade&apos;s local rules-based parser.
              </span>
            </span>
            <input
              type="checkbox"
              checked={draft.aiParsingEnabled}
              onChange={(event) =>
                setDraft({ ...draft, aiParsingEnabled: event.target.checked })
              }
              className="mt-1 size-5 accent-[#3558c8]"
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-[#e9edf3] pt-5">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="bg-[#3558c8] px-5 text-white hover:bg-[#2847a9]"
            >
              Save settings
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
