'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from 'haze.bio/types';
import Image from 'next/image';
import { ExternalLink, Loader2 } from 'lucide-react';
import RedirectModal from '../modals/RedirectModal';

interface ButtonWidgetProps {
  buttonText: string;
  url: string;
  style: 'filled' | 'outline' | 'ghost' | 'glass';
  shape: 'rounded' | 'pill' | 'square';
  size: 'small' | 'medium' | 'large';
  buttonColor: string;
  textColor: string;
  iconUrl: string;
  fullWidth: boolean;
  glowEffect: boolean;
  pulseAnimation: boolean;
  profile: UserProfile;
  useProfileColors?: boolean;
}

const ButtonWidget: React.FC<ButtonWidgetProps> = ({
  buttonText = 'Click Me',
  url = '',
  style = 'filled',
  shape = 'rounded',
  size = 'medium',
  buttonColor = '#8B5CF6',
  textColor = '#FFFFFF',
  iconUrl = '',
  fullWidth = false,
  glowEffect = false,
  pulseAnimation = false,
  profile,
  useProfileColors = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const actualButtonColor = useProfileColors ? profile?.accent_color || buttonColor : buttonColor;
  const actualTextColor = useProfileColors ? profile?.text_color || textColor : textColor;
  const borderRadius = profile?.card_border_radius || 8;

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);

    if (!url) {
      setError("Please provide a URL for the button");
    } else if (!buttonText) {
      setError("Please provide text for the button");
    } else {
      setError(null);
    }

    return () => clearTimeout(timer);
  }, [url, buttonText]);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Always prevent default to show the modal

    // If it's not a URL (e.g., text to copy), copy it directly without showing the modal
    if (!url.match(/^https?:\/\//i) && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
      try {
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    } else {
      // For actual URLs, show the confirm modal
      setIsModalOpen(true);
    }
  };

  const handleModalConfirm = () => {
    // User confirmed, open the URL in a new tab
    window.open(sanitizedUrl, '_blank', 'noopener,noreferrer');
    setIsModalOpen(false);
  };

  // Helper function to get button size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'py-1.5 px-3 text-sm';
      case 'large':
        return 'py-3 px-6 text-lg';
      case 'medium':
      default:
        return 'py-2 px-4 text-base';
    }
  };

  // Helper function to get button shape styles
  const getShapeStyles = () => {
    switch (shape) {
      case 'pill':
        return 'rounded-full';
      case 'square':
        return 'rounded-sm';
      case 'rounded':
      default:
        return 'rounded-lg';
    }
  };

  // Helper function to get button style (filled, outline, etc.)
  const getButtonStyles = () => {
    const baseStyles = `transition-all duration-300 font-medium ${getSizeStyles()} ${getShapeStyles()} ${fullWidth ? 'w-full' : ''}`;

    switch (style) {
      case 'outline':
        return `${baseStyles} border-2 bg-transparent hover:bg-opacity-10 hover:bg-white`;
      case 'ghost':
        return `${baseStyles} border-0 bg-transparent hover:bg-white hover:bg-opacity-10`;
      case 'glass':
        return `${baseStyles} border border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20`;
      case 'filled':
      default:
        return `${baseStyles} border-0 hover:opacity-90`;
    }
  };

  // Helper function for glow effect
  const getGlowEffect = () => {
    if (!glowEffect) return '';
    return `shadow-[0_0_15px_rgba(${parseInt(actualButtonColor.slice(1, 3), 16)},${parseInt(actualButtonColor.slice(3, 5), 16)},${parseInt(actualButtonColor.slice(5, 7), 16)},0.5)]`;
  };

  // Helper function for pulse animation
  const getPulseAnimation = () => {
    if (!pulseAnimation) return '';
    return 'animate-pulse';
  };

  if (error) {
    return (
      <div
        className="backdrop-blur-sm border border-white/10 rounded-lg p-4 text-center"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: `${borderRadius}px`
        }}
      >
        <div className="flex items-center justify-center gap-2 text-red-400">
          <ExternalLink className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const sanitizedUrl = url.match(/^https?:\/\//i) || url.startsWith('mailto:') || url.startsWith('tel:')
    ? url
    : `https://${url}`;

  return (
    <div className="flex justify-center items-center">
      {isLoading ? (
        <div className="w-full flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-white/60" />
        </div>
      ) : (
        <>
          <button
            onClick={handleButtonClick}
            className={`
                  ${getButtonStyles()} 
                  ${getGlowEffect()}
                  ${getPulseAnimation()}
                  inline-flex items-center justify-center gap-2
                  select-none
                `}
            style={{
              backgroundColor: style === 'filled' ? actualButtonColor : 'transparent',
              borderColor: style !== 'ghost' ? actualButtonColor : 'transparent',
              color: actualTextColor,
            }}
          >
            {iconUrl && (
              <div className="w-4 h-4 relative">
                <Image
                  src={iconUrl}
                  alt=""
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </div>
            )}
            <span>{buttonText}</span>
            {copySuccess && (
              <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                Copied!
              </span>
            )}
          </button>

          {/* Redirect Modal */}
          <RedirectModal
            url={sanitizedUrl}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleModalConfirm}
          />
        </>
      )}
    </div>
  );
};

export default ButtonWidget;