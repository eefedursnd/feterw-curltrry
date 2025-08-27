import { useEffect, useState, forwardRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerPortalProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
  targetRect: DOMRect | null;
}

const ColorPickerPortal = forwardRef<HTMLDivElement, ColorPickerPortalProps>(
  ({ color, onChange, onClose, targetRect }, ref) => {
    const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);
    const [localColor, setLocalColor] = useState(color);
    const [hexInput, setHexInput] = useState(color.replace('#', ''));
    const [isValidHex, setIsValidHex] = useState(true);

    useEffect(() => {
      setLocalColor(color);
      setHexInput(color.replace('#', ''));
    }, [color]);

    useEffect(() => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      setPortalElement(element);

      return () => {
        document.body.removeChild(element);
      };
    }, []);

    const handleColorChange = useCallback((newColor: string) => {
      setLocalColor(newColor);
      setHexInput(newColor.replace('#', ''));
    }, []);

    const applyColorChange = useCallback(() => {
      if (isValidHex && localColor !== color) {
        onChange(localColor);
      }
    }, [localColor, color, isValidHex, onChange]);

    // Handle hex input changes
    const handleHexChange = useCallback((value: string) => {
      value = value.replace('#', '');
      setHexInput(value);

      const isValid = /^[0-9A-Fa-f]{6}$/.test(value);
      setIsValidHex(isValid);

      if (isValid) {
        const newColor = `#${value}`;
        setLocalColor(newColor);
      }
    }, []);

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        } else if (event.key === 'Enter' && isValidHex) {
          applyColorChange();
          onClose();
        }
      };

      const handleClickOutside = (event: MouseEvent) => {
        if (ref && 'current' in ref && ref.current &&
            !ref.current.contains(event.target as Node)) {
          applyColorChange(); // Apply color when clicking outside
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [onClose, ref, isValidHex, applyColorChange]);

    const handleColorPickerChangeComplete = useCallback(() => {
      applyColorChange();
    }, [applyColorChange]);

    const handleHexInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && isValidHex) {
        applyColorChange();
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    if (!targetRect || !portalElement) return null;

    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    let top = targetRect.bottom + window.scrollY + 10;
    let left = targetRect.left + window.scrollX - 100 + targetRect.width / 2;

    const PICKER_WIDTH = 232;
    const PICKER_HEIGHT = 280;

    if (left + PICKER_WIDTH > windowWidth) {
      left = windowWidth - PICKER_WIDTH - 16;
    }
    if (left < 16) {
      left = 16;
    }

    if (top + PICKER_HEIGHT > windowHeight + window.scrollY) {
      top = targetRect.top + window.scrollY - PICKER_HEIGHT - 10;
    }

    const colorPreviewStyle = {
      backgroundColor: isValidHex ? localColor : '#FF0000',
      width: '28px',
      height: '28px',
      borderRadius: '4px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    };

    return createPortal(
      <div
        ref={ref}
        style={{
          position: 'absolute',
          top: `${top}px`,
          left: `${left}px`,
          zIndex: 9999,
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in"
      >
        <div className="p-3 sm:p-4 bg-black/90 backdrop-blur-xl rounded-lg shadow-2xl border border-zinc-800/50 
                        flex flex-col items-center gap-3 sm:gap-4 w-[280px] sm:w-auto">
          <HexColorPicker
            color={localColor}
            onChange={handleColorChange}
            onMouseUp={handleColorPickerChangeComplete}
            onTouchEnd={handleColorPickerChangeComplete}
            className="color-picker !w-[232px] sm:!w-[200px] !h-[200px]"
          />

          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <span className="text-purple-400">#</span>
              </div>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                onKeyDown={handleHexInputKeyDown}
                onBlur={applyColorChange}
                maxLength={6}
                className={`w-full pl-6 pr-2 py-2 sm:py-1.5 bg-black/50 rounded-md border text-base sm:text-sm 
                          focus:outline-none focus:ring-1 transition-colors 
                          ${isValidHex
                    ? 'border-zinc-800/50 focus:ring-purple-500/30 text-white'
                    : 'border-red-500/50 focus:ring-red-500/20 text-red-500'}`}
                placeholder="000000"
              />
            </div>
            <div style={colorPreviewStyle}></div>
          </div>
        </div>
      </div>,
      portalElement
    );
  }
);

ColorPickerPortal.displayName = 'ColorPickerPortal';

export default ColorPickerPortal;