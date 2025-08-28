'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileIcon, ImageIcon, Film, Music, Loader2 } from 'lucide-react';
import { fileAPI } from 'haze.bio/api';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface FileUploadProps {
    onUpload: (fileName: string) => void;
    accept?: Record<string, string[]>;
    label?: string;
    currentUrl?: string;
    fileType: 'avatar_url' | 'background_url' | 'audio_url' | 'custom_badge' | 'cursor_url' | 'banner_url' | 'custom_social' | 'template_preview';
    badgeId?: number;
}

interface UseFileUploadResult {
    openFileUploadDialog: () => void;
    isUploading: boolean;
    uploadProgress: number;
    handleRemove: () => Promise<void>;
    currentUrl?: string;
}

export const useFileUpload = (
    onUpload: (fileName: string) => void,
    accept?: Record<string, string[]>,
    fileType?: 'avatar_url' | 'background_url' | 'audio_url' | 'custom_badge' | 'cursor_url' | 'banner_url' | 'custom_social' | 'template_preview',
    badgeId?: number,
    currentUrl?: string
): UseFileUploadResult => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            try {
                setIsUploading(true);
                setUploadProgress(0);
                const file = acceptedFiles[0];

                if (file.size > 75 * 1024 * 1024) {
                    toast.error('File size exceeds 75MB limit');
                    setIsUploading(false);
                    return;
                }

                // More realistic progress simulation for large files
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        if (prev >= 85) {
                            clearInterval(progressInterval);
                            return 85;
                        }
                        return prev + 5;
                    });
                }, 1000);

                const fileURL = await fileAPI.uploadFile(fileType || 'avatar_url', file, badgeId);
                clearInterval(progressInterval);
                setUploadProgress(100);
                onUpload(fileURL);

                setTimeout(() => {
                    setUploadProgress(0);
                    setIsUploading(false);
                }, 500);

            } catch (error) {
                console.error('Error uploading file:', error);
                if (error instanceof Error && error.message.includes('timeout')) {
                    toast.error('Upload timeout - file is too large or connection is slow. Please try a smaller file or check your internet connection.');
                } else {
                    toast.error('Failed to upload file');
                }
                setUploadProgress(0);
                setIsUploading(false);
            }
        }
    }, [fileType, onUpload, badgeId]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept,
        maxFiles: 1,
        disabled: isUploading
    });

    const openFileUploadDialog = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept ? Object.values(accept).flat().join(',') : '';
        input.onchange = async (e: any) => {
            if (e.target.files && e.target.files.length > 0) {
                await onDrop([e.target.files[0]]);
            }
        };
        input.click();
    };

    const handleRemove = async () => {
        try {
            if (!currentUrl) return;

            await fileAPI.deleteFile(currentUrl);
            onUpload('');
        } catch (error) {
            console.error('Error removing file:', error);
            toast.error('Failed to remove file');
        }
    };

    return {
        openFileUploadDialog,
        isUploading,
        uploadProgress,
        handleRemove,
        currentUrl
    };
};

