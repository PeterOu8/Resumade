'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  aiTailorResultSchema,
  type AiTailorResult,
} from '@/lib/ai/tailor-result';

const storagePrefix = 'resumade.ai-tailor-result.v1';

function resultStorageKey(scope: string) {
  return `${storagePrefix}.${encodeURIComponent(scope)}`;
}

function readResult(storageKey: string): AiTailorResult | null {
  try {
    const parsed = aiTailorResultSchema.safeParse(
      JSON.parse(localStorage.getItem(storageKey) ?? 'null'),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeResult(storageKey: string, result: AiTailorResult | null) {
  try {
    if (result) {
      localStorage.setItem(storageKey, JSON.stringify(result));
    } else {
      localStorage.removeItem(storageKey);
    }
  } catch {
    // State still works for this mount when browser storage is unavailable.
  }
}

export function useAiTailorResult(scope: string) {
  const storageKey = useMemo(() => resultStorageKey(scope), [scope]);
  const [state, setState] = useState<{
    hydratedKey: string | null;
    result: AiTailorResult | null;
  }>({ hydratedKey: null, result: null });

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setState({ hydratedKey: storageKey, result: readResult(storageKey) });
      }
    });
    return () => { active = false; };
  }, [storageKey]);

  const setResult = useCallback((result: AiTailorResult) => {
    writeResult(storageKey, result);
    setState({ hydratedKey: storageKey, result });
  }, [storageKey]);

  const setSelectedChangeIds = useCallback((selectedChangeIds: string[]) => {
    if (state.hydratedKey !== storageKey || !state.result) return;
    const next = { ...state.result, selectedChangeIds };
    writeResult(storageKey, next);
    setState({ hydratedKey: storageKey, result: next });
  }, [state, storageKey]);

  const moveToScope = useCallback((nextScope: string) => {
    if (state.hydratedKey !== storageKey || !state.result) return;
    try {
      localStorage.setItem(resultStorageKey(nextScope), JSON.stringify(state.result));
      localStorage.removeItem(storageKey);
    } catch {
      // Keep the current scoped copy if migration is unavailable.
    }
  }, [state, storageKey]);

  const clearResult = useCallback(() => {
    writeResult(storageKey, null);
    setState({ hydratedKey: storageKey, result: null });
  }, [storageKey]);

  return {
    result: state.hydratedKey === storageKey ? state.result : null,
    setResult,
    setSelectedChangeIds,
    moveToScope,
    clearResult,
  };
}

