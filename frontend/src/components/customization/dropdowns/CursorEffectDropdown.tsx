'use client';

import { ChevronDown, MousePointer, Lock, Crown } from 'lucide-react';
import { User, UserProfile } from 'haze.bio/types';
import { useState, useRef, useEffect } from 'react';
import {
    ghostCursor,
    followingDotCursor,
    bubbleCursor,
    snowflakeCursor,
    CursorEffectResult
} from 'cursor-effects';
import Link from 'next/link';
import { useUser } from 'haze.bio/context/UserContext';

interface CursorEffectDropdownProps {
    profile: UserProfile;
    onCursorEffectChange: (effect: string) => void;
    isPremium: boolean;
}

const cursorEffects = [
    { id: 'none', name: 'None', description: 'No cursor effect' },
    {
        id: 'ghost',
        name: 'Ghost Following',
        description: 'Trailing ghost cursors that follow your movement',
        premium: false
    },
    {
        id: 'dot',
        name: 'Following Dot',
        description: 'Smooth following dot that trails behind your cursor',
        premium: false
    },
    {
        id: 'bubble',
        name: 'Bubble Particles',
        description: 'Colorful bubble particles appear as you move',
        premium: true
    },
    {
        id: 'snowflake',
        name: 'Snowflake Particles',
        description: 'Snowflakes fall from your cursor as you move',
        premium: true
    },
];

export default function CursorEffectDropdown({ profile, onCursorEffectChange, isPremium }: CursorEffectDropdownProps) {
    const { user: contextUser } = useUser();
    
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const currentEffect = profile.cursor_effects || 'none';
    const currentEffectData = cursorEffects.find(e => e.id === currentEffect);
    const [previewCursor, setPreviewCursor] = useState<CursorEffectResult | null>(null);

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

    useEffect(() => {
        if (!previewRef.current) return;

        if (previewCursor) {
            try {
                previewCursor.destroy();
            } catch (error) {
                console.error("Error destroying previous cursor effect:", error);
            }
        }

        if (currentEffect === 'none') {
            setPreviewCursor(null);
            return;
        }

        let newEffect: CursorEffectResult | null = null;

        try {
            switch (currentEffect) {
                case 'ghost':
                    newEffect = ghostCursor({
                        element: previewRef.current,
                    });
                    break;
                case 'dot':
                    newEffect = followingDotCursor({
                        element: previewRef.current,
                    });
                    break;
                case 'bubble':
                    newEffect = bubbleCursor({
                        element: previewRef.current,
                    });
                    break;
                case 'snowflake':
                    newEffect = snowflakeCursor({
                        element: previewRef.current,
                    });
                    break;
            }

            setPreviewCursor(newEffect);
        } catch (error) {
            console.error(`Error initializing cursor effect '${currentEffect}':`, error);
        }

        return () => {
            if (newEffect) {
                try {
                    newEffect.destroy();
                } catch (error) {
                    console.error("Error cleaning up cursor effect:", error);
                }
            }
        };
    }, [currentEffect]);

    const handleEffectSelection = (effect: string) => {
        if (!isPremium && cursorEffects.find(e => e.id === effect)?.premium) {
            return;
        }
        onCursorEffectChange(effect);
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
                        <MousePointer className="w-3.5 h-3.5 text-white/80" />
                    </div>
                    <span className="text-sm text-white">
                        {currentEffectData?.name || 'None'}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1.5 z-20 bg-black border border-zinc-800/50 rounded-lg 
                      shadow-xl shadow-black/50 overflow-hidden">
                    <div className="max-h-64 overflow-y-auto py-1.5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {cursorEffects.map((effect) => {
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
                                            <span className="text-sm text-white">
                                                {effect.name}
                                            </span>
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
                                <span className="text-purple-200">Unlock premium cursor effects with Premium</span>
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