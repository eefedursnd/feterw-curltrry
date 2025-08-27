"use client";

import React, { useState, useEffect } from 'react';
import { ExternalLink, X, Shield, ArrowUpRight } from 'lucide-react';
import { createPortal } from 'react-dom';

interface RedirectModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RedirectModal({ url, isOpen, onClose, onConfirm }: RedirectModalProps) {
  const [displayUrl, setDisplayUrl] = useState('');
  const [isSafe, setIsSafe] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (url) {
      try {
        const urlObj = new URL(url);
        setIsSafe(urlObj.protocol === 'https:');

        let formattedUrl = urlObj.hostname + urlObj.pathname;
        if (urlObj.search) formattedUrl += urlObj.search;
        if (formattedUrl.length > 40) {
          formattedUrl = formattedUrl.substring(0, 40) + '...';
        }
        setDisplayUrl(formattedUrl);
      } catch (e) {
        setDisplayUrl(url);
        setIsSafe(false);
      }
    }
  }, [url]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[9999] p-4">
      <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-800/20 rounded-lg flex items-center justify-center">
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <h3 className="text-sm font-medium text-white">External Link</h3>
          </div>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content - Simplified */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 p-2 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
            <div className={`w-2.5 h-2.5 rounded-full ${isSafe ? 'bg-green-400' : 'bg-amber-400'}`}></div>
            <span className="text-sm text-white/80 truncate flex-1">
              {displayUrl}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
          </div>
          
          <div className="mt-2 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <p className="text-xs text-white/60">
              You're leaving haze.bio to visit an external site
            </p>
          </div>
        </div>

        {/* Footer - Simplified */}
        <div className="px-4 py-3 border-t border-zinc-800/50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-xs"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-xs flex items-center gap-1.5"
          >
            Continue
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}