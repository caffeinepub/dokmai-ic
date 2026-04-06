import { useEffect, useState } from "react";
import { generateTotpCode, getSecondsRemaining } from "../utils/totp";

interface TotpState {
  code: string | null;
  secondsRemaining: number;
  isLoading: boolean;
}

export function useTotpCode(secret: string): TotpState {
  const [state, setState] = useState<TotpState>({
    code: null,
    secondsRemaining: getSecondsRemaining(),
    isLoading: true,
  });

  useEffect(() => {
    if (!secret || secret.trim() === "") {
      setState({
        code: null,
        secondsRemaining: getSecondsRemaining(),
        isLoading: false,
      });
      return;
    }

    let lastWindow = -1;

    const tick = async () => {
      const remaining = getSecondsRemaining();
      const currentWindow = Math.floor(Date.now() / 1000 / 30);

      if (currentWindow !== lastWindow) {
        lastWindow = currentWindow;
        try {
          const code = await generateTotpCode(secret);
          setState({ code, secondsRemaining: remaining, isLoading: false });
        } catch {
          setState({
            code: null,
            secondsRemaining: remaining,
            isLoading: false,
          });
        }
      } else {
        setState((prev) => ({ ...prev, secondsRemaining: remaining }));
      }
    };

    // Run immediately
    tick();

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [secret]);

  return state;
}
