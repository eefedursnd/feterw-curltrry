'use client';

import { ChevronDown, Sparkles, X, Lock, Crown } from 'lucide-react';
import { User, UserProfile } from 'haze.bio/types';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from 'haze.bio/context/UserContext';

interface EffectsDropdownProps {
  profile: UserProfile;
  onEffectChange: (effect: string) => void;
  isPremium: boolean;
}

const effects = [
  { id: 'none', name: 'None', description: 'No username effect' },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Smooth color transition effect',
    class: 'bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent'
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    description: 'Animated multi-color rainbow effect',
    class: 'bg-[linear-gradient(to_right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] bg-clip-text text-transparent animate-rainbow',
  },
  {
    id: 'cyber',
    name: 'Cyber',
    description: 'Neon glow for a cyberpunk look',
    class: 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]',
  },
  {
    id: 'glitch',
    name: 'Glitch',
    description: 'Digital distortion effect that shifts text',
    class: 'animate-glitch text-white',
    premium: false
  },
  {
    id: 'retro',
    name: 'Retro',
    description: 'Vintage color shifting animation',
    class: 'animate-retro',
    premium: false
  },
  {
    id: '3d',
    name: '3D Bounce',
    description: 'Character-by-character bouncing animation',
    class: 'animate-3d text-white',
    premium: false,
    needsSpan: true
  },
  {
    id: 'hacker',
    name: 'Hacker Type',
    description: 'Character-by-character typing animation',
    class: 'animate-hacker',
    premium: true,
    needsSpan: true
  },
];

export default function EffectsDropdown({ profile, onEffectChange, isPremium }: EffectsDropdownProps) {
  const { user: contextUser } = useUser();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentEffect = profile.username_effects || 'none';
  const currentEffectData = effects.find(e => e.id === currentEffect);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEffectSelection = (effect: string) => {
    if (!isPremium && effects.find(e => e.id === effect)?.premium) {
      return;
    }
    onEffectChange(effect);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 bg-black/40 rounded-lg border border-zinc-800/50 hover:border-zinc-700/50 
                 hover:bg-zinc-900/30 transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-black/40 border border-zinc-800/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white/80" />
          </div>
          <span className={`text-sm text-white`}>
            {currentEffectData?.name || 'None'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''
          }`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1.5 z-20 bg-black border border-zinc-800/50 rounded-lg 
                      shadow-xl shadow-black/50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto py-1.5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {effects.map((effect) => {
              const isSelected = currentEffect === effect.id;
              const isPremiumLocked = effect.premium && !isPremium;

              return (
                <button
                  key={effect.id}
                  onClick={() => !isPremiumLocked && handleEffectSelection(effect.id)}
                  className={`w-full px-3 py-2 flex items-center justify-between transition-colors
                            ${isSelected
                      ? 'bg-purple-900/20 hover:bg-purple-900/30'
                      : isPremiumLocked
                        ? 'bg-transparent opacity-60 cursor-default'
                        : 'hover:bg-zinc-800/20'
                    }`}
                >
                  <div className="flex flex-col space-y-1 w-full">
                    <div className="flex items-center gap-2">
                      {isPremiumLocked && (
                        <Lock className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                      {effect.needsSpan ? (
                        <span className={`text-sm ${effect.class || 'text-white'}`}>
                          {Array.from(effect.name).map((char, i) => (
                            <span
                              key={i}
                              style={{
                                '--char-index': i,
                                ...(char === ' ' ? { marginRight: '-0.25em' } : {})
                              } as React.CSSProperties}
                            >
                              {char === ' ' ? '\u00A0' : char}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className={`text-sm ${effect.class || 'text-white'}`}>
                          {effect.name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 text-left">{effect.description}</span>
                  </div>

                  {isPremiumLocked && (
                    <span className="text-xs font-medium text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded-full border border-purple-800/30">
                      Premium
                    </span>
                  )}

                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-purple-500/80 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {!isPremium && (
            <Link href="/pricing" className="group block mt-1 px-3 py-3 border-t border-zinc-800/50 bg-gradient-to-r from-purple-900/20 to-purple-800/10 hover:from-purple-900/30 hover:to-purple-800/20 transition-all duration-300">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-purple-900/30 flex items-center justify-center border border-purple-800/30 group-hover:scale-110 transition-transform">
                  <Crown className="w-3 h-3 text-purple-300" />
                </div>
                <span className="text-purple-200">Unlock premium effects with Premium</span>
                <span className="ml-auto text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/30 group-hover:bg-purple-900/60 transition-colors">
                  Upgrade
                </span>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}