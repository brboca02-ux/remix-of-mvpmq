import { useCallback, useEffect, useState } from "react";
import type { FilterPreset, SavedList, CompanyFilter } from "@/lib/company-types";

const LIST_KEY = "ms_saved_lists_v1";
const PRESET_KEY = "ms_filter_presets_v1";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, v: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(v));
}

export function useSavedLists() {
  const [lists, setLists] = useState<SavedList[]>([]);

  useEffect(() => {
    setLists(read<SavedList>(LIST_KEY));
  }, []);

  const save = useCallback(
    (name: string, filter: CompanyFilter, companyIds: string[]) => {
      const item: SavedList = {
        id: `list_${Date.now().toString(36)}`,
        name,
        createdAt: Date.now(),
        filter,
        companyIds,
      };
      const next = [item, ...lists].slice(0, 50);
      setLists(next);
      write(LIST_KEY, next);
      return item;
    },
    [lists],
  );

  const remove = useCallback(
    (id: string) => {
      const next = lists.filter((l) => l.id !== id);
      setLists(next);
      write(LIST_KEY, next);
    },
    [lists],
  );

  return { lists, save, remove };
}

export function usePresets() {
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  useEffect(() => {
    setPresets(read<FilterPreset>(PRESET_KEY));
  }, []);

  const save = useCallback(
    (name: string, filter: CompanyFilter) => {
      const item: FilterPreset = { id: `p_${Date.now().toString(36)}`, name, filter };
      const next = [item, ...presets].slice(0, 20);
      setPresets(next);
      write(PRESET_KEY, next);
      return item;
    },
    [presets],
  );

  const remove = useCallback(
    (id: string) => {
      const next = presets.filter((p) => p.id !== id);
      setPresets(next);
      write(PRESET_KEY, next);
    },
    [presets],
  );

  return { presets, save, remove };
}
