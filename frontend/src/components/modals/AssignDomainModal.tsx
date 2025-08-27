'use client';

import { X, Globe, AlertCircle, CheckCircle, Loader2, Link as LinkIcon, Info } from 'lucide-react';
import { Domain } from 'haze.bio/types/domain';

interface AssignDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: Domain | null;
  username: string;
  alias: string;
  onSubmit: () => void; // No longer needs subdomain parameter
  isLoading: boolean;
}

export default function AssignDomainModal({
  isOpen,
  onClose,
  domain,
  username,
  alias,
  onSubmit,
  isLoading
}: AssignDomainModalProps) {

  if (!isOpen || !domain) return null;

  const subdomain = alias || username; // Prefer alias, fallback to username
  const fullUrl = `${subdomain}.${domain.name}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(); // Call the simplified submit handler
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
      <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Confirm Domain Assignment</h3>
              <p className="text-xs text-white/60">Assign <code className="text-purple-300">{domain.name}</code> to your profile</p>
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
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-5">
            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0">
                  <LinkIcon className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    Your New URL
                  </h4>
                  <p className="text-xs text-white/60 mt-1">
                    Your profile will be accessible at the following URL using your {alias ? 'alias' : 'username'}:
                  </p>
                  <code className="block mt-2 bg-black p-2 rounded border border-zinc-800 text-purple-300 text-xs break-all">
                    https://{fullUrl}
                  </code>
                </div>
              </div>
            </div>

             <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Info className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    Confirmation
                  </h4>
                  <p className="text-xs text-white/60 mt-1">
                    Are you sure you want to assign the domain <code className="text-purple-300">{domain.name}</code>? This will make your profile available at <code className="text-purple-300">{fullUrl}</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-zinc-800/50 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <span>Confirm Assignment</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}