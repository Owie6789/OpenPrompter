import { useState, useEffect } from 'react';

function unsafeGetMatches(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches;
}

function getInitialValue<T>(query: string, getValue: (matches: boolean) => T): T {
  const matches = unsafeGetMatches(query);
  return getValue(matches);
}

export function useMediaQuery<T = boolean>(query: string, getValue?: (matches: boolean) => T): T {
  const isBoolean = getValue === undefined;
  const initial = getInitialValue(query, (m) => (isBoolean ? m as unknown as T : getValue!(m)));

  if (typeof window === 'undefined') return initial;

  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => {
      setValue(isBoolean ? e.matches as unknown as T : getValue!(e.matches));
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return value;
}