export default function FileUpload({
    onUpload,
    accept,
    label,
    currentUrl,
    fileType,
    badgeId
}: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            try {
                setIsUploading(true);
                setUploadProgress(0);

                if (currentUrl) {
                    try {
                        await fileAPI.deleteFile(currentUrl);
                    } catch (deleteError) {
                        console.error('Error deleting old file:', deleteError);
                        toast.error('Failed to delete old file');
                        setIsUploading(false);
                        return;
                    }
                }

                const file = acceptedFiles[0];

                if (file.size > 75 * 1024 * 1024) {
                    toast.error('File size exceeds 75MB limit');
                    setIsUploading(false);
                    return;
                }

                // More realistic progress simulation for large files
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        if (prev >= 85) {
                            clearInterval(progressInterval);
                            return 85;
                        }
                        return prev + 5;
                    });
                }, 1000);

                const fileURL = await fileAPI.uploadFile(fileType, file, badgeId);
                clearInterval(progressInterval);
                setUploadProgress(100);
                onUpload(fileURL);

                setTimeout(() => {
                    setUploadProgress(0);
                    setIsUploading(false);
                }, 500);

            } catch (error) {
                console.error('Error uploading file:', error);
                if (error instanceof Error && error.message.includes('timeout')) {
                    toast.error('Upload timeout - file is too large or connection is slow. Please try a smaller file or check your internet connection.');
                } else {
                    toast.error('Failed to upload file');
                }
                setUploadProgress(0);
                setIsUploading(false);
            }
        }
    }, [fileType, onUpload, badgeId, currentUrl]);

    const handleRemove = async () => {
        try {
            if (!currentUrl) return;

            await fileAPI.deleteFile(currentUrl);
            onUpload('');
        } catch (error) {
            console.error('Error removing file:', error);
            toast.error('Failed to remove file');
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles: 1,
        disabled: isUploading
    });

    const getFileExtension = (url?: string) => {
        if (!url) return '';
        const baseUrl = url.split('?')[0];
        const extension = baseUrl.split('.').pop()?.toLowerCase() || '';
        return extension;
    };

    const getFileIcon = (extension: string) => {
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
            return <ImageIcon className="w-5 h-5 text-purple-400" />;
        }
        if (['mp4', 'webm'].includes(extension)) {
            return <Film className="w-5 h-5 text-purple-400" />;
        }
        if (['mp3', 'wav', 'ogg'].includes(extension)) {
            return <Music className="w-5 h-5 text-purple-400" />;
        }
        return <FileIcon className="w-5 h-5 text-purple-400" />;
    };

    const extension = getFileExtension(currentUrl);

    return (
        <div className="space-y-2 sm:space-y-3">
            <div
                className={`relative border transition-all bg-black/30
                     h-32 sm:h-48 w-full overflow-hidden rounded-xl
                     ${isUploading
                        ? 'cursor-not-allowed opacity-90 border-zinc-800/70'
                        : isDragActive
                            ? 'cursor-pointer border-purple-500/50 bg-purple-900/10'
                            : 'cursor-pointer border-zinc-800/50 hover:border-purple-500/30 hover:bg-black/40'}`}
            >
                <input {...getInputProps()} />

                {currentUrl ? (
                    <div className="relative group h-full" {...getRootProps()}>
                        <input {...getInputProps()} />
                        {extension === 'mp4' ? (
                            <video
                                src={currentUrl}
                                className="w-full h-full object-cover"
                                poster={currentUrl + '?poster=true'}
                            />
                        ) : ['mp3', 'wav', 'ogg'].includes(extension) ? (
                            <div className="flex items-center justify-center h-full bg-black/30">
                                <Music className="w-12 h-12 text-purple-400/50" />
                            </div>
                        ) : !currentUrl || currentUrl === '' ? (
                            <div className="flex items-center justify-center h-full bg-black/30">
                                <FileIcon className="w-12 h-12 text-purple-400/50" />
                            </div>
                        ) : (
                            <Image
                                src={currentUrl}
                                draggable="false"
                                alt={label || 'Uploaded file'}
                                fill
                                priority
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, 640px"
                            />
                        )}

                        <div className="absolute top-2 right-2 flex items-center gap-1.5 sm:gap-2 
                                      bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1.5 text-white 
                                      text-[10px] sm:text-xs border border-zinc-800/50">
                            <div className="flex items-center gap-1 sm:gap-1.5">
                                {getFileIcon(extension)}
                                <span className="font-medium text-xs text-white/90 hidden sm:block">
                                    {extension.toUpperCase()}
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove();
                                }}
                                className="p-1 hover:bg-zinc-800/70 text-white/70 hover:text-white transition-colors rounded-md"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 sm:gap-4 
                                  text-zinc-400 p-4" {...getRootProps()}>
                        <input {...getInputProps()} />
                        <div className="p-3 sm:p-4 rounded-full bg-purple-800/10 border border-purple-800/20">
                            {isUploading ? (
                                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 animate-spin" />
                            ) : (
                                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                            )}
                        </div>
                        <div className="text-center">
                            <p className="text-xs sm:text-sm font-medium text-white">
                                {isUploading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        Uploading... {uploadProgress > 0 && `${uploadProgress}%`}
                                    </span>
                                ) : "Upload Media"}
                            </p>
                            <p className="text-[10px] sm:text-xs text-white/60 mt-1 sm:mt-1.5">
                                {isDragActive ? "Drop the file here" : "Drag & drop or click to select"}
                            </p>
                            <p className="text-[10px] sm:text-xs text-white/40 mt-1">
                                Max file size: 75MB
                            </p>
                        </div>
                    </div>
                )}

                {isUploading && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
                        <div
                            className="h-full bg-purple-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}