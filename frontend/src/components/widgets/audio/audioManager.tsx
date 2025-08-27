'use client';

import { create } from 'zustand';

type AudioState = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  audioElement: HTMLAudioElement | null;
  videoElement: HTMLVideoElement | null;
  
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (isMuted: boolean) => void;
  setAudioElement: (element: HTMLAudioElement | null) => void;
  setVideoElement: (element: HTMLVideoElement | null) => void;
  
  togglePlay: () => void;
  handleSeek: (time: number) => void;
  handleSkip: (seconds: number) => void;
  toggleMute: () => void;
  handleVolumeChange: (volume: number) => void;
  initializeAudioElement: (element: HTMLAudioElement) => void;
};

export const useAudioStore = create<AudioState>((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.12,
  isMuted: false,
  audioElement: null,
  videoElement: null,

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setIsMuted: (isMuted) => set({ isMuted }),
  
  setAudioElement: (element) => {
    set({ audioElement: element });
    
    // As soon as we set the audio element, we also try to get its duration
    if (element && isFinite(element.duration) && element.duration > 0) {
      set({ duration: element.duration });
    }
  },
  
  setVideoElement: (element) => set({ videoElement: element }),

  initializeAudioElement: (element) => {
    set({ audioElement: element });
    
    // Setup listeners right away
    const onDurationChange = () => {
      if (element && isFinite(element.duration) && element.duration > 0) {
        set({ duration: element.duration });
      }
    };
    
    const onTimeUpdate = () => {
      if (element) {
        set({ currentTime: element.currentTime });
      }
    };
    
    const onLoadedMetadata = () => {
      if (element && isFinite(element.duration) && element.duration > 0) {
        set({ duration: element.duration });
      }
    };
    
    // Try to set duration immediately if available
    if (element && isFinite(element.duration) && element.duration > 0) {
      set({ duration: element.duration });
    }
    
    // Add event listeners
    element.addEventListener('durationchange', onDurationChange);
    element.addEventListener('timeupdate', onTimeUpdate);
    element.addEventListener('loadedmetadata', onLoadedMetadata);
    
    // Return cleanup function to be called by component
    return () => {
      element.removeEventListener('durationchange', onDurationChange);
      element.removeEventListener('timeupdate', onTimeUpdate);
      element.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  },

  togglePlay: () => {
    const { isPlaying, audioElement } = get();
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play().catch(err => {
        console.error("Error playing audio:", err);
      });
    }
    set({ isPlaying: !isPlaying });
  },

  handleSeek: (time) => {
    const { audioElement } = get();
    if (!audioElement) return;

    const validTime = Math.min(Math.max(time, 0), isFinite(audioElement.duration) ? audioElement.duration : 0);
    audioElement.currentTime = validTime;
    set({ currentTime: validTime });
  },

  handleSkip: (seconds) => {
    const { audioElement } = get();
    if (!audioElement) return;

    const audioDuration = isFinite(audioElement.duration) ? audioElement.duration : 0;
    const newTime = Math.min(Math.max(audioElement.currentTime + seconds, 0), audioDuration);
    audioElement.currentTime = newTime;
    set({ currentTime: newTime });
  },

  toggleMute: () => {
    const { isMuted, audioElement } = get();
    if (!audioElement) return;
    
    const newMutedState = !isMuted;
    audioElement.muted = newMutedState;
    set({ isMuted: newMutedState });
  },

  handleVolumeChange: (newVolume) => {
    const { audioElement } = get();
    if (!audioElement) return;

    audioElement.volume = newVolume;
    set({ 
      volume: newVolume,
      isMuted: newVolume === 0 
    });
  }
}));