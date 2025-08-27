'use client';

import { X, Check, Calendar, Clock, Award, Gem, Crown, Star, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { User } from 'haze.bio/types';
import moment from 'moment';
import { PremiumBadge } from 'haze.bio/badges/Badges';
import { useUser } from 'haze.bio/context/UserContext';
import Link from 'next/link';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { user } = useUser();
  if (!isOpen || !user) return null;

  const premiumSince = user.subscription?.created_at ? moment(user.subscription.created_at) : null;
  const now = moment();
  const premiumDuration = premiumSince ? moment.duration(now.diff(premiumSince)) : null;
  const premiumDays = premiumDuration ? Math.floor(premiumDuration.asDays()) : 0;
  const premiumMonths = premiumDuration ? Math.floor(premiumDuration.asMonths()) : 0;

  const progressToLoyalty = user.has_premium ? Math.min((premiumDays / 365) * 100, 100) : 0;

  const milestones = [
    { months: 1, reward: "+3 Credits", achieved: premiumMonths >= 1 },
    { months: 3, reward: "Custom Badge", achieved: premiumMonths >= 3 },
    { months: 6, reward: "+6 Credits", achieved: premiumMonths >= 6 },
    { months: 12, reward: "Loyalty Badge", achieved: premiumMonths >= 12 }
  ];

  if (!user.has_premium) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
        <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                <PremiumBadge size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Premium Required</h3>
                <p className="text-xs text-white/60">Unlock premium features</p>
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
            <div className="text-center py-3">
              <div className="w-16 h-16 bg-purple-800/20 rounded-xl border border-purple-800/30 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Unlock Premium Features</h3>
              <p className="text-white/60 text-sm max-w-xs mx-auto">
                Upgrade to premium to access exclusive features and analytics for your profile
              </p>
            </div>

            {/* Feature cards */}
            <div className="space-y-3">
              {/* Analytics Feature */}
              <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Shield className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      Premium Analytics
                      <span className="px-1.5 py-0.5 bg-purple-800/20 text-purple-300 rounded text-[10px] font-medium">PRO</span>
                    </h4>
                    <p className="text-xs text-white/60 mt-1">
                      Get detailed insights about your visitors, including geographic data and device usage.
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Themes Feature */}
              <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Gem className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      Custom Themes
                      <span className="px-1.5 py-0.5 bg-purple-800/20 text-purple-300 rounded text-[10px] font-medium">PRO</span>
                    </h4>
                    <p className="text-xs text-white/60 mt-1">
                      Create unique profile designs with premium themes and layout options.
                    </p>
                  </div>
                </div>
              </div>

              {/* Premium Badges Feature */}
              <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Award className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      Premium Badges
                      <span className="px-1.5 py-0.5 bg-purple-800/20 text-purple-300 rounded text-[10px] font-medium">PRO</span>
                    </h4>
                    <p className="text-xs text-white/60 mt-1">
                      Unlock exclusive badges and rewards as you continue your premium membership.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-zinc-800/50 flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-3 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
            >
              Not now
            </button>
            <Link
              href="/pricing"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5"
            >
              <span>Upgrade</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
      <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
              <PremiumBadge size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Premium Status</h3>
              <p className="text-xs text-white/60">Your membership details</p>
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
          {/* Premium duration card */}
          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-white/60">Premium Member For</p>
                  <p className="text-white font-medium">
                    {premiumMonths > 0 ? `${premiumMonths} ${premiumMonths === 1 ? 'month' : 'months'}` : `${premiumDays} ${premiumDays === 1 ? 'day' : 'days'}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-white/60">Since</p>
                  <p className="text-white font-medium">
                    {premiumSince ? premiumSince.format('MMM D, YYYY') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty badge progress */}
          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium text-white">Loyalty Badge Progress</h4>
              </div>
              <div className="text-xs bg-purple-800/20 text-purple-300 rounded-full px-2 py-0.5">
                {Math.round(progressToLoyalty)}%
              </div>
            </div>
            
            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                style={{ width: `${progressToLoyalty}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-white/60 mt-2">
              <span>0 days</span>
              <span>365 days</span>
            </div>
          </div>
          
          {/* Milestones */}
          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800/50">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Gem className="w-4 h-4 text-purple-400" />
                Premium Milestones
              </h4>
            </div>
            
            <div className="p-2">
              <div className="grid grid-cols-4 gap-1">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex flex-col items-center p-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${
                      milestone.achieved 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-black/50 text-zinc-500 border border-zinc-800/50'
                    }`}>
                      {milestone.achieved ? <Check className="w-4 h-4" /> : <span>{milestone.months}m</span>}
                    </div>
                    <p className={`text-[10px] mt-1 text-center ${
                      milestone.achieved ? 'text-white' : 'text-white/40'
                    }`}>
                      {milestone.reward}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Benefits reminder */}
          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-400" />
                Your Premium Benefits
              </h4>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400" />
                <p className="text-xs text-white/80">Advanced analytics and visitor insights</p>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400" />
                <p className="text-xs text-white/80">Exclusive profile customization options</p>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400" />
                <p className="text-xs text-white/80">Premium badge and special status indicators</p>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400" />
                <p className="text-xs text-white/80">Loyalty rewards as your membership continues</p>
              </div>
            </div>
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