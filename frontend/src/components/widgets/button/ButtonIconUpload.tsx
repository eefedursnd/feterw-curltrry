'use client';

import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useFileUpload } from 'haze.bio/components/FileUpload';

interface ButtonIconUploadProps {
  currentIconUrl: string;
  onIconUpload: (url: string) => void;
  widgetId: string | number;
}

const ButtonIconUpload: React.FC<ButtonIconUploadProps> = ({ 
  currentIconUrl, 
  onIconUpload, 
  widgetId 
}) => {
  const {
    openFileUploadDialog,
    isUploading,
    uploadProgress,
    handleRemove,
  } = useFileUpload(
    onIconUpload,
    { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg'] },
    'custom_social',
    typeof widgetId === 'string' ? parseInt(widgetId) : widgetId,
    currentIconUrl
  );

  const addCacheBuster = (url: string) => {
    if (!url) return '';
    return `${url}?${new Date().getTime()}`;
  };

  return (
    <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 mt-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <ImageIcon className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-white">Button Icon</label>
          <p className="text-xs text-white/60">Upload an icon to display next to your button text</p>
        </div>
      </div>

      <div className="flex flex-col items-center bg-black/50 border border-zinc-800/50 rounded-lg p-4">
        <div
          onClick={openFileUploadDialog}
          className="w-16 h-16 bg-black/40 rounded-lg border border-zinc-800/50 flex items-center justify-center 
                overflow-hidden cursor-pointer hover:border-purple-500/30 transition-colors mb-3 relative"
        >
          {currentIconUrl ? (
            <Image
              src={addCacheBuster(currentIconUrl)}
              alt="Button Icon"
              width={64}
              height={64}
              className="object-contain"
              draggable="false"
            />
          ) : (
            <Upload className="w-6 h-6 text-white/30" />
          )}
          {isUploading && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black/50">
              <div 
                className="h-full bg-purple-600/50" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={openFileUploadDialog}
            className="px-3 py-1.5 bg-zinc-800/70 hover:bg-zinc-700/50 text-white text-xs rounded-md
                    transition-colors border border-zinc-800/50 flex items-center gap-2"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                {currentIconUrl ? 'Change Icon' : 'Upload Icon'}
              </>
            )}
          </button>
          
          {currentIconUrl && (
            <button
              onClick={() => handleRemove()}
              className="px-3 py-1.5 bg-zinc-800/70 hover:bg-red-900/30 text-white text-xs rounded-md
                     transition-colors border border-zinc-800/50 flex items-center gap-2"
              disabled={isUploading}
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ButtonIconUpload;