'use client';

import { LogOut, Info, AlertTriangle, Calendar, Clock, ShieldAlert, X, Lock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { userAPI } from 'haze.bio/api';
import { useRouter } from 'next/navigation';
import { DiscordIcon } from 'haze.bio/socials/Socials';
import { Punishment } from 'haze.bio/types';
import moment from 'moment';

interface PunishmentModalProps {
  punishments: Punishment[] | null;
  onClose?: () => void;
}

export default function PunishmentModal({ punishments, onClose }: PunishmentModalProps) {
  const router = useRouter();

  if (!punishments || punishments.length === 0) {
    return null;
  }

  const activePunishment = punishments.find(p => p?.active === true);

  if (!activePunishment) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await userAPI.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const createdAt = moment(activePunishment.created_at);
  const startDate = createdAt.format('MMM D, YYYY [at] h:mm A');

  let endDateText: string;
  let isPermanent = false;

  const endDateMoment = moment(activePunishment.end_date);
  if (!endDateMoment.isValid() || endDateMoment.year() > moment().year() + 50) {
    endDateText = 'Permanent';
    isPermanent = true;
  } else {
    endDateText = endDateMoment.format('MMM D, YYYY [at] h:mm A');
  }

  let durationText: string;
  if (isPermanent) {
    durationText = 'Permanent restriction';
  } else {
    const duration = moment.duration(endDateMoment.diff(createdAt));
    const days = Math.floor(duration.asDays());
    const hours = Math.floor(duration.asHours()) % 24;

    if (days > 30) {
      const months = Math.floor(days / 30);
      durationText = `${months} ${months === 1 ? 'month' : 'months'}`;
    } else if (days > 0) {
      durationText = `${days} ${days === 1 ? 'day' : 'days'}`;
      if (hours > 0) {
        durationText += `, ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      }
    } else {
      durationText = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
  }

  const isFullRestriction = activePunishment.punishment_type === 'full';
  const iconColor = isFullRestriction ? "text-red-400" : "text-amber-400";
  const iconBgColor = isFullRestriction ? "bg-red-900/20" : "bg-amber-900/20";
  const containerBorderColor = isFullRestriction ? "border-red-900/20" : "border-amber-900/20";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
      <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${iconBgColor} rounded-lg flex items-center justify-center`}>
              {isFullRestriction ? (
                <Lock className={`w-4 h-4 ${iconColor}`} />
              ) : (
                <ShieldAlert className={`w-4 h-4 ${iconColor}`} />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {isFullRestriction ? 'Account Locked' : 'Account Restricted'}
              </h3>
              <p className="text-xs text-white/60">
                Case #{activePunishment.id}
              </p>
            </div>
          </div>

          {!isFullRestriction && onClose && (
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Security alert */}
          <div className={`bg-zinc-800/30 rounded-lg border ${containerBorderColor} p-4`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 ${iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <AlertTriangle className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Account Status</h4>
                <p className="text-xs text-white/60">
                  {isFullRestriction
                    ? "Your account has been fully restricted due to a violation of our community guidelines. You cannot use any haze.bio features until this restriction is lifted."
                    : "Your account has been partially restricted. You can still view your profile, but some features are unavailable until this restriction is lifted."}
                </p>
              </div>
            </div>
          </div>

          {/* Restriction reason + timeline combined */}
          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Info className="w-4 h-4 text-purple-400" />
              </div>
              <div className="w-full">
                <h4 className="text-sm font-medium text-white mb-2">Restriction Details</h4>
                
                <div className="bg-black/30 rounded-lg border border-zinc-800/50 p-3 mb-3">
                  <h5 className="text-xs font-medium text-white mb-1">Reason</h5>
                  <p className="text-xs text-white/60 whitespace-pre-wrap break-words">
                    {activePunishment.reason}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-lg border border-zinc-800/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <h5 className="text-xs font-medium text-white">Start Date</h5>
                    </div>
                    <p className="text-xs text-white/60">{startDate}</p>
                  </div>

                  <div className="bg-black/30 rounded-lg border border-zinc-800/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <h5 className="text-xs font-medium text-white">End Date</h5>
                    </div>
                    <p className="text-xs text-white/60">{isPermanent ? 'Permanent' : endDateText}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status overview */}
          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
              </div>
              <div className="w-full">
                <h4 className="text-sm font-medium text-white mb-2">Feature Status</h4>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between bg-black/30 rounded-lg border border-zinc-800/50 p-2.5">
                    <span className="text-xs text-white/70">Profile visibility</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isFullRestriction 
                        ? 'bg-red-900/20 text-red-400' 
                        : 'bg-green-900/20 text-green-400'
                    }`}>
                      {isFullRestriction ? 'Blocked' : 'Available'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-black/30 rounded-lg border border-zinc-800/50 p-2.5">
                    <span className="text-xs text-white/70">Content editing</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-900/20 text-red-400">
                      Blocked
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-black/30 rounded-lg border border-zinc-800/50 p-2.5">
                    <span className="text-xs text-white/70">Navigation</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isFullRestriction 
                        ? 'bg-red-900/20 text-red-400' 
                        : 'bg-green-900/20 text-green-400'
                    }`}>
                      {isFullRestriction ? 'Blocked' : 'Available'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appeal information - simplified */}
          <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <DiscordIcon size={16} className="text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Need Help?</h4>
                <p className="text-xs text-white/60 mb-3">
                  If you believe this restriction was applied in error, you can submit an appeal through our Discord support channel.
                </p>
                <Link
                  href="https://discord.gg/hazebio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-xs font-medium"
                >
                  <DiscordIcon size={14} />
                  Open Discord Support
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-end">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}