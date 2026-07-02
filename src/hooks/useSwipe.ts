import { useState } from 'react';

interface UseSwipeProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, minSwipeDistance = 50 }: UseSwipeProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent | TouchEvent) => {
    setTouchEnd(null);
    setTouchStart((e as React.TouchEvent).targetTouches ? (e as React.TouchEvent).targetTouches[0].clientX : (e as TouchEvent).touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent | TouchEvent) => {
    setTouchEnd((e as React.TouchEvent).targetTouches ? (e as React.TouchEvent).targetTouches[0].clientX : (e as TouchEvent).touches[0].clientX);
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd: onTouchEndEvent
  };
}
