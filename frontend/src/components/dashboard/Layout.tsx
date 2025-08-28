'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Award,
  Palette,
  Share2,
  Settings,
  LogOut,
  X,
  Info,
  Menu,
  ExternalLink,
  Share,
  Wand2,
  LineChart,
  ShieldAlert,
  Shield,
  Sparkles,
  Gem,
  ChevronDown,
  ChevronRight,
  User,
  Globe
} from 'lucide-react';
import { User as UserType } from 'haze.bio/types';
import DiscordLinkSuccessModal from '../modals/DiscordLinkSuccessModal';
import PunishmentModal from '../modals/PunishmentModal';
import { userAPI } from 'haze.bio/api';
import PremiumModal from '../modals/PremiumModal';
import { PremiumBadge } from 'haze.bio/badges/Badges';
import EmailOnboardingModal from '../modals/EmailOnboardingModal';
import ShareProfileModal from '../modals/ShareProfileModal';
import { useUser } from 'haze.bio/context/UserContext';
import { HasAdminPermission, HasStaffPermission } from 'haze.bio/utils/staff';
import Logo from '../ui/Logo';

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

type MenuGroup = {
  id: string;
  title: string;
  icon: React.ElementType;
  items: MenuItem[];
  staffOnly?: boolean;
};

type MenuItem = {
  path: string;
  label: string;
  icon: React.ElementType;
  isNew?: boolean;
  isComingSoon?: boolean;
  disabled?: boolean;
  staffOnly?: boolean;
  adminOnly?: boolean;
  experimentalFeature?: string;
};

export default function DashboardLayout({ children, activeTab }: LayoutProps) {
  const pathName = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    dashboard: true,
    profile: true
  });
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const searchParams = useSearchParams();
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPunishmentModal, setShowPunishmentModal] = useState(false);

  const { user, updateUser } = useUser();

  const menuGroups: MenuGroup[] = [
    {
      id: 'dashboard',
      title: "Dashboard",
      icon: LayoutDashboard,
      items: [
        { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
        { path: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
      ]
    },
    {
      id: 'profile',
      title: "Profile",
      icon: User,
      items: [
        { path: '/dashboard/customization', label: 'Customize', icon: Palette },
        { path: '/dashboard/socials', label: 'Socials', icon: Share2 },
        { path: '/dashboard/badges', label: 'Badges', icon: Award },
        { path: '/dashboard/widgets', label: 'Widgets', icon: Info },
        { path: '/dashboard/templates', label: 'Templates', icon: Wand2 },
      ]
    },
    {
      id: 'account',
      title: "Account",
      icon: Settings,
      items: [
        
        { path: '/dashboard/applications', label: 'Applications', icon: ExternalLink },
        { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      ]
    },
    {
      id: 'moderation',
      title: "Moderation",
      icon: ShieldAlert,
      staffOnly: true,
      items: [
        { path: '/dashboard/moderation', label: 'Overview', icon: ShieldAlert },
        { path: '/dashboard/moderation/reports', label: 'Reports', icon: Shield },
        { path: '/dashboard/moderation/applications', label: 'Applications', icon: ExternalLink, adminOnly: true },
        { path: '/dashboard/moderation/help', label: 'Help Center', icon: Info },
      ]
    }
  ];

  useEffect(() => {
    const currentGroup = menuGroups.find(group =>
      group.items.some(item => pathName === item.path || pathName.startsWith(item.path + '/'))
    );

    if (currentGroup) {
      setExpandedGroups(prev => ({ ...prev, [currentGroup.id]: true }));
    }
  }, [pathName]);

  useEffect(() => {
    const isLinked = searchParams.get('linked') === 'true';
    if (isLinked) {
      setShowDiscordModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !user?.email_verified) {
      setShowEmailModal(true);
    }
  }, [user]);

  useEffect(() => {
    if (user?.punishments?.some(p => p.active)) {
      setShowPunishmentModal(true);
    }
  }, [user?.punishments]);

  const isActive = (path: string) => {
    if (activeTab) {
      return path.includes(activeTab);
    }
    return pathName === path;
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <div className="h-screen bg-[#0a0a0a] flex overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#0E0E0E]/90 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Header */}
              <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#0E0E0E]/95 backdrop-blur-xl z-30 px-4 py-3 border-b border-zinc-800/80">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-zinc-800/80 transition-all"
          >
            <Menu size={18} className="text-white/80" />
          </button>
                      <div className="flex items-center justify-center flex-1 mr-5">
              <Logo />
            </div>
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-zinc-700/80">
            <Image
              src={user?.profile?.avatar_url || 'https://cdn.cutz.lol/default-avatar.png'}
              alt=""
              fill
              sizes="32px"
              style={{ objectFit: "cover" }}
              draggable="false"
            />
          </div>
        </div>
      </div>

      {/* Sidebar - Fixed height design */}
                  <div className={`
              fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0E0E0E] backdrop-filter backdrop-blur-sm
              transform transition-all duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              lg:translate-x-0 flex flex-col border-r border-zinc-800/50
            `}>
        {/* Logo Section */}
        <div className="flex justify-between items-center px-5 py-5 border-b border-zinc-800/50">
          <Link href="/dashboard" className="flex items-center justify-center flex-1 mr-5">
            <Logo />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800/50 text-white/60 hover:text-white hover:bg-zinc-700/50 transition-all lg:hidden"
          >
            <X size={16} />
          </button>
        </div>



        {/* Main Navigation with Collapsible Groups */}
        <div className="flex-1 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent min-h-0">
          {menuGroups.map((group) => {
            if (group.staffOnly && !HasStaffPermission(user)) return null;

            const hasActiveItem = group.items.some(item => isActive(item.path));
            const isExpanded = expandedGroups[group.id] || hasActiveItem;

            const visibleItems = group.items.filter(item => {
              if (item.staffOnly && !HasStaffPermission(user)) return false;

              if (item.adminOnly && !HasAdminPermission(user)) return false;

              if (item.experimentalFeature &&
                (!user?.experimental_features ||
                  !user.experimental_features.includes(item.experimentalFeature))) {
                return false;
              }

              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.id} className="mb-1 px-2">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${hasActiveItem ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <group.icon size={16} className={hasActiveItem ? 'text-purple-400' : 'text-white/60'} />
                    <span className="text-sm font-medium">{group.title}</span>
                  </div>
                  {isExpanded ?
                    <ChevronDown size={14} className="text-white/40" /> :
                    <ChevronRight size={14} className="text-white/40" />
                  }
                </button>

                {isExpanded && (
                  <div className="mt-1 ml-5 space-y-0.5 border-l border-zinc-800/50 pl-2">
                    {visibleItems.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          href={item.disabled ? '#' : item.path}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors relative
    ${item.disabled
                              ? 'opacity-40 cursor-not-allowed text-white/40'
                              : active
                                ? 'bg-purple-500/10 text-white'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }
    ${item.experimentalFeature ? 'experimental-feature-item overflow-hidden' : ''}
  `}
                          onClick={e => item.disabled && e.preventDefault()}
                        >
                          <item.icon size={14} className={active ? 'text-purple-400' : 'text-white/50'} />
                          <span>{item.label}</span>

                          {item.isNew && (
                            <span className="px-1 py-0.5 text-[8px] font-medium bg-purple-500/20 text-purple-300 rounded ml-auto">
                              NEW
                            </span>
                          )}

                          {item.isComingSoon && (
                            <span className="px-1 py-0.5 text-[8px] font-medium text-white/40 bg-white/5 rounded ml-auto">
                              SOON
                            </span>
                          )}

                          {item.experimentalFeature && (
                            <span className="px-1 py-0.5 text-[8px] font-medium bg-purple-500/20 text-purple-300 rounded ml-auto flex items-center gap-0.5">
                              <Sparkles className="w-2 h-2" />
                              BETA
                            </span>
                          )}

                          {item.experimentalFeature && (
                            <div className="absolute inset-0 border border-purple-500/30 rounded-md experimental-border"></div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Premium Upsell */}
        {!(user?.subscription?.status === 'active') && (
          <div className="px-4 py-3 border-t border-zinc-800/50">
            <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/20 rounded-lg overflow-hidden border border-purple-800/20 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center">
                  <Sparkles size={16} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Go Premium</h3>
                  <p className="text-xs text-white/60">Unlock all features</p>
                </div>
              </div>

              <button
                onClick={() => setShowPremiumModal(true)}
                className="w-full mt-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 
                text-white rounded-md py-1.5 text-sm font-medium transition-all"
              >
                <Gem size={12} className="text-white/90" />
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-zinc-800/50 p-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center justify-center gap-1.5 bg-zinc-800/30 hover:bg-zinc-800/60
                      text-white rounded-md py-2 text-xs transition-all"
            >
              <Share size={14} className="text-white/70" />
              Share Profile
            </button>

            <button
              onClick={async () => {
                try {
                  await userAPI.logout();
                  window.location.href = "/login";
                } catch (error) {
                  console.error('Logout failed', error);
                }
              }}
              className="flex items-center justify-center gap-1.5 bg-zinc-800/30 hover:bg-zinc-800/60
                      text-white rounded-md py-2 text-xs transition-all"
            >
              <LogOut size={14} className="text-white/70" />
              Logout
            </button>
          </div>

          {/* User Profile Card */}
          <div className="pt-3">
            <div className="bg-zinc-800/30 rounded-lg p-3 backdrop-blur-sm flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-zinc-700/50 flex-shrink-0">
                <Image
                  src={user?.profile?.avatar_url || 'https://cdn.cutz.lol/default-avatar.png'}
                  alt=""
                  fill
                  sizes="40px"
                  style={{ objectFit: "cover" }}
                  draggable="false"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-white truncate">
                    {user?.display_name || user?.username}
                  </span>
                  {user?.subscription?.status === 'active' && (
                    <button
                      onClick={() => setShowPremiumModal(true)}
                      className="cursor-pointer flex-shrink-0"
                      title="Premium User"
                    >
                      <PremiumBadge size={12} />
                    </button>
                  )}
                </div>
                <div className="text-xs text-white/50 truncate">@{user?.username}</div>
              </div>

              <Link
                href={`/${user?.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                title="View Profile"
              >
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="px-3 py-2 border-t border-zinc-800/50">
          <div className="text-center text-xs text-white/30">
            <p>© {new Date().getFullYear()} cutz.lol</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-[#0a0a0a] overflow-y-auto pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 w-full">
          {children}
        </div>
      </main>

      {/* Modals */}
      <DiscordLinkSuccessModal
        isOpen={showDiscordModal}
        onClose={() => setShowDiscordModal(false)}
      />
      {showPunishmentModal && user?.punishments?.some(p => p.active) && (
        <PunishmentModal
          punishments={user?.punishments || null}
          onClose={() => setShowPunishmentModal(false)}
        />
      )}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
      <EmailOnboardingModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onUserUpdate={async (updatedUser: UserType) => {
          await updateUser(updatedUser);
          setShowEmailModal(false);
        }}
      />
      <ShareProfileModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        username={user?.username || ''}
      />
    </div>
  );
}