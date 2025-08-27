'use client';

import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { DomainWithDetails } from 'haze.bio/types/domain';

interface RemoveDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainDetail: DomainWithDetails | null;
  username: string;
  alias: string;
  onSubmit: () => void; // No longer needs specific subdomain
  isLoading: boolean;
}

export default function RemoveDomainModal({
  isOpen,
  onClose,
  domainDetail,
  username,
  alias,
  onSubmit,
  isLoading
}: RemoveDomainModalProps) {
  if (!isOpen || !domainDetail) return null;

  const subdomain = alias || username; // Prefer alias, fallback to username
  const fullDomainUrl = `${subdomain}.${domainDetail.domain.name}`;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
      <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-900/20 rounded-lg flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Remove Domain Assignment</h3>
              <p className="text-xs text-white/60">Confirm removal of <code className="text-purple-300">{domainDetail.domain.name}</code></p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-900/20 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Warning</h4>
                <p className="text-xs text-white/60">
                  You are about to remove the assignment for the domain <code className="text-purple-300">{domainDetail.domain.name}</code>. Your profile will no longer be accessible at:
                </p>
                <code className="block mt-2 bg-black p-2 rounded border border-zinc-800 text-purple-300 text-xs">
                  {fullDomainUrl}
                </code>
                <p className="text-xs text-white/60 mt-2">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-900/20 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Consequences</h4>
                <ul className="text-xs text-white/60 space-y-1.5 list-disc pl-4">
                  <li>The URL <code className="text-purple-300">{fullDomainUrl}</code> will no longer point to your profile.</li>
                  <li>Any links using this specific URL will stop working.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-800/50 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit} // Calls the simplified handler
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Assignment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}