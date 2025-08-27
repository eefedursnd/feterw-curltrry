'use client';

import { ReactNode } from 'react';
import CursorEffectProvider from './CursorEffectProvider';
import ReportButton from './buttons/ReportButton';
import { useUser } from 'haze.bio/context/UserContext';
import { User } from 'haze.bio/types';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import Tooltip from 'haze.bio/components/ui/Tooltip';

interface ClientEffectsContainerProps {
    children: ReactNode;
    cursorEffect?: string | null;
    isPremium?: boolean;
    profileUsername?: string;
    user: User;
}

export default function ClientEffectsContainer({
    children,
    cursorEffect,
    isPremium = false,
    profileUsername,
    user,
}: ClientEffectsContainerProps) {
    const { user: currentUser } = useUser();
    const showProfileButtons = profileUsername && profileUsername !== currentUser?.username;

    return (
        <>
            {cursorEffect && <CursorEffectProvider effect={cursorEffect} isPremium={isPremium} />}

            {children}

            {/* Action Buttons Container */}
            {showProfileButtons && (
                <div className="fixed bottom-4 right-4 z-10 flex items-center gap-2">
                    {/* Report Button */}
                    <ReportButton profileUsername={profileUsername} currentUser={currentUser} />
                </div>
            )}

            {/* Modern Subtle Watermark */}
            {!isPremium && (
                <div className="fixed bottom-3 left-3 z-10">
                    <Tooltip text="Create your own profile" position="right">
                        <Link
                            href="https://cutz.lol"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-black/30 hover:bg-black/50 backdrop-blur-sm p-1.5 px-2.5 rounded-full 
                                border border-zinc-800/40 hover:border-purple-500/30 flex items-center gap-1.5 
                                group transition-all duration-300 opacity-30 hover:opacity-90"
                        >
                            <Sparkles className="w-3 h-3 text-white group-hover:text-purple-300" />
                            <span className="text-xs font-medium text-white group-hover:text-white/90">
                                cutz.lol
                            </span>
                        </Link>
                    </Tooltip>
                </div>
            )}
        </>
    );
}