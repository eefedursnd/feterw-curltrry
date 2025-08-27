'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IoVolumeMute, IoVolumeMedium } from 'react-icons/io5';
import DOMPurify from 'isomorphic-dompurify';
import Image from 'next/image';
import { useAudioStore } from './audioManager';

interface MediaPlayerProps {
    backgroundUrl?: string;
    audioUrl?: string;
    overlayText?: string;
    backgroundBlur?: number;
}

const MediaPlayer = ({ backgroundUrl, audioUrl, overlayText, backgroundBlur }: MediaPlayerProps) => {
    const {
        isPlaying, setIsPlaying,
        isMuted, setIsMuted,
        volume, setVolume, setCurrentTime,
        setAudioElement, setDuration,
        setVideoElement
    } = useAudioStore();

    const [isVolumeHovered, setIsVolumeHovered] = useState(false);
    const [isVideo, setIsVideo] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);
    const [overlayFading, setOverlayFading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [posterImage, setPosterImage] = useState<string | undefined>(undefined);
    const [videoIsPlaying, setVideoIsPlaying] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const cleanOverlayText = overlayText ? DOMPurify.sanitize(overlayText) : '';

    useEffect(() => {
        if (audioRef.current && audioUrl) {
            setAudioElement(audioRef.current);

            const onDurationChange = () => {
                if (audioRef.current && isFinite(audioRef.current.duration)) {
                    setDuration(audioRef.current.duration);
                    console.log("Duration set to:", audioRef.current.duration);
                }
            };

            const onTimeUpdate = () => {
                if (audioRef.current) {
                    setCurrentTime(audioRef.current.currentTime);
                }
            };

            const onLoadedMetadata = () => {
                if (audioRef.current && isFinite(audioRef.current.duration)) {
                    setDuration(audioRef.current.duration);
                    console.log("Metadata loaded, duration:", audioRef.current.duration);
                }
            };

            const onEnded = () => {
                setIsPlaying(false);
            };

            // Try to set duration immediately if available
            if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
                setDuration(audioRef.current.duration);
                console.log("Initial duration set to:", audioRef.current.duration);
            }

            // Add event listeners
            audioRef.current.addEventListener('durationchange', onDurationChange);
            audioRef.current.addEventListener('timeupdate', onTimeUpdate);
            audioRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
            audioRef.current.addEventListener('ended', onEnded);

            return () => {
                if (audioRef.current) {
                    audioRef.current.removeEventListener('durationchange', onDurationChange);
                    audioRef.current.removeEventListener('timeupdate', onTimeUpdate);
                    audioRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
                    audioRef.current.removeEventListener('ended', onEnded);
                }
                setAudioElement(null);
            };
        }
    }, [audioUrl, setAudioElement, setCurrentTime, setDuration, setIsPlaying]);

    useEffect(() => {
        if (videoRef.current && isVideo) {
            setVideoElement(videoRef.current);

            return () => {
                setVideoElement(null);
            };
        }
    }, [isVideo, setVideoElement]);

    useEffect(() => {
        if (backgroundUrl) {
            const lowerCaseUrl = backgroundUrl.toLowerCase();
            const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
            const calculatedIsVideo = !imageExtensions.some(ext => lowerCaseUrl.endsWith(ext));
            setIsVideo(calculatedIsVideo);

            if (calculatedIsVideo) {
                const baseUrl = backgroundUrl.substring(0, backgroundUrl.lastIndexOf('.'));
                setPosterImage(`${baseUrl}.jpg`);

                const preloadVideo = document.createElement('video');
                preloadVideo.src = backgroundUrl;
                preloadVideo.preload = 'auto';
                preloadVideo.muted = true;
                preloadVideo.load();
            }
        }
    }, [backgroundUrl]);

    useEffect(() => {
        const applyInitialSettings = () => {
            if (audioRef.current) {
                audioRef.current.volume = volume;
                audioRef.current.muted = isMuted;
            }

            if (videoRef.current) {
                videoRef.current.volume = volume;
                videoRef.current.muted = audioUrl ? true : isMuted;
            }
        };

        applyInitialSettings();
        const timeoutId = setTimeout(applyInitialSettings, 500);
        return () => clearTimeout(timeoutId);
    }, [volume, isMuted, audioUrl]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
            audioRef.current.volume = volume;
        }

        if (videoRef.current) {
            videoRef.current.muted = audioUrl ? true : isMuted;
            videoRef.current.volume = volume;
        }
    }, [isMuted, volume, audioUrl]);

    useEffect(() => {
        // Handle audio playback
        if (audioRef.current) {
            if (isPlaying && audioRef.current.paused) {
                audioRef.current.play().catch(err => {
                    console.error("Error playing audio:", err);
                    setError("Could not play audio");
                });
            } else if (!isPlaying && !audioRef.current.paused) {
                audioRef.current.pause();
            }
        }

        // For videos, only control based on entry overlay
        // We want the video to continue playing regardless of audio pausing
        if (videoRef.current && !showOverlay && !videoIsPlaying) {
            videoRef.current.play().catch(err => {
                console.error("Error playing video:", err);
                setError("Could not play video");
            });
            setVideoIsPlaying(true);
        }
    }, [isPlaying, showOverlay, videoIsPlaying]);

    const handleClick = async () => {
        try {
            if (showOverlay) {
                setOverlayFading(true);

                setTimeout(() => {
                    setShowOverlay(false);
                    setOverlayFading(false);
                }, 750);

                setIsPlaying(true);
                setIsMuted(false);

                // Start video independently
                if (videoRef.current && isVideo) {
                    videoRef.current.play().catch(err => {
                        console.error("Error playing video:", err);
                    });
                    setVideoIsPlaying(true);
                }
            } else {
                // Only toggle audio playback
                setIsPlaying(false);
            }
        } catch (err) {
            setError(`Failed to play media`);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
    };

    return (
        <div className="relative h-full">
            {backgroundUrl && isVideo ? (
                <div className="fixed inset-0 w-full h-full">
                    <div className="absolute inset-0 z-10" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: backgroundBlur ? `blur(${backgroundBlur}px)` : 'none' }} />
                    <video
                        ref={videoRef}
                        src={backgroundUrl}
                        poster={posterImage}
                        className="w-full h-full object-cover z-0"
                        loop
                        playsInline
                        preload="auto"
                        muted={audioUrl ? true : isMuted}
                    />
                </div>
            ) : backgroundUrl ? (
                <div className="fixed inset-0 w-full h-full">
                    <div className="absolute inset-0 z-10" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: backgroundBlur ? `blur(${backgroundBlur}px)` : 'none' }} />
                    <Image
                        src={backgroundUrl}
                        className="fixed inset-0 w-full h-full object-cover"
                        style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(50px)' }}
                        width={1920}
                        height={1080}
                        alt="Background"
                        priority
                        draggable="false"
                    />
                </div>
            ) : null}

            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    loop
                    playsInline
                    preload="auto"
                />
            )}

            {isPlaying && (audioUrl || (isVideo && !audioUrl)) && (
                <div
                    className="fixed top-4 left-4 flex items-center z-[101] bg-black/40 backdrop-blur-sm rounded-lg"
                    onMouseEnter={() => setIsVolumeHovered(true)}
                    onMouseLeave={() => setIsVolumeHovered(false)}
                >
                    <button
                        onClick={toggleMute}
                        className="p-2 text-white/90 hover:text-white transition-colors"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? (
                            <IoVolumeMute className="w-5 h-5" />
                        ) : (
                            <IoVolumeMedium className="w-5 h-5" />
                        )}
                    </button>
                    <div
                        className={`overflow-hidden transition-all duration-300 flex items-center ${isVolumeHovered ? 'w-24 mr-2' : 'w-0'}`}
                    >
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
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
                                background: `linear-gradient(to right, white 0%, white ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) 100%)`
                            }}
                        />
                    </div>
                </div>
            )}

            {showOverlay && (
                <div
                    onClick={handleClick}
                    className={`fixed inset-0 bg-black flex items-center justify-center cursor-pointer z-[100] transition-opacity duration-750 ease-in-out ${overlayFading ? 'opacity-0' : 'opacity-100'}`}
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.98)' }}
                >
                    <div className="text-center">
                        {cleanOverlayText ? (
                            <div
                                className="text-white text-2xl md:text-4xl"
                                dangerouslySetInnerHTML={{ __html: cleanOverlayText }}
                            />
                        ) : (
                            <div className="text-white text-2xl md:text-4xl">
                                {overlayText || 'Click to enter...'}
                            </div>
                        )}
                        {error && <div className="text-red-500 mt-2">{error}</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaPlayer;