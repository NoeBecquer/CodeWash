import { useEffect, useRef, useState } from 'react';

export const useHitAnimation = (damageNumbers, duration = 400) => {
  const [isHit, setIsHit] = useState(false);
  const prevCount = useRef(0);

  useEffect(() => {
    if (damageNumbers.length > prevCount.current) {
      setIsHit(true);

      const timeout = setTimeout(() => {
        setIsHit(false);
      }, duration);

      return () => clearTimeout(timeout);
    }

    prevCount.current = damageNumbers.length;
  }, [damageNumbers, duration]);

  return isHit;
};
