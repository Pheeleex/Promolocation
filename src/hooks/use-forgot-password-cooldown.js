import { useEffect, useMemo, useState } from "react";
import {
  formatForgotPasswordCooldown,
  getForgotPasswordCooldownState,
  startForgotPasswordCooldown,
} from "../utils/forgotPasswordCooldown";

export function useForgotPasswordCooldown() {
  const [cooldownState, setCooldownState] = useState(() =>
    getForgotPasswordCooldownState(),
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCooldownState(getForgotPasswordCooldownState());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const startCooldown = () => {
    const nextState = startForgotPasswordCooldown();
    setCooldownState(nextState);
    return nextState;
  };

  const cooldownLabel = useMemo(
    () => formatForgotPasswordCooldown(cooldownState.remainingMs),
    [cooldownState.remainingMs],
  );

  return {
    ...cooldownState,
    cooldownLabel,
    startCooldown,
  };
}
