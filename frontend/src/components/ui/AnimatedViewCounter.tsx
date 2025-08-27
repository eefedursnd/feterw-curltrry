'use client';

import { useState, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';

interface AnimatedViewCounterProps {
  views: number;
  textColor: string;
  glow: boolean;
  animate?: boolean;
}

const AnimatedViewCounter: React.FC<AnimatedViewCounterProps> = ({ 
  views, 
  textColor, 
  glow,
  animate = false
}) => {
  const [displayedViews, setDisplayedViews] = useState(views);
  const animationRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!animate) {
      setDisplayedViews(views);
      return;
    }
    
    setDisplayedViews(0);
    
    const duration = 5000;
    const startTime = Date.now();
    const startValue = 0;
    
    const animateCount = () => {
      const now = Date.now();
      const elapsedTime = now - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      const easeOutQuart = (x: number) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      const easedProgress = easeOutQuart(progress);
      
      const newCount = Math.floor(startValue + (views - startValue) * easedProgress);
      setDisplayedViews(newCount);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateCount);
      } else {
        setDisplayedViews(views);
      }
    };
    
    animationRef.current = requestAnimationFrame(animateCount);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [views, animate]);
  
  return (
    <div className="flex items-center gap-1 transition-all duration-300">
      <Eye
        size={18}
        style={{
          color: `${textColor}`,
          filter: glow ? `drop-shadow(0px 0px 6px ${textColor})` : "none"
        }}
      />
      <span
        className="text-sm font-medium select-none"
        style={{
          color: `${textColor}`,
          textShadow: glow ? `0px 0px 6px ${textColor}` : 'none'
        }}
      >
        {displayedViews.toLocaleString()}
      </span>
    </div>
  );
};

export default AnimatedViewCounter;