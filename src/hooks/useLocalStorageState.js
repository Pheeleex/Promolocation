import { useEffect, useState } from "react";

function resolveValue(initialValue) {
  return typeof initialValue === "function" ? initialValue() : initialValue;
}

export function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") {
      return resolveValue(initialValue);
    }

    try {
      const storedValue = window.localStorage.getItem(key);

      if (storedValue === null) {
        return resolveValue(initialValue);
      }

      return JSON.parse(storedValue);
    } catch (error) {
      return resolveValue(initialValue);
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (state === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (error) {
      return;
    }
  }, [key, state]);

  return [state, setState];
}

