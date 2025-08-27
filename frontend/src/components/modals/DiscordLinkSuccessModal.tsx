'use client';

import { X, Shield, MessageSquare, Users, BadgeCheck, Zap, Star, ExternalLink } from 'lucide-react';
import { BoosterBadge } from 'haze.bio/badges/Badges';
import Image from 'next/image';
import Link from 'next/link';
import { DiscordIcon } from 'haze.bio/socials/Socials';

interface DiscordLinkSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiscordLinkSuccessModal({ isOpen, onClose }: DiscordLinkSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
      <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Discord Connected</h3>
              <p className="text-xs text-white/60">Your accounts are now linked</p>
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
        <div className="p-5">
          {/* Success Message */}
          <div className="flex items-center bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4 mb-5">
            <div className="flex items-center justify-center mr-4">
              <div className="relative w-16 h-16">
                <DiscordIcon size={64} className="absolute -top-1 -left-1 bg-purple-800/20 rounded-full flex items-center justify-center" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-800/20 rounded-full flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4 text-purple-400" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">Successfully Connected</h3>
              <p className="text-sm text-white/60">
                Your Discord account is now linked to haze.bio. This unlocks special features and integration.
              </p>
            </div>
          </div>

          {/* Three Column Feature Grid */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {/* Feature 1 */}
            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
              <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center mb-3">
                <BadgeCheck className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="text-sm font-medium text-white mb-1">Profile Badge</h4>
              <p className="text-xs text-white/60">
                Discord integration badge on your profile
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
              <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center mb-3">
                <MessageSquare className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="text-sm font-medium text-white mb-1">Status Display</h4>
              <p className="text-xs text-white/60">
                Show your Discord status on profile
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
              <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center mb-3">
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="text-sm font-medium text-white mb-1">Role Sync</h4>
              <p className="text-xs text-white/60">
                Discord roles sync with profile badges
              </p>
            </div>
          </div>

          {/* Two Column Content */}
          <div className="grid grid-cols-2 gap-4">
            {/* Booster Badge */}
            <div className="bg-gradient-to-br from-purple-900/10 to-purple-600/10 rounded-lg border border-purple-800/20 p-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <Star className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Exclusive Booster Badge</h4>
                  <p className="text-xs text-white/60 mb-3">
                    Support our server and get an exclusive animated badge
                  </p>

                  <div className="flex items-center gap-3 p-3 bg-black/50 rounded-lg border border-zinc-800/50">
                    <BoosterBadge size={24} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white">Discord Booster</p>
                      <p className="text-[10px] text-white/60">Supporting the community</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
              <h4 className="text-sm font-medium text-white mb-3">Quick Tips</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-4 h-4 bg-purple-800/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-purple-400">1</span>
                  </div>
                  <span>Check the Discord badge on your profile</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-4 h-4 bg-purple-800/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-purple-400">2</span>
                  </div>
                  <span>See your connections in account settings</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-4 h-4 bg-purple-800/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-purple-400">3</span>
                  </div>
                  <span>Join our server for support and updates</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-between items-center">
          <Link
            href="https://discord.gg/hazebio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1.5"
          >
            Join Discord Server
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Continue to Profile
          </button>
        </div>
      </div>
    </div>
  );
}