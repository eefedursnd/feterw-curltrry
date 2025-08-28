'use client';

import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Eye,
  Settings,
  User as UserIcon,
  AtSign,
  X,
  Loader2,
  TypeOutline,
  ArrowRight,
  Share2,
  Globe,
  Gem,
  LineChart,
  PenSquare,
  Wand2,
  Info,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { User, UserProfile, View } from 'haze.bio/types';
import { userAPI } from 'haze.bio/api';
import toast from 'react-hot-toast';
import { useUser } from 'haze.bio/context/UserContext';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import DashboardLayout from 'haze.bio/components/dashboard/Layout';
import Image from 'next/image';
import { PremiumBadge } from 'haze.bio/badges/Badges';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false }) as any;

interface DashboardContentProps {
  view: View;
}

export default function DashboardContent({ view: initialView }: DashboardContentProps) {
  const { user: contextUser, updateUser } = useUser();

  const [viewData, setViewData] = useState<View>(initialView);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showAliasModal, setShowAliasModal] = useState(false);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);

  const [username, setUsername] = useState('');
  const [alias, setAlias] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [chartSeries, setChartSeries] = useState<ApexAxisChartSeries>([{
    name: 'Profile Views',
    data: []
  }]);

  const isPremium = contextUser?.has_premium;
  const badgeEditCredits = contextUser?.badge_edit_credits || 0;

  useEffect(() => {
    if (contextUser) {
      setUsername(contextUser.username);
      setAlias(contextUser.alias || '');
      setDisplayName(contextUser.display_name || '');
    }
  }, [contextUser]);


  useEffect(() => {
    const transformViewsData = () => {
      try {
        if (viewData.views_data) {
          const viewsData: { time: string; views: number }[] = JSON.parse(viewData.views_data);

          const transformedData = viewsData.map((item) => ({
            x: item.time,
            y: Number(item.views)
          }));

          transformedData.sort((a, b) => {
            const timeA = parseInt(a.x.replace(/[^0-9]/g, ''));
            const timeB = parseInt(b.x.replace(/[^0-9]/g, ''));
            return timeA - timeB;
          });

          const categories = transformedData.map(item => item.x);
          const chartData = transformedData.map(item => item.y);

          setChartSeries([{
            name: 'Profile Views',
            data: chartData
          }]);

          setChartOptions(prevOptions => ({
            ...prevOptions,
            xaxis: {
              ...prevOptions.xaxis,
              categories: categories
            }
          }));
        }
      } catch (error) {
        console.error("Failed to parse or transform views data:", error);
        toast.error("Failed to display views data");
      }
    };

    transformViewsData();
  }, [viewData]);

  const [chartOptions, setChartOptions] = useState<ApexOptions>({
    chart: {
      type: 'area',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      background: 'transparent',
      foreColor: '#fff'
    },
    theme: {
      mode: 'dark'
    },
    stroke: {
      curve: 'smooth',
      width: 2.5
    },
    colors: ['#a855f7'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
        colorStops: [
          {
            offset: 0,
            color: '#a855f7',
            opacity: 0.4
          },
          {
            offset: 100,
            color: '#a855f7',
            opacity: 0.1
          }
        ]
      }
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.05)',
      strokeDashArray: 6,
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      labels: {
        style: {
          colors: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
        },
        formatter: function (val) {
          return val.toFixed(0);
        }
      }
    },
    tooltip: {
      theme: 'dark',
      x: {
        show: false
      }
    }
  });

  const handleUpdateUsername = async () => {
    if (!contextUser) return;
    try {
      setIsLoading(true);
      await userAPI.updateUser({ username: username });
      toast.success('Username updated successfully');
      setShowUsernameModal(false);
      updateUser({ username: username });
    } catch (error: any) {
      toast.error((error as Error).message || 'Failed to update username');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!contextUser) return;
    try {
      setIsLoading(true);
      await userAPI.updateUser({ display_name: displayName });
      toast.success('Display name updated successfully');
      setShowDisplayNameModal(false);
      updateUser({ display_name: displayName });
    } catch (error: any) {
      toast.error((error as Error).message || 'Failed to update display name');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAlias = async () => {
    if (!contextUser) return;
    try {
      setIsLoading(true);
      await userAPI.updateUser({ alias: alias });
      toast.success('Alias updated successfully');
      setShowAliasModal(false);
      updateUser({ alias: alias });
    } catch (error: any) {
      toast.error((error as Error).message || 'Failed to update alias');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCooldownTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hour${hours !== 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}` : ''}`;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[100rem] mx-auto space-y-8 relative">
        {/* Hero Section */}
        <div className="bg-[#0E0E0E] rounded-xl p-8 border border-zinc-800/50 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Dashboard Overview
            </h1>
            <p className="text-white/70 text-sm md:text-base">
              Welcome to your cutz.lol dashboard. Here you have a quick overview of your profile, analytics, and settings.
            </p>

            <div className="flex flex-wrap gap-4 mt-6">
              <Link
                href="/dashboard/analytics"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 text-white text-sm rounded-lg hover:bg-zinc-700/50 transition-colors"
              >
                <LineChart className="w-4 h-4 text-purple-400" /> Analytics
              </Link>
              <Link
                href="/dashboard/badges"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 text-white text-sm rounded-lg hover:bg-zinc-700/50 transition-colors"
              >
                <BadgeCheck className="w-4 h-4 text-purple-400" /> Badges
              </Link>
              <Link
                href="/dashboard/customization"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 text-white text-sm rounded-lg hover:bg-zinc-700/50 transition-colors"
              >
                <PenSquare className="w-4 h-4 text-purple-400" /> Customization
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 text-white text-sm rounded-lg hover:bg-zinc-700/50 transition-colors"
              >
                <Settings className="w-4 h-4 text-purple-400" /> Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Resource Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-[#0E0E0E] rounded-lg border border-zinc-800/50 overflow-hidden p-5 hover:border-purple-500/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                <AtSign className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Username</p>
                <p className="text-white font-medium text-lg">
                  @{contextUser?.username}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0E0E0E] rounded-lg border border-zinc-800/50 overflow-hidden p-5 hover:border-purple-500/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs">UID</p>
                <p className="text-white font-medium text-lg">
                  {contextUser?.uid}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0E0E0E] rounded-lg border border-zinc-800/50 overflow-hidden p-5 hover:border-purple-500/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Total Views</p>
                <p className="text-white font-medium text-lg">
                  {contextUser?.profile?.views || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0E0E0E] rounded-lg border border-zinc-800/50 overflow-hidden p-5 hover:border-purple-500/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                {isPremium ? (
                  <PremiumBadge size={20} />
                ) : (
                  <Sparkles className="w-5 h-5 text-purple-400" />
                )}
              </div>
              <div>
                <p className="text-white/60 text-xs">Subscription</p>
                <p className="text-white font-medium text-lg flex items-center gap-1.5">
                  {isPremium ? 'Premium' : 'Free'}
                  {isPremium && <PremiumBadge size={12} />}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Info Card */}
        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden p-5">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-zinc-800/50 shadow-lg">
              <Image
                src={contextUser?.profile?.avatar_url || 'https://cdn.cutz.lol/default-avatar.png'}
                alt=""
                fill
                sizes="80px"
                style={{ objectFit: "cover" }}
                draggable="false"
                className="transition-transform hover:scale-105 duration-300"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">
                  {contextUser?.display_name || contextUser?.username}
                </h2>
                {isPremium && <PremiumBadge size={14} />}
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                <span className="px-2 py-0.5 bg-zinc-800/50 rounded-md text-xs text-white/70">
                  @{contextUser?.username}
                </span>
                {contextUser?.alias && (
                  <span className="px-2 py-0.5 bg-zinc-800/50 rounded-md text-xs text-white/70">
                    {contextUser.alias}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-zinc-800/50 rounded-md text-xs text-white/70">
                  UID: {contextUser?.uid}
                </span>
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <a
                  href={`/${contextUser?.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-md text-xs font-medium hover:bg-gray-100 transition-colors"
                >
                  <Eye className="w-3 h-3" /> View Profile
                </a>
                <button
                  onClick={() => setShowUsernameModal(true)}
                  disabled={Boolean(contextUser?.username_cooldown && contextUser.username_cooldown > 0)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 text-white rounded-md text-xs font-medium hover:bg-zinc-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserIcon className="w-3 h-3 text-purple-400" />
                  {contextUser?.username_cooldown && contextUser.username_cooldown > 0
                    ? `Username (${formatCooldownTime(contextUser.username_cooldown)})`
                    : 'Edit Username'}
                </button>

                <button
                  onClick={() => setShowDisplayNameModal(true)}
                  disabled={Boolean(contextUser?.display_name_cooldown && contextUser.display_name_cooldown > 0)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 text-white rounded-md text-xs font-medium hover:bg-zinc-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TypeOutline className="w-3 h-3 text-purple-400" />
                  {contextUser?.display_name_cooldown && contextUser.display_name_cooldown > 0
                    ? `Display Name (${formatCooldownTime(contextUser.display_name_cooldown)})`
                    : 'Edit Display Name'}
                </button>

                <button
                  onClick={() => setShowAliasModal(true)}
                  disabled={Boolean(contextUser?.alias_cooldown && contextUser.alias_cooldown > 0)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 text-white rounded-md text-xs font-medium hover:bg-zinc-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AtSign className="w-3 h-3 text-purple-400" />
                  {contextUser?.alias_cooldown && contextUser.alias_cooldown > 0
                    ? `Alias (${formatCooldownTime(contextUser.alias_cooldown)})`
                    : 'Edit Alias'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Layout for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Analytics */}
          <div className="lg:col-span-2 space-y-6">
                    {/* Analytics Card */}
        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  Profile Analytics
                </h2>
                <Link
                  href="/dashboard/analytics"
                  className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors"
                >
                  Detailed Analytics
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="h-[300px] p-4">
                <Chart
                  options={chartOptions}
                  series={chartSeries}
                  type="area"
                  height="100%"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">

                    {/* Quick Actions Card */}
        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800/50">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  Quick Actions
                </h2>
              </div>

              <div className="divide-y divide-zinc-800/50 h-[300px] overflow-y-auto">
                <button
                  onClick={() => setShowUsernameModal(true)}
                  className="w-full px-5 py-6 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors text-left group"
                  disabled={Boolean(contextUser?.username_cooldown && contextUser.username_cooldown > 0)}
                >
                  <div className="w-11 h-11 rounded-lg bg-purple-800/20 flex items-center justify-center flex-shrink-0 transition-colors">
                    <UserIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-base font-medium text-white group-hover:text-white/90 transition-colors">
                      Username
                    </div>
                    <div className="text-sm text-white/50 mt-1 group-hover:text-white/60 transition-colors">
                      {contextUser?.username_cooldown && contextUser.username_cooldown > 0
                        ? `Cooldown: ${formatCooldownTime(contextUser.username_cooldown)}`
                        : `@${contextUser?.username}`}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowDisplayNameModal(true)}
                  className="w-full px-5 py-6 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors text-left group"
                  disabled={Boolean(contextUser?.display_name_cooldown && contextUser.display_name_cooldown > 0)}
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-800/20 flex items-center justify-center flex-shrink-0 transition-colors">
                    <TypeOutline className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-base font-medium text-white group-hover:text-white/90 transition-colors">
                      Display Name
                    </div>
                    <div className="text-sm text-white/50 mt-1 group-hover:text-white/60 transition-colors">
                      {contextUser?.display_name_cooldown && contextUser.display_name_cooldown > 0
                        ? `Cooldown: ${formatCooldownTime(contextUser.display_name_cooldown)}`
                        : contextUser?.display_name || 'Not set'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowAliasModal(true)}
                  className="w-full px-5 py-6 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors text-left group"
                  disabled={Boolean(contextUser?.alias_cooldown && contextUser.alias_cooldown > 0)}
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-800/20 flex items-center justify-center flex-shrink-0 transition-colors">
                    <AtSign className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-base font-medium text-white group-hover:text-white/90 transition-colors">
                      Alias
                    </div>
                    <div className="text-sm text-white/50 mt-1 group-hover:text-white/60 transition-colors">
                      {contextUser?.alias_cooldown && contextUser.alias_cooldown > 0
                        ? `Cooldown: ${formatCooldownTime(contextUser.alias_cooldown)}`
                        : contextUser?.alias || 'Not set'}
                    </div>
                  </div>
                </button>
              </div>
            </div>



            {/* Premium Promotion Card (only if not premium) */}
            {!isPremium && (
              <div className="bg-gradient-to-br from-purple-900/30 to-black rounded-xl border border-purple-800/20 overflow-hidden">
                <div className="px-5 py-4 border-b border-purple-800/20">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <PremiumBadge size={16} />
                    Upgrade to Premium
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-white">Enhance Your Profile</h3>
                      <p className="text-xs text-white/60 mt-0.5">
                        Get exclusive features and stand out from the crowd
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 bg-purple-800/30 rounded-full flex items-center justify-center">
                        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span>Custom Effects</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 bg-purple-800/30 rounded-full flex items-center justify-center">
                        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span>Premium Badge</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 bg-purple-800/30 rounded-full flex items-center justify-center">
                        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span>Advanced Analytics</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 bg-purple-800/30 rounded-full flex items-center justify-center">
                        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span>Priority Support</span>
                    </div>
                  </div>

                  <Link
                    href="/pricing"
                    className="mt-2 block w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all text-sm font-medium text-center"
                  >
                    View Premium Plans
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Username Modal */}
              {showUsernameModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0E0E0E]/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-[#0E0E0E] rounded-xl p-6 border border-zinc-800/50 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Change Username</h3>
                </div>
                <button
                  onClick={() => setShowUsernameModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    New Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0E0E0E] border border-zinc-700/50 rounded-lg 
                              text-white text-sm focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowUsernameModal(false)}
                    className="px-4 py-2 bg-zinc-800/50 text-white rounded-lg hover:bg-zinc-700/50 
                              transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateUsername}
                    disabled={isLoading || !username || username === contextUser?.username}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg
                              transition-colors text-sm disabled:opacity-50 
                              disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Username'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display Name Modal */}
              {showDisplayNameModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0E0E0E]/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-[#0E0E0E] rounded-xl p-6 border border-zinc-800/50 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                    <TypeOutline className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Change Display Name</h3>
                </div>
                <button
                  onClick={() => setShowDisplayNameModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    New Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    className="w-full px-3 py-2 bg-[#0E0E0E] border border-zinc-700/50 rounded-lg 
                              text-white text-sm focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowDisplayNameModal(false)}
                    className="px-4 py-2 bg-zinc-800/50 text-white rounded-lg hover:bg-zinc-700/50 
                              transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateDisplayName}
                    disabled={isLoading || displayName === contextUser?.display_name}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg
                              transition-colors text-sm disabled:opacity-50 
                              disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Display Name'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alias Modal */}
              {showAliasModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0E0E0E]/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-[#0E0E0E] rounded-xl p-6 border border-zinc-800/50 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                    <AtSign className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Change Alias</h3>
                </div>
                <button
                  onClick={() => setShowAliasModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    New Alias
                  </label>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Enter alias"
                    className="w-full px-3 py-2 bg-[#0E0E0E] border border-zinc-700/50 rounded-lg 
                              text-white text-sm focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowAliasModal(false)}
                    className="px-4 py-2 bg-zinc-800/50 text-white rounded-lg hover:bg-zinc-700/50 
                              transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateAlias}
                    disabled={isLoading || alias === contextUser?.alias}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg
                              transition-colors text-sm disabled:opacity-50 
                              disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Alias'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}