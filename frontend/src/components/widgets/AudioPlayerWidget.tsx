'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SkipBack, SkipForward, Pause, Play, Music, Volume2, VolumeX } from 'lucide-react';
import { UserProfile } from 'haze.bio/types';
import { useAudioStore } from './audio/audioManager';
import Image from 'next/image';

interface AudioPlayerWidgetProps {
    title?: string;
    style?: 'compact' | 'detailed';
    showCoverArt?: boolean;
    profile: UserProfile;
}

const AudioPlayerWidget = ({
    title = "Audio Player",
    style = 'compact',
    showCoverArt = true,
    profile
}: AudioPlayerWidgetProps) => {
    const [isVolumeHovered, setIsVolumeHovered] = useState(false);
    const {
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        togglePlay,
        handleSeek,
        handleSkip,
        toggleMute,
        handleVolumeChange
    } = useAudioStore();

    // Local state for UI updates
    const [localCurrentTime, setLocalCurrentTime] = useState(0);
    const [localDuration, setLocalDuration] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Update local state from store and setup polling
    useEffect(() => {
        // Initial update from props
        setLocalCurrentTime(currentTime);
        if (duration > 0) {
            setLocalDuration(duration);
        }

        // Set up polling to update every 100ms - this ensures smooth updates
        const updateValues = () => {
            const store = useAudioStore.getState();
            setLocalCurrentTime(store.currentTime);
            if (store.duration > 0) {
                setLocalDuration(store.duration);
            }
        };

        // Call immediately once
        updateValues();

        // Then set interval
        intervalRef.current = setInterval(updateValues, 100);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [currentTime, duration]);

    const audioUrl = profile?.audio_url || '';
    const hasAudio = Boolean(audioUrl);

    if (!hasAudio) {
        return (
            <div
                className="backdrop-blur-sm border border-white/10 rounded-lg p-4 text-white/70 text-center"
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: `${profile?.card_border_radius || 8}px`
                }}
            >
                No audio has been set for this profile.
            </div>
        );
    }

    const formatTime = (time: number): string => {
        if (!isFinite(time) || isNaN(time)) return '0:00';

        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Calculate progress width - use local state for rendering
    const progressWidthPercent = localDuration > 0
        ? Math.min((localCurrentTime / localDuration) * 100, 100)
        : 0;

    const textColor = profile?.text_color || 'white';
    const coverImageUrl = profile?.avatar_url || '';
    let background = `rgba(${parseInt((profile?.background_color || '#000000').slice(1, 3), 16)}, ${parseInt((profile?.background_color || '#000000').slice(3, 5), 16)}, ${parseInt((profile?.background_color || '#000000').slice(5, 7), 16)}, ${profile?.card_opacity * 0.9})`;

    if (style === 'compact') {
        return (
            <div
                className="backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-300 hover:border-white/20 relative"
                style={{
                    backgroundColor: background,
                    borderRadius: `${profile?.card_border_radius || 8}px`
                }}
            >
                <div className="p-4">
                    <div className="flex items-center gap-4">
                        {showCoverArt && (
                            <div className="relative flex-shrink-0 w-16 h-16 rounded-md">
                                {coverImageUrl ? (
                                    <div className="w-16 h-16 bg-black/20 flex items-center justify-center rounded-xl">
                                        <Image
                                            src={coverImageUrl}
                                            alt="Cover"
                                            className="w-full h-full object-cover rounded-xl"
                                            width={48}
                                            height={48}
                                            draggable="false"
                                            onError={(e) => {
                                                e.currentTarget.src = '/audio-placeholder.jpg';
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 bg-black/20 flex items-center justify-center rounded-xl">
                                        <Music size={24} className="text-white/60" />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h3
                                className="text-base font-semibold text-white truncate"
                                style={{ color: profile?.accent_color || 'white' }}
                            >
                                {title}
                            </h3>

                            <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: `${textColor}CC` }}>
                                    {formatTime(localCurrentTime)}
                                </span>

                                <div
                                    className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer relative my-auto"
                                    onClick={(e) => {
                                        if (localDuration <= 0) return;

                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const pos = (e.clientX - rect.left) / rect.width;
                                        handleSeek(pos * localDuration);
                                    }}
                                >
                                    <div
                                        className="h-full rounded-full absolute top-0 left-0"
                                        style={{
                                            width: `${progressWidthPercent > 0 ? progressWidthPercent : 0.1}%`,
                                            backgroundColor: profile?.accent_color || 'white'
                                        }}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs" style={{ color: `${textColor}CC` }}>
                                        {formatTime(localDuration)}
                                    </span>

                                    <button
                                        onClick={() => handleSkip(-10)}
                                        className="text-white/70 hover:text-white"
                                        title="Skip back 10 seconds"
                                    >
                                        <SkipBack size={14} color={profile?.accent_color || 'white'} />
                                    </button>

                                    <button
                                        onClick={togglePlay}
                                        className="text-white hover:text-white/80"
                                        title={isPlaying ? "Pause" : "Play"}
                                        aria-label={isPlaying ? "Pause" : "Play"}
                                    >
                                        {isPlaying ? <Pause size={16} color={profile?.accent_color || 'white'} /> : <Play size={16} color={profile?.accent_color || 'white'} />}
                                    </button>

                                    <button
                                        onClick={() => handleSkip(10)}
                                        className="text-white/70 hover:text-white"
                                        title="Skip forward 10 seconds"
                                    >
                                        <SkipForward size={14} color={profile?.accent_color || 'white'} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-300 hover:border-white/20 relative"
            style={{
                backgroundColor: background,
                borderRadius: `${profile?.card_border_radius || 8}px`
            }}
        >
            <div className="p-4 pt-6">
                <div className="flex items-start gap-4 mb-3">
                    {showCoverArt && (
                        <div className="relative flex-shrink-0 w-14 h-14 rounded-md">
                            {coverImageUrl ? (
                                <div className="w-14 h-14 bg-black/20 flex items-center justify-center rounded-xl">
                                    <Image
                                        src={coverImageUrl}
                                        alt="Cover"
                                        width={56}
                                        height={56}
                                        className="w-full h-full object-cover rounded-xl"
                                        draggable="false"
                                        onError={(e) => {
                                            e.currentTarget.src = '/audio-placeholder.jpg';
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="w-14 h-14 bg-black/20 flex items-center justify-center rounded-xl">
                                    <Music size={28} className="text-white/60" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <h3
                            className="text-base font-semibold text-white truncate"
                            style={{ color: profile?.accent_color || 'white' }}
                        >
                            {title}
                        </h3>

                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                    backgroundColor: isPlaying ?
                                        `${profile?.accent_color || '#ffffff'}33` :
                                        'rgba(255,255,255,0.1)',
                                    color: isPlaying ?
                                        profile?.accent_color || 'white' :
                                        'rgba(255,255,255,0.7)'
                                }}
                            >
                                {isPlaying ? "Playing" : "Paused"}
                            </span>
                            <span className="text-xs text-white/50">
                                {formatTime(localCurrentTime)} of {formatTime(localDuration)}
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative my-1"
                    onClick={(e) => {
                        if (localDuration <= 0) return;

                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos = (e.clientX - rect.left) / rect.width;
                        handleSeek(pos * localDuration);
                    }}
                >
                    <div
                        className="h-full rounded-full absolute top-0 left-0"
                        style={{
                            width: `${progressWidthPercent > 0 ? progressWidthPercent : 0.1}%`,
                            backgroundColor: profile?.accent_color || 'white'
                        }}
                    />
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => handleSkip(-15)}
                            className="text-white/70 hover:text-white"
                            title="Skip back 15 seconds"
                        >
                            <SkipBack size={16} color={profile?.accent_color || 'white'} />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="text-white hover:text-white/80"
                            title={isPlaying ? "Pause" : "Play"}
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause size={18} color={profile?.accent_color || 'white'} /> : <Play size={18} color={profile?.accent_color || 'white'} />}
                        </button>

                        <button
                            onClick={() => handleSkip(15)}
                            className="text-white/70 hover:text-white"
                            title="Skip forward 15 seconds"
                        >
                            <SkipForward size={16} color={profile?.accent_color || 'white'} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className="flex items-center"
                            onMouseEnter={() => setIsVolumeHovered(true)}
                            onMouseLeave={() => setIsVolumeHovered(false)}
                        >
                            <button
                                onClick={toggleMute}
                                className="text-white/60 hover:text-white transition-colors"
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 flex items-center ${isVolumeHovered ? 'w-20 ml-2' : 'w-0'}`}
                            >
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-2.5 
                [&::-webkit-slider-thumb]:h-2.5
                [&::-webkit-slider-thumb]:bg-white 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:border-none
                [&::-moz-range-thumb]:appearance-none
                [&::-moz-range-thumb]:w-2.5
                [&::-moz-range-thumb]:h-2.5
                [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:border-0
                [&::-ms-thumb]:appearance-none
                [&::-ms-thumb]:w-2.5
                [&::-ms-thumb]:h-2.5
                [&::-ms-thumb]:bg-white
                [&::-ms-thumb]:rounded-full
                [&::-ms-thumb]:border-0
                hover:bg-white/30 transition-colors"
                                    style={{
                                        background: `linear-gradient(to right, ${profile?.accent_color || 'white'} 0%, ${profile?.accent_color || 'white'} ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) 100%)`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayerWidget;