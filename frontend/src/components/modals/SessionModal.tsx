'use client';

import { UserSession } from 'haze.bio/types';
import { X, Key, Calendar, Shield, LogOut, ChevronDown, ChevronUp, MapPin, Monitor, AlertCircle, Activity, Globe, LaptopIcon, SmartphoneIcon, TabletIcon, Loader2, History } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: UserSession[];
  onLogoutSession: (sessionId: number) => void;
  onLogoutAllSessions: () => void;
  isLoading?: boolean;
}

// Formatting helper functions
function formatUserAgent(userAgent: string): string {
  if (!userAgent) return 'Unknown device';

  let formattedAgent = userAgent;

  const browserMatches = userAgent.match(/(Chrome|Safari|Firefox|Edge|MSIE|Trident)\/[\d.]+/);
  const browserName = browserMatches ? browserMatches[0].split('/')[0] : '';

  const osMatches = userAgent.match(/(Windows NT|Mac OS X|Linux|Android|iOS)[\s\d.]*/);
  const osInfo = osMatches ? osMatches[0] : '';

  if (browserName || osInfo) {
    formattedAgent = [formatOSName(osInfo), browserName].filter(Boolean).join(' on ');
  }

  return formattedAgent.length > 40 ? formattedAgent.substring(0, 37) + '...' : formattedAgent;
}

function formatOSName(osString: string): string {
  if (!osString) return '';

  if (osString.includes('Windows NT')) {
    return 'Windows';
  } else if (osString.includes('Mac OS X')) {
    return 'macOS';
  } else if (osString.includes('Android')) {
    return 'Android';
  } else if (osString.includes('iOS')) {
    return 'iOS';
  }

  return osString;
}

function formatDeviceName(userAgent: string): string {
  if (!userAgent) return 'Unknown device';

  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('Android') && userAgent.includes('Mobile')) return 'Android Phone';
  if (userAgent.includes('Android')) return 'Android Device';
  if (userAgent.includes('Windows')) return 'Windows Device';
  if (userAgent.includes('Mac OS')) return 'Mac Device';

  return 'Unknown Device';
}

function formatBrowser(userAgent: string): string {
  if (!userAgent) return 'Unknown browser';

  if (userAgent.includes('Chrome') && !userAgent.includes('Chromium') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('OPR')) return 'Opera';

  return 'Unknown Browser';
}

function formatOS(userAgent: string): string {
  if (!userAgent) return 'Unknown OS';

  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  if (userAgent.includes('Linux')) return 'Linux';

  return 'Unknown OS';
}

function formatDate(date: string | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const dateObj = new Date(date);

    // Check if it's today
    const today = new Date();
    if (dateObj.toDateString() === today.toDateString()) {
      return `Today at ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Check if it's yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'Invalid Date';
  }
}

function getTimeAgo(date: string): string {
  if (!date) return '';

  const now = new Date();
  const pastDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

export default function SessionModal({
  isOpen,
  onClose,
  sessions,
  onLogoutSession,
  onLogoutAllSessions,
  isLoading = false
}: SessionModalProps) {
  const [expandedSessions, setExpandedSessions] = useState<Record<number, boolean>>({});
  const currentSession = sessions.find(s => s.current_session);

  useEffect(() => {
    // Automatically expand current session when modal opens
    if (isOpen && currentSession) {
      setExpandedSessions(prev => ({
        ...prev,
        [currentSession.id]: true
      }));
    }
  }, [isOpen, currentSession]);

  if (!isOpen) return null;

  const toggleSessionExpanded = (sessionId: number) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const getDeviceIcon = (userAgent: string) => {
    if (!userAgent) return <LaptopIcon className="w-4 h-4" color='white' />;

    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <SmartphoneIcon className="w-4 h-4" color='white' />;
    } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
      return <TabletIcon className="w-4 h-4" color='white' />;
    } else {
      return <LaptopIcon className="w-4 h-4" color='white' />;
    }
  };

  const isRecentSession = (date: string) => {
    const sessionDate = new Date(date);
    const now = new Date();
    const hoursDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  const maskIp4OrIp6 = (ip: string) => {
    if (!ip) return 'Unknown IP';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    } else if (parts.length === 8) {
      return `${parts[0]}:${parts[1]}:****:****:****:****:****:****`;
    }
    return ip;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
      <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
              <History className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
          </div>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-white/60">
            These are the devices where you're currently logged in. You can log out from devices you no longer use.
          </p>

          <div className="overflow-hidden rounded-lg border border-zinc-800/50">
            <div className="px-4 py-3 bg-zinc-800/30">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-5 text-xs font-medium text-white/70">Device</div>
                <div className="col-span-4 text-xs font-medium text-white/70">Last Active</div>
                <div className="col-span-3 text-xs font-medium text-white/70 text-right">Actions</div>
              </div>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="hover:bg-zinc-800/20 transition-colors"
                >
                  <div
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => toggleSessionExpanded(session.id)}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getDeviceIcon(session.user_agent)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white flex items-center gap-2">
                              {formatDeviceName(session.user_agent)}
                              {session.current_session && (
                                <span className="px-1.5 py-0.5 bg-green-800/30 text-green-400 text-xs rounded-full">
                                  Current
                                </span>
                              )}
                              {isRecentSession(session.created_at) && !session.current_session && (
                                <span className="px-1.5 py-0.5 bg-blue-800/30 text-blue-400 text-xs rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-white/60 mt-0.5">
                              {formatBrowser(session.user_agent)} • {formatOS(session.user_agent)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="text-sm text-white/70">
                          {formatDate(session.created_at)}
                        </div>
                        <div className="text-xs text-white/50">
                          {getTimeAgo(session.created_at)}
                        </div>
                      </div>
                      <div className="col-span-3 text-right flex items-center justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLogoutSession(session.id);
                          }}
                          disabled={isLoading || session.current_session}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-xs flex items-center gap-1.5 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <LogOut className="w-3 h-3" />
                              Log Out
                            </>
                          )}
                        </button>
                        <button
                          className="ml-2 p-1 text-white/60 hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSessionExpanded(session.id);
                          }}
                        >
                          {expandedSessions[session.id] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded session details */}
                  {expandedSessions[session.id] && (
                    <div className="px-4 pb-3 pt-0 bg-zinc-900/30">
                      <div className="ml-11 pl-3 border-l border-zinc-800/50 space-y-2">
                        <div className="flex items-start gap-2">
                          <Globe className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-white/70">IP Address</div>
                            <div className="text-sm text-white">{maskIp4OrIp6(session.ip_address) || 'Unknown'}</div>
                          </div>
                        </div>

                        {session.location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-white/70">Location</div>
                              <div className="text-sm text-white">{session.location}</div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-white/70">Created</div>
                            <div className="text-sm text-white">{formatDate(session.created_at)}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Key className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-white/70">Session Expires</div>
                            <div className="text-sm text-white">{formatDate(session.expires_at)}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Monitor className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-white/70">User Agent</div>
                            <div className="text-sm text-white break-all">{session.user_agent}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t border-zinc-800/50 pt-4 mt-2 p-5">
          <p className="text-sm text-white/60">
            {sessions.length} active {sessions.length === 1 ? 'session' : 'sessions'}
          </p>
          <button
            onClick={onLogoutAllSessions}
            disabled={isLoading || sessions.length <= 1}
            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Log Out All Devices
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}