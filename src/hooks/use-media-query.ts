import { useState, useEffect } from 'react';

function readMatches(query: string): boolean {
  const win = globalThis.window as typeof globalThis.window | undefined;
  return !!win && typeof win.matchMedia === 'function'
    ? win.matchMedia(query).matches
    : false;
}

export function useMediaQuery<T = boolean>(
  query: string,
  getValue?: (matches: boolean) => T,
): T {
  const mapValue = (matches: boolean): T =>
    getValue ? getValue(matches) : (matches as unknown as T);

  const [value, setValue] = useState<T>(() => mapValue(readMatches(query)));

  useEffect(() => {
    const win = globalThis.window as typeof globalThis.window | undefined;
    if (!win || typeof win.matchMedia !== 'function') return;

    const mql = win.matchMedia(query);
    const update = (matches: boolean) => setValue(mapValue(matches));

    update(mql.matches);

    const handler = (e: MediaQueryListEvent) => update(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query, getValue]);

  return value;
}
