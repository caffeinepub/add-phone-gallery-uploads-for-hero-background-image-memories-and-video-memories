import { useState, useEffect, useCallback } from 'react';

const UNLOCK_KEY = 'romantic_site_unlocked';
const CORRECT_PASSWORD = '182004032007';

export function useSessionGate() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const unlocked = sessionStorage.getItem(UNLOCK_KEY);
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const attemptUnlock = useCallback((password: string): boolean => {
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(UNLOCK_KEY, 'true');
      setIsUnlocked(true);
      return true;
    }
    return false;
  }, []);

  return { isUnlocked, attemptUnlock };
}
