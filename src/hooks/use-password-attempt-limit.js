import { useEffect, useMemo, useState } from "react";
import {
  formatPasswordAttemptWaitTime,
  getPasswordAttemptLimitState,
  PASSWORD_ATTEMPT_LIMIT,
  registerPasswordAttempt,
} from "../utils/passwordAttemptLimit";

const ATTEMPT_SCOPE_LABELS = {
  "change-password": "change password",
  "forgot-password": "forgot password",
  "reset-password": "reset password",
};

export function usePasswordAttemptLimit(scope) {
  const [limitState, setLimitState] = useState(() =>
    getPasswordAttemptLimitState(scope),
  );
  const scopeLabel = ATTEMPT_SCOPE_LABELS[scope] ?? "password";

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLimitState(getPasswordAttemptLimitState(scope));
    }, 30 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [scope]);

  const registerAttempt = () => {
    const nextState = registerPasswordAttempt(scope);
    setLimitState(nextState);
    return nextState;
  };

  const refreshLimitState = () => {
    setLimitState(getPasswordAttemptLimitState(scope));
  };

  const waitTimeLabel = useMemo(
    () => formatPasswordAttemptWaitTime(limitState.resetAt),
    [limitState.resetAt],
  );

  const helperText = limitState.isLimited
    ? `${scopeLabel} limit reached. Try again in ${waitTimeLabel}.`
    : `${limitState.remainingAttempts} of ${PASSWORD_ATTEMPT_LIMIT} ${scopeLabel} attempts remaining this hour.`;

  return {
    ...limitState,
    helperText,
    refreshLimitState,
    registerAttempt,
    waitTimeLabel,
  };
}
