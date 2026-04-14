const PASSWORD_ATTEMPT_LIMIT_STORAGE_KEY_PREFIX = "admin-password-attempt-limit";

export const PASSWORD_ATTEMPT_LIMIT = 3;
export const PASSWORD_ATTEMPT_WINDOW_MS = 60 * 60 * 1000;

function getStorageKey(scope) {
  return `${PASSWORD_ATTEMPT_LIMIT_STORAGE_KEY_PREFIX}:${scope}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeEntries(entries, now = Date.now()) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .filter((entry) => {
      if (!entry || typeof entry !== "object") {
        return false;
      }

      if (typeof entry.timestamp !== "number") {
        return false;
      }

      return now - entry.timestamp < PASSWORD_ATTEMPT_WINDOW_MS;
    })
    .sort((left, right) => left.timestamp - right.timestamp);
}

function readEntries(scope, now = Date.now()) {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(scope));
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return normalizeEntries(parsedValue, now);
  } catch {
    return [];
  }
}

function writeEntries(scope, entries) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      getStorageKey(scope),
      JSON.stringify(entries),
    );
  } catch {
    // Ignore storage errors so the UI does not crash.
  }
}

function buildLimitState(entries, now = Date.now()) {
  const activeEntries = normalizeEntries(entries, now);
  const attemptCount = activeEntries.length;
  const remainingAttempts = Math.max(0, PASSWORD_ATTEMPT_LIMIT - attemptCount);
  const resetAt =
    activeEntries.length > 0
      ? activeEntries[0].timestamp + PASSWORD_ATTEMPT_WINDOW_MS
      : null;

  return {
    attemptCount,
    isLimited: remainingAttempts === 0,
    remainingAttempts,
    resetAt,
  };
}

export function getPasswordAttemptLimitState(scope, now = Date.now()) {
  const activeEntries = readEntries(scope, now);
  writeEntries(scope, activeEntries);

  return buildLimitState(activeEntries, now);
}

export function registerPasswordAttempt(scope, now = Date.now()) {
  const activeEntries = readEntries(scope, now);
  const currentState = buildLimitState(activeEntries, now);

  if (currentState.isLimited) {
    return currentState;
  }

  const nextEntries = [
    ...activeEntries,
    {
      scope,
      timestamp: now,
    },
  ];

  writeEntries(scope, nextEntries);

  return buildLimitState(nextEntries, now);
}

export function formatPasswordAttemptWaitTime(resetAt, now = Date.now()) {
  if (!resetAt) {
    return "";
  }

  const remainingMs = Math.max(0, resetAt - now);
  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${Math.max(1, totalMinutes)}m`;
}
