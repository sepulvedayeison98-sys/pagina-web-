"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface FavoritesState {
  favorites: string[];
  count: number;
  isFavorite: (slug: string) => boolean;
  toggle: (slug: string) => void;
}

const FavoritesContext = createContext<FavoritesState | null>(null);
const STORAGE_KEY = "rovex-favorites-v1";

/**
 * Guarda los slugs de los productos marcados como favoritos ("Guardar") en
 * localStorage, así sobreviven al recargar y navegar. Estado global para que
 * el corazón se vea consistente en toda la app.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let restored: string[] | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) restored = JSON.parse(raw) as string[];
    } catch {
      // ignorar JSON corrupto
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restored) setFavorites(restored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // almacenamiento lleno/bloqueado: no es crítico
    }
  }, [favorites, hydrated]);

  const toggle = useCallback((slug: string) => {
    setFavorites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites]
  );

  const value = useMemo<FavoritesState>(
    () => ({ favorites, count: favorites.length, isFavorite, toggle }),
    [favorites, isFavorite, toggle]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error("useFavorites debe usarse dentro de <FavoritesProvider>");
  return ctx;
}
