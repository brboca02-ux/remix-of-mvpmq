import { useCallback, useEffect, useState } from "react";
import type { MarketAnalysis } from "@/lib/types";

const KEY = "marketscope:history:v1";
const MAX = 20;

function read(): MarketAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: MarketAnalysis[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
}

export function useAnalysisHistory() {
  const [items, setItems] = useState<MarketAnalysis[]>([]);

  useEffect(() => {
    setItems(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = useCallback((analysis: MarketAnalysis) => {
    const current = read();
    const next = [analysis, ...current.filter((a) => a.id !== analysis.id)].slice(0, MAX);
    write(next);
    setItems(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = read().filter((a) => a.id !== id);
    write(next);
    setItems(next);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    const next = read().map((a) => (a.id === id ? { ...a, favorite: !a.favorite } : a));
    write(next);
    setItems(next);
  }, []);

  const getById = useCallback((id: string): MarketAnalysis | undefined => {
    return read().find((a) => a.id === id);
  }, []);

  return { items, save, remove, toggleFavorite, getById };
}

export function getAnalysisById(id: string): MarketAnalysis | undefined {
  return read().find((a) => a.id === id);
}
