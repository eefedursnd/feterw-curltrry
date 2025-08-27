'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Copy, Download, Share2, Link as LinkIcon, Check, ExternalLink, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { XIcon as SocialXIcon } from 'haze.bio/socials/Socials';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function ShareProfileModal({ isOpen, onClose, username }: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [profileUrl, setProfileUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'qr' | 'social'>('qr');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProfileUrl(`${window.location.origin}/${username}`);
    }
  }, [username]);
  
  useEffect(() => {
    if (isOpen && username && profileUrl) {
      generateQRCode();
    }
  }, [isOpen, username, profileUrl]);

  useEffect(() => {
    if (activeTab === 'qr' && qrCanvasRef.current && profileUrl) {
      generateQRCode();
    }
  }, [activeTab]);

  const generateQRCode = async () => {
    if (qrCanvasRef.current && profileUrl) {
      try {
        await QRCode.toCanvas(qrCanvasRef.current, profileUrl, {
          width: 180,
          margin: 2,
          color: {
            dark: '#ffffff',
            light: '#111111',
          },
        });
        
        const dataUrl = qrCanvasRef.current.toDataURL('image/png');
        setQrCodeUrl(dataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    }
  };

  const copyLink = () => {
    if (profileUrl) {
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `${username}-profile-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const shareOnTwitter = () => {
    const text = `Check out my profile on haze.bio: ${profileUrl}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank');
  };

  const shareOnReddit = () => {
    const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(profileUrl)}&title=${encodeURIComponent(`Check out my haze.bio profile`)}`;
    window.open(redditUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
      <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
              <Share2 className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Share Profile</h3>
              <p className="text-xs text-white/60">Share your haze.bio profile with others</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Profile URL Card - Always visible */}
          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <LinkIcon className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-medium text-white">Profile Link</h4>
            </div>
            
            <div className="flex">
              <input
                type="text"
                value={profileUrl}
                readOnly
                className="flex-1 bg-black/50 border border-zinc-800/50 text-white rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/30 truncate"
              />
              <button
                onClick={copyLink}
                className={`px-3 py-2 rounded-r-lg flex items-center justify-center transition-colors ${
                  copied 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-zinc-800/70 hover:bg-zinc-700/50 text-white/70'
                }`}
                aria-label="Copy profile link"
              >
                {copied ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-purple-300 flex items-center gap-1 mt-2">
                <Check className="w-3 h-3" /> 
                Copied to clipboard
              </p>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex border border-zinc-800/50 rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'qr' 
                  ? 'bg-purple-800/10 text-purple-300 border-b-2 border-purple-500' 
                  : 'bg-transparent text-white/60 hover:text-white hover:bg-zinc-800/20'
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </button>
            
            <button
              onClick={() => setActiveTab('social')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'social' 
                  ? 'bg-purple-800/10 text-purple-300 border-b-2 border-purple-500' 
                  : 'bg-transparent text-white/60 hover:text-white hover:bg-zinc-800/20'
              }`}
            >
              <SocialXIcon size={14} color="currentColor" />
              Social Media
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
            {activeTab === 'qr' ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-3 rounded-lg border border-zinc-800/50 mb-3">
                  <canvas ref={qrCanvasRef} className="w-40 h-40" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/50 mb-4">
                  <ExternalLink size={12} />
                  <span>{profileUrl}</span>
                </div>
                <button
                  onClick={downloadQRCode}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  <Download size={14} />
                  <span>Download QR Code</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-white/70 mb-3">
                  Share your profile directly on these platforms:
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={shareOnTwitter}
                    className="flex flex-col items-center justify-center gap-2 bg-zinc-800/50 hover:bg-zinc-700/30 text-white rounded-lg p-3 text-sm font-medium transition-colors border border-zinc-800/50"
                  >
                    <div className="text-white">
                      <SocialXIcon size={18} color="currentColor" />
                    </div>
                    <span>X</span>
                  </button>
                  
                  <button
                    onClick={shareOnReddit}
                    className="flex flex-col items-center justify-center gap-2 bg-zinc-800/50 hover:bg-zinc-700/30 text-white rounded-lg p-3 text-sm font-medium transition-colors border border-zinc-800/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                    <span>Reddit</span>
                  </button>
                </div>
                
                <div className="pt-2 mt-3 border-t border-zinc-800/50">
                  <p className="text-xs text-white/50 text-center">
                    Sharing helps grow your audience and drive more traffic to your page
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}