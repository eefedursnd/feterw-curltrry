'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactNode;
  html?: boolean;
  className?: string;
  delay?: number;
}

const Tooltip = ({ 
  text, 
  position = 'top', 
  children, 
  html = false, 
  className = "",
  delay = 0 
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [currentFont, setCurrentFont] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Capture font when tooltip becomes visible
  useEffect(() => {
    if (shouldRender && triggerRef.current) {
      // Get computed style of trigger element
      const computedStyle = window.getComputedStyle(triggerRef.current);
      setCurrentFont(computedStyle.fontFamily);
    }
  }, [shouldRender]);

  const updateTooltipPosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 10;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + 10;
        break;
      case 'bottom':
        top = triggerRect.bottom + 10;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left - tooltipRect.width - 10;
        break;
    }

    // Make sure tooltip stays within viewport
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10)
      left = window.innerWidth - tooltipRect.width - 10;
    if (top < 10) top = 10;
    if (top + tooltipRect.height > window.innerHeight - 10)
      top = window.innerHeight - tooltipRect.height - 10;

    setTooltipPosition({ top, left });
  };

  useEffect(() => {
    if (shouldRender) {
      updateTooltipPosition();
      // Update position when window resizes
      window.addEventListener('resize', updateTooltipPosition);
      window.addEventListener('scroll', updateTooltipPosition);

      return () => {
        window.removeEventListener('resize', updateTooltipPosition);
        window.removeEventListener('scroll', updateTooltipPosition);
      };
    }
  }, [shouldRender, isVisible]);

  // This controls the actual visibility (for animation)
  useEffect(() => {
    if (isVisible) {
      // First render the tooltip
      setShouldRender(true);
    } else {
      // When hiding, delay removing from DOM to allow animation to complete
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
      }, 200); // Match this with the CSS transition duration
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Add a small delay before showing tooltip to prevent flashing on quick mouse movements
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setTimeout(updateTooltipPosition, 0);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Get transform origin based on position for the animation
  const getTransformOrigin = () => {
    switch (position) {
      case 'top': return 'bottom center';
      case 'right': return 'left center';
      case 'bottom': return 'top center';
      case 'left': return 'right center';
      default: return 'center bottom';
    }
  };

  // Get transform value based on position for the animation
  const getTransformValue = () => {
    const distance = 6;
    switch (position) {
      case 'top': return `translateY(${distance}px)`;
      case 'right': return `translateX(-${distance}px)`;
      case 'bottom': return `translateY(-${distance}px)`;
      case 'left': return `translateX(${distance}px)`;
      default: return `translateY(${distance}px)`;
    }
  };

  return (
    <div
      ref={triggerRef}
      className={`inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {mounted && shouldRender && createPortal(
        <div
          ref={tooltipRef}
          className="fixed bg-black/90 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-md pointer-events-none z-[9999] border border-zinc-800/50"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(139, 92, 246, 0.05)',
            opacity: isVisible ? 1 : 0,
            textShadow: 'none',
            fontFamily: currentFont || 'inherit',
            maxWidth: '250px',
            transformOrigin: getTransformOrigin(),
            transform: isVisible ? 'scale(1) translateY(0)' : getTransformValue(),
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
        >
          {html ? (
            <div dangerouslySetInnerHTML={{ __html: text }} />
          ) : (
            text
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default Tooltip;