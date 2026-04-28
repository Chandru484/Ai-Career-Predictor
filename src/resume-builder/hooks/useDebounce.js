import { useRef, useCallback, useEffect } from 'react';

/**
 * Returns a stable debounced version of `callback`.
 * The returned function is memoised so its reference never changes between renders,
 * preventing accidental timer resets caused by React re-renders.
 */
export function useDebounce(callback, delay) {
  const timer = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedFn = useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => callbackRef.current(...args), delay);
  // delay is a primitive — safe to include
  }, [delay]);

  return debouncedFn;
}
