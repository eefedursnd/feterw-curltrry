'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, MessageSquare, AlertCircle, Beaker, CheckCircle } from 'lucide-react';

interface ExperimentalFeatureModalProps {
  featureKey: string;
  featureName: string;
  description: string;
  onAccept: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function ExperimentalFeatureModal({ 
  featureKey, 
  featureName, 
  description, 
  onAccept, 
  onClose,
  isOpen
}: ExperimentalFeatureModalProps) {
  if (!isOpen) return null;
  
  const handleAccept = () => {
    // Mark this modal as seen in localStorage
    localStorage.setItem(`experimental_${featureKey}_seen`, 'true');
    onAccept();
  };

  const handleClose = () => {
    // Mark this modal as seen in localStorage
    localStorage.setItem(`experimental_${featureKey}_seen`, 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
      <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">You've Been Selected!</h3>
              <p className="text-xs text-white/60">Exclusive experimental feature access</p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-5 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-purple-800/20 rounded-full flex items-center justify-center mb-4">
              <Beaker className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Try {featureName}</h3>
            <p className="text-sm text-white/70 max-w-xs mx-auto">
              You've been selected to test our newest feature before everyone else!
            </p>
          </div>

          {/* Feature description */}
          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  {featureName}
                  <span className="px-1.5 py-0.5 bg-purple-800/20 text-purple-300 rounded text-[10px] font-medium">BETA</span>
                </h4>
                <p className="text-xs text-white/60 mt-1">
                  {description}
                </p>
              </div>
            </div>
          </div>

          {/* Feedback section */}
          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Your Feedback Matters</h4>
                <p className="text-xs text-white/60 mt-1">
                  As an early tester, your experience helps us improve this feature before its full release.
                  Please report any bugs or share your thoughts!
                </p>
              </div>
            </div>
          </div>

          {/* Warning Info */}
          <div className="flex items-center gap-2 bg-purple-900/10 border border-purple-800/30 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <p className="text-xs text-white/60">
              Since this is an experimental feature, you might encounter occasional issues. We're actively 
              working to improve it based on tester feedback.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-end">
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Continue to Feature</span>
          </button>
        </div>
      </div>
    </div>
  );
}