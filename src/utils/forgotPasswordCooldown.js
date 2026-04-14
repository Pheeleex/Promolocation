const FORGOT_PASSWORD_COOLDOWN_STORAGE_KEY = "forgot-password-cooldown";

export const FORGOT_PASSWORD_COOLDOWN_MS = 60 * 1000;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function clearStoredCooldown() {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(FORGOT_PASSWORD_COOLDOWN_STORAGE_KEY);
  } catch {
    // Ignore storage failures so the UI still works.
  }
}

function readResetAt() {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(FORGOT_PASSWORD_COOLDOWN_STORAGE_KEY);
    const parsedValue = rawValue ? Number(rawValue) : NaN;

    return Number.isFinite(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function writeResetAt(resetAt) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      FORGOT_PASSWORD_COOLDOWN_STORAGE_KEY,
      String(resetAt),
    );
  } catch {
    // Ignore storage failures so the UI still works.
  }
}

function buildCooldownState(resetAt, now = Date.now()) {
  const remainingMs = resetAt ? Math.max(0, resetAt - now) : 0;
  const isCooldownActive = remainingMs > 0;

  if (!isCooldownActive) {
    clearStoredCooldown();
  }

  return {
    isCooldownActive,
    remainingMs,
    resetAt: isCooldownActive ? resetAt : null,
  };
}

export function getForgotPasswordCooldownState(now = Date.now()) {
  const resetAt = readResetAt();

  return buildCooldownState(resetAt, now);
}

export function startForgotPasswordCooldown(now = Date.now()) {
  const resetAt = now + FORGOT_PASSWORD_COOLDOWN_MS;
  writeResetAt(resetAt);

  return buildCooldownState(resetAt, now);
}

export function formatForgotPasswordCooldown(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return `${Math.max(1, totalSeconds)}s`;
}
