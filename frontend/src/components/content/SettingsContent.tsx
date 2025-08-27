'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/dashboard/Layout';
import {
  UserIcon,
  UserCheck,
  AtSign,
  Mail,
  Shield,
  Key,
  Calendar,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Settings,
  Eye,
  ArrowRight,
  Lock,
  BookUser,
  History,
  LogOut,
  Fingerprint,
  RefreshCw,
  Wand2,
  Star,
  Download,
  Trash,
  Bell,
  BellRing,
  Globe,
  Timer,
  Link2,
  HelpCircle,
  LifeBuoy,
  Zap,
  Edit,
  Search,
  FileText,
  Users,
  Activity,
  Cog,
  Info,
  DollarSign,
  CreditCard,
  ZapOff,
  Receipt,
  Wallet
} from 'lucide-react';
import { User, UserProfile, UserSession } from '../../types';
import toast from 'react-hot-toast';
import { userAPI, mfaAPI, discordAPI, redeemAPI, sessionAPI, emailAPI, dataAPI } from 'haze.bio/api';
import { DiscordIcon } from 'haze.bio/socials/Socials';
import Image from 'next/image';
import { RedeemProductModal } from '../modals/RedeemProductModal';
import SessionModal from '../modals/SessionModal';
import { useUser } from 'haze.bio/context/UserContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DataExport, DataExportDownloadResponse } from 'haze.bio/types/data';

interface SettingsPageProps {
  sessions: UserSession[];
  currentExport: DataExport | null;
}

export default function SettingsContent({ sessions: initialSessions, currentExport: initialExport }: SettingsPageProps) {
  const { user: contextUser, updateUser } = useUser();
  const searchParams = useSearchParams();

  // Modal states
  const [showMfaQR, setShowMfaQR] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [showAliasModal, setShowAliasModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Data export states
  const [activeExport, setActiveExport] = useState<DataExport | null>(initialExport);
  const [exportPassword, setExportPassword] = useState('');
  const [showExportPasswordModal, setShowExportPasswordModal] = useState(false);
  const [isExportLoading, setIsExportLoading] = useState(false);

  // Data states
  const [sessions, setSessions] = useState<UserSession[]>(initialSessions);
  const [mfaCode, setMfaCode] = useState('');
  const [username, setUsername] = useState('');
  const [alias, setAlias] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [discordLoginEnabled, setDiscordLoginEnabled] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // UI states
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'security' | 'account' | 'billing' | 'privacy' | 'notifications'>('profile');
  const [emailStep, setEmailStep] = useState<'email' | 'verification'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'billing' || tabParam === 'profile' || tabParam === 'security' || tabParam === 'account') {
      setActiveSettingsTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (contextUser) {
      setUsername(contextUser?.username);
      setAlias(contextUser?.alias || '');
      setDisplayName(contextUser?.display_name || '');
      setEmail(contextUser?.email || '');
      setDiscordLoginEnabled(contextUser?.login_with_discord);
    } else {
      setUsername('');
      setAlias('');
      setDisplayName('');
      setEmail('');
      setDiscordLoginEnabled(false);
    }
  }, [contextUser]);

  const handleLogoutSession = useCallback(async (sessionId: number) => {
    try {
      setIsLoading(true);
      const sessionToken = sessions.find(session => session.id === sessionId)?.session_token;

      if (!sessionToken) {
        toast.error('Session not found');
        return;
      }

      await sessionAPI.deleteSession(sessionToken);
      toast.success('Session logged out successfully');

      const updatedSessions = sessions.filter((session) => session.session_token !== sessionToken);
      setSessions(updatedSessions);

      const currentSession = sessions.find(session => session.current_session);
      if (currentSession && currentSession.session_token === sessionToken) {
        await userAPI.logout();
      } else if (updatedSessions.length === 0) {
        await userAPI.logout();
      }
    } catch (error) {
      toast.error('Failed to log out session');
    } finally {
      setIsLoading(false);
    }
  }, [sessions]);

  const handleLogoutAllSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      await sessionAPI.logoutAllSessions();
      toast.success('Logged out all sessions successfully');
      await userAPI.logout();
    } catch (error) {
      toast.error('Failed to log out all sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGenerateMfa = async () => {
    try {
      setIsLoading(true);
      const { secret, qr_code_url } = await mfaAPI.generateMFASecret();
      setQrCode(qr_code_url);
      setMfaSecret(secret);
      setShowMfaQR(true);
      toast.success('MFA setup started. Scan the QR code and enter the verification code.');
    } catch (error) {
      toast.error('Failed to generate MFA secret');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableMfa = async () => {
    if (!contextUser) return;
    try {
      setIsLoading(true);
      await mfaAPI.enableMFA(mfaSecret, mfaCode);
      setShowMfaQR(false);
      toast.success('MFA enabled successfully');
      updateUser({ mfa_enabled: true });
      setMfaCode('');
      setMfaSecret('');
    } catch (error) {
      toast.error('Failed to enable MFA: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!contextUser) return;
    try {
      setIsLoading(true);
      await mfaAPI.disableMFA();
      toast.success('MFA disabled successfully');
      updateUser({ mfa_enabled: false });
    } catch (error) {
      toast.error('Failed to disable MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setIsLoading(true);
      await userAPI.updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      toast.success('Password updated successfully. Logging out...');
      setTimeout(async () => {
        await userAPI.logout();
      }, 1000);
    } catch (error: any) {
      toast.error((error as Error).message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!contextUser) return;
    try {
      setIsLoading(true);
      await userAPI.updateUser({ username: username });
      toast.success('Username updated successfully');
      updateUser({ username: username });
      setShowUsernameModal(false);
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
      updateUser({ display_name: displayName });
      setShowDisplayNameModal(false);
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
      updateUser({ alias: alias });
      setShowAliasModal(false);
    } catch (error: any) {
      toast.error((error as Error).message || 'Failed to update alias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordRedirect = async () => {
    try {
      const redirectUrl = await discordAPI.getOAuth2URL(false);
      window.location.href = redirectUrl;
    } catch (error) {
      toast.error('Failed to redirect to Discord');
    }
  };

  const handleDiscordUnlink = async () => {
    if (!contextUser) return;
    try {
      setIsLoading(true);
      await discordAPI.unlinkDiscordAccount();
      toast.success('Discord account unlinked successfully');
      updateUser({ linked_at: null, discord_id: null });
    } catch (error) {
      toast.error('Failed to unlink Discord account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);

      if (activeExport && (activeExport.status === 'requested' || activeExport.status === 'processing')) {
        toast.success('You already have a data export in progress. Please wait for it to complete.');
        return;
      }

      dataAPI.requestAndTrackExport(
        (exportData) => {
          setActiveExport(exportData);
          toast.success('Your data export is ready for download!');
        },
        15000,
        25
      ).catch(error => {
        console.error("Export tracking failed:", error);
      });

      toast.success('Data export request received. Processing your data...');

      try {
        const initialExport = await dataAPI.getLatestExport();
        setActiveExport(initialExport);
      } catch (error) {
        console.error("Failed to get initial export status:", error);
      }
    } catch (error: any) {
      toast.error(`Failed to export data: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDiscordLoginEnabled = async () => {
    if (!contextUser) return;
    const newValue = !discordLoginEnabled;
    try {
      setIsLoading(true);
      setDiscordLoginEnabled(newValue);
      await userAPI.updateUser({ login_with_discord: newValue });
      toast.success(`Discord login ${newValue ? 'enabled' : 'disabled'} successfully`);
      updateUser({ login_with_discord: newValue });
    } catch (error) {
      toast.error(`Failed to ${!newValue ? 'enable' : 'disable'} Discord login`);
      setDiscordLoginEnabled(!newValue);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailVerification = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsEmailLoading(true);
    setEmailError(null);

    try {
      await emailAPI.sendVerificationEmail(newEmail);
      setEmailStep('verification');
      toast.success(`Verification email sent to ${newEmail}`);
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send verification email');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (!emailCode || emailCode.length < 6) {
      setEmailError('Please enter a valid verification code');
      return;
    }

    setIsEmailLoading(true);
    setEmailError(null);

    try {
      await emailAPI.verifyEmailCode(emailCode);
      updateUser({ email: newEmail });
      setShowEmailModal(false);
      toast.success('Email updated successfully');

      setEmailStep('email');
      setNewEmail('');
      setEmailCode('');
    } catch (err: any) {
      setEmailError(err.message || 'Failed to verify code');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const handleDeleteAccount = async () => {
    if (!contextUser) return;

    try {
      setIsDeletingAccount(true);
      await userAPI.deleteAccount(true);
      toast.success('Your account has been deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
      setIsDeletingAccount(false);
    }
  };

  const handleDownloadExport = async () => {
    if (!activeExport) return;

    try {
      setIsExportLoading(true);
      const response: DataExportDownloadResponse = await dataAPI.downloadExport(
        activeExport.id,
        exportPassword
      );

      dataAPI.openDownloadLink(response.download_url);

      setShowExportPasswordModal(false);
      setExportPassword('');

      setActiveExport({
        ...activeExport,
        downloaded_at: new Date().toISOString()
      });

      toast.success('Download started successfully!');
    } catch (error: any) {
      toast.error(`Failed to download export: ${error.message || 'Invalid password'}`);
    } finally {
      setIsExportLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    const euroAmount = amount / 100;
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(euroAmount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'Topup':
        return <DollarSign className="w-4 h-4 text-green-400" />;
      case 'Refund':
        return <CreditCard className="w-4 h-4 text-gray-400" />;
      case 'Purchase':
        return <ZapOff className="w-4 h-4 text-red-400" />;
      case 'Admin':
        return <Zap className="w-4 h-4 text-purple-400" />;
      default:
        return <Receipt className="w-4 h-4 text-purple-400" />;
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Active</span>;
      case 'canceled':
      case 'cancelled':
        return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">Cancelled</span>;
      case 'pending':
        return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">Pending</span>;
      default:
        return <span className="px-2 py-0.5 bg-zinc-500/20 text-zinc-400 rounded-full text-xs">{status}</span>;
    }
  };

  const getSubscriptionGlowPrice = (product: string): number => {
    switch (product) {
      case 'monthly':
        return 200;
      case 'lifetime':
        return 600;
      default:
        return 0;
    }
  }

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
        {/* Hero Section mit Header */}
        <div className="bg-black rounded-xl p-8 border border-zinc-800/50 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"></div>

          <div className="relative z-10 max-w-3xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Account Settings</h1>
                  {contextUser?.has_premium && (
                    <div className="px-3 py-1 bg-purple-900/20 rounded-full border border-purple-800/30 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-sm font-medium text-white/80">Premium</span>
                    </div>
                  )}
                </div>
                <p className="text-white/70 text-sm md:text-base mt-1">
                  Manage your account settings, security, and preferences.
                </p>
              </div>

              <Link
                href={`/${contextUser?.username}`}
                target="_blank"
                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500
                transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </Link>
            </div>

            {/* Tab Navigation - lila Akzent für aktiven Tab */}
            <div className="flex gap-2 border-t border-zinc-800/50 pt-4 overflow-x-auto">
              <button
                onClick={() => setActiveSettingsTab('profile')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeSettingsTab === 'profile'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <UserIcon className="w-4 h-4" /> Profile Information
              </button>
              <button
                onClick={() => setActiveSettingsTab('security')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeSettingsTab === 'security'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <Shield className="w-4 h-4" /> Security & Authentication
              </button>
              <button
                onClick={() => setActiveSettingsTab('account')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeSettingsTab === 'account'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <Settings className="w-4 h-4" /> Account Management
              </button>
              <button
                onClick={() => setActiveSettingsTab('billing')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
     ${activeSettingsTab === 'billing'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <CreditCard className="w-4 h-4" /> Payment & Billing
              </button>
            </div>
          </div>
        </div>
        {/* Hauptinhalt - Grid-Layout für responsive Darstellung */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hauptbereich - 2/3 der Breite auf großen Bildschirmen */}
          <div className="lg:col-span-2 space-y-6">
            {activeSettingsTab === 'profile' && (
              <>
                {/* Profilinformationen */}
                <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                      <BookUser className="w-4 h-4 text-purple-400" />
                      Profile Information
                    </h2>
                    <span className="text-xs text-white/60">
                      Identity and contact details
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Username mit lila Icon */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                      <div className="flex items-center gap-3 sm:flex-1">
                        <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">Username</h3>
                          <p className="text-sm text-white/60 mt-0.5">
                            {contextUser?.username}
                            {contextUser?.username_cooldown && contextUser.username_cooldown > 0 && (
                              <span className="text-amber-400 ml-2">
                                Cooldown: {formatCooldownTime(contextUser.username_cooldown)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowUsernameModal(true)}
                        disabled={Boolean(contextUser?.username_cooldown && contextUser.username_cooldown > 0)}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm transition-colors bg-zinc-800/70 text-white hover:bg-zinc-700/50 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Change
                      </button>
                    </div>

                    {/* Display Name mit lila Icon */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                      <div className="flex items-center gap-3 sm:flex-1">
                        <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">Display Name</h3>
                          <p className="text-sm text-white/60 mt-0.5">
                            {contextUser?.display_name || 'Not set'}
                            {contextUser?.display_name_cooldown && contextUser.display_name_cooldown > 0 && (
                              <span className="text-amber-400 ml-2">
                                Cooldown: {formatCooldownTime(contextUser.display_name_cooldown)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDisplayNameModal(true)}
                        disabled={Boolean(contextUser?.display_name_cooldown && contextUser.display_name_cooldown > 0)}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm transition-colors bg-zinc-800/70 text-white hover:bg-zinc-700/50 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Change
                      </button>
                    </div>

                    {/* Alias mit lila Icon */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                      <div className="flex items-center gap-3 sm:flex-1">
                        <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                          <AtSign className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">Profile Alias</h3>
                          <p className="text-sm text-white/60 mt-0.5">
                            {contextUser?.alias || 'Not set'}
                            {contextUser?.alias_cooldown && contextUser.alias_cooldown > 0 && (
                              <span className="text-amber-400 ml-2">
                                Cooldown: {formatCooldownTime(contextUser.alias_cooldown)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAliasModal(true)}
                        disabled={Boolean(contextUser?.alias_cooldown && contextUser.alias_cooldown > 0)}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm transition-colors bg-zinc-800/70 text-white hover:bg-zinc-700/50 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Change
                      </button>
                    </div>

                    {/* Email mit lila Icon */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                      <div className="flex items-center gap-3 sm:flex-1">
                        <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">Email Address</h3>
                          <p className="text-sm text-white/60 mt-0.5">{contextUser?.email || 'Not set'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowEmailModal(true)}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm transition-colors bg-zinc-800/70 text-white hover:bg-zinc-700/50 flex items-center justify-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Change
                      </button>
                    </div>
                  </div>
                </div>

                {/* Discord Integration mit lila Akzenten */}
                <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                      <DiscordIcon className="w-4 h-4 text-purple-400" />
                      Discord Integration
                    </h2>
                    <span className="text-xs text-white/60">
                      Connect your Discord account
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Discord Verbindung */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                      <div className="flex items-center gap-3 sm:flex-1">
                        <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                          <DiscordIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-white">Discord Account</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${contextUser?.discord_id ? 'bg-green-800/30 text-green-400' : 'bg-yellow-800/30 text-yellow-400'}`}>
                              {contextUser?.discord_id ? 'Connected' : 'Not Connected'}
                            </span>
                          </div>
                          <p className="text-sm text-white/60 mt-0.5">
                            {contextUser?.discord_id
                              ? 'Your Discord account is linked'
                              : 'Connect your Discord account for additional features'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={contextUser?.discord_id ? handleDiscordUnlink : handleDiscordRedirect}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors text-sm flex items-center
                              justify-center gap-2 ${contextUser?.discord_id
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'bg-[#5865F2] text-white hover:bg-[#4752C4]'
                          }`}
                      >
                        <DiscordIcon className="w-4 h-4" color='white' />
                        {contextUser?.discord_id ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>

                    {/* Discord Login Toggle mit lila Akzent */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                      <div className="flex items-center gap-3 sm:flex-1">
                        <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                          <Lock className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">Login with Discord</h3>
                          <p className="text-sm text-white/60 mt-0.5">
                            Sign in using your Discord account instead of username and password
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={discordLoginEnabled}
                          onChange={handleUpdateDiscordLoginEnabled}
                          disabled={!contextUser?.discord_id}
                        />
                        <div className="w-11 h-6 bg-zinc-700 rounded-full peer
                                   peer-checked:after:translate-x-full peer-checked:after:border-white
                                   after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                   after:bg-white after:border-white after:border after:rounded-full 
                                   after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600
                                   disabled:opacity-50 disabled:cursor-not-allowed"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeSettingsTab === 'security' && (
              <>
                {/* Authentifizierung mit lila Akzenten */}
                <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400" />
                      Authentication
                    </h2>
                    <span className="text-xs text-white/60">
                      Secure your account
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Passwort mit lila Icon */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                      <div className="flex items-center gap-3 sm:flex-1">
                        <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                          <Key className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">Password</h3>
                          <p className="text-sm text-white/60 mt-0.5">Change your account password</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm transition-colors bg-zinc-800/70 text-white hover:bg-zinc-700/50 flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Update
                      </button>
                    </div>

                    {/* MFA mit lila Icon */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                      <div className="flex items-center gap-3 sm:flex-1">
                        <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                          <Fingerprint className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-white">Two-Factor Authentication</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${contextUser?.mfa_enabled ? 'bg-green-800/30 text-green-400' : 'bg-yellow-800/30 text-yellow-400'}`}>
                              {contextUser?.mfa_enabled ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-white/60 mt-0.5">
                            {contextUser?.mfa_enabled
                              ? 'Your account is protected with 2FA'
                              : 'Enhance your account security with 2FA'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={contextUser?.mfa_enabled ? handleDisableMfa : handleGenerateMfa}
                        disabled={isLoading}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm flex items-center
                              justify-center gap-2 transition-colors ${contextUser?.mfa_enabled
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'bg-purple-600 text-white hover:bg-purple-500'
                          }`}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : contextUser?.mfa_enabled ? (
                          <>
                            <X className="w-3.5 h-3.5" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Shield className="w-3.5 h-3.5" />
                            Enable
                          </>
                        )}
                      </button>
                    </div>

                    {/* Sessions mit lila Icon */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                      <div className="flex items-center gap-3 sm:flex-1">
                        <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                          <History className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">Active Sessions</h3>
                          <p className="text-sm text-white/60 mt-0.5">
                            View and manage devices where you're logged in
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowSessionModal(true)}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm transition-colors bg-zinc-800/70 text-white hover:bg-zinc-700/50 flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Manage
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sicherheitstipps mit lila Akzenten */}
                <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.1),transparent_70%)]"></div>
                  <div className="px-5 py-4 border-b border-zinc-800/50 relative">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400" />
                      Security Tips
                    </h2>
                  </div>

                  <div className="p-5 space-y-4 relative">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white">Use Strong Passwords</h3>
                        <p className="text-xs text-white/60 mt-1">
                          Create a strong, unique password that combines uppercase and lowercase letters, numbers, and symbols.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Fingerprint className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white">Enable Two-Factor Authentication</h3>
                        <p className="text-xs text-white/60 mt-1">
                          Two-factor authentication adds an extra layer of security by requiring a second verification step.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <History className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white">Monitor Active Sessions</h3>
                        <p className="text-xs text-white/60 mt-1">
                          Regularly check and remove unrecognized or old sessions from your account.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSettingsTab === 'account' && (
              <>
                {/* Account-Verwaltung mit lila Akzenten */}
                <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                      <Settings className="w-4 h-4 text-purple-400" />
                      Account Management
                    </h2>
                    <span className="text-xs text-white/60">
                      Manage your account
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Premium Status */}
                    {contextUser?.has_premium ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                        <div className="flex items-center gap-3 sm:flex-1">
                          <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-white">Premium Subscription</h3>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-800/30 text-purple-400">
                                Active
                              </span>
                            </div>
                            <p className="text-sm text-white/60 mt-0.5">
                              Active since {formatDate(contextUser?.subscription?.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-white/80 font-medium">
                          Premium
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                        <div className="flex items-center gap-3 sm:flex-1">
                          <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-white">Premium Subscription</h3>
                            <p className="text-sm text-white/60 mt-0.5">
                              Upgrade to premium for exclusive features
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowRedeemModal(true)}
                          className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm transition-colors bg-purple-600 text-white hover:bg-purple-500 flex items-center justify-center gap-1.5"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          Upgrade
                        </button>
                      </div>
                    )}
                    {/* Redeem Code */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                      <div className="flex items-center gap-3 sm:flex-1">
                        <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                          <Key className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">Redeem a Code</h3>
                          <p className="text-sm text-white/60 mt-0.5">Activate a premium subscription or product</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowRedeemModal(true)}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm transition-colors bg-zinc-800/70 text-white hover:bg-zinc-700/50 flex items-center justify-center gap-1.5"
                      >
                        <Key className="w-3.5 h-3.5" />
                        Redeem
                      </button>
                    </div>
                  </div>
                </div>

                {/* Danger Zone mit anderem Farbschema */}
                <div className="bg-black rounded-xl border border-red-900/20 overflow-hidden">
                  <div className="px-5 py-4 border-b border-red-900/20 flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      Danger Zone
                    </h2>
                    <span className="text-xs text-white/60">
                      Irreversible actions
                    </span>
                  </div>

                  <div className="p-5">
                    {/* Data Export Option */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-amber-950/10 rounded-lg border border-amber-900/20 mb-4">
                      <div className="flex items-center gap-3 sm:flex-1">
                        <div className="w-10 h-10 bg-amber-900/20 rounded-lg flex items-center justify-center">
                          <Download className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">Export Your Data</h3>
                          <p className="text-sm text-white/60 mt-0.5">
                            {activeExport ? (
                              <>
                                {activeExport.status === 'completed' && !activeExport.downloaded_at && (
                                  <span>Your export is ready for download</span>
                                )}
                                {activeExport.status === 'completed' && activeExport.downloaded_at && (
                                  <span>Last downloaded: {new Date(activeExport.downloaded_at).toLocaleDateString()}</span>
                                )}
                                {activeExport.status === 'requested' && (
                                  <span>Requested: {new Date(activeExport.requested_at).toLocaleString()}</span>
                                )}
                                {activeExport.status === 'processing' && (
                                  <span>Processing your data... Please wait</span>
                                )}
                                {activeExport.status === 'failed' && (
                                  <span>Export failed. Please try again</span>
                                )}
                              </>
                            ) : (
                              <span>Request a copy of all your personal data</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {activeExport?.status === 'completed' && !activeExport.downloaded_at ? (
                        <button
                          onClick={() => setShowExportPasswordModal(true)}
                          className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm transition-colors 
                  bg-green-500/10 text-green-400 hover:bg-green-500/20 flex items-center 
                  justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      ) : (
                        <button
                          onClick={handleExportData}
                          disabled={isLoading || (activeExport?.status === 'processing' || activeExport?.status === 'requested')}
                          className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm transition-colors 
                  bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center 
                  justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : activeExport?.status === 'processing' || activeExport?.status === 'requested' ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Processing
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              {activeExport ? 'Re-Export' : 'Export'}
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-red-950/10 rounded-lg border border-red-900/20">
                      <div className="flex items-center gap-3 sm:flex-1">
                        <div className="w-10 h-10 bg-red-900/20 rounded-lg flex items-center justify-center">
                          <Trash className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">Delete Account</h3>
                          <p className="text-sm text-white/60 mt-0.5">Permanently delete your account and all data</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirmModal(true)}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm transition-colors bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center gap-1.5"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSettingsTab === 'billing' && (
              <>
                {/* Premium Subscription Status */}
                <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                      <Star className="w-4 h-4 text-purple-400" />
                      Premium Subscription
                    </h2>
                    <span className="text-xs text-white/60">
                      Subscription status and details
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    {contextUser?.subscription?.status === 'active' ? (
                      <div className="flex flex-col bg-gradient-to-br from-purple-900/20 to-purple-600/5 backdrop-blur-sm rounded-lg border border-purple-500/20 overflow-hidden">
                        <div className="p-5 border-b border-purple-500/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                                <Star className="w-5 h-5 text-purple-300" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-white font-semibold">Premium Subscription</h3>
                                  {getSubscriptionStatusBadge(contextUser?.subscription?.status)}
                                </div>
                                <p className="text-xs text-white/60 mt-1">
                                  {contextUser?.subscription?.subscription_type === 'lifetime'
                                    ? 'Lifetime Access'
                                    : `${contextUser?.subscription?.subscription_type} subscription`}
                                </p>
                              </div>
                            </div>
                            <div className="hidden sm:block">
                              <div className="text-right">
                                <p className="text-sm text-white/60">Started on</p>
                                <p className="text-white font-medium">{formatDate(contextUser?.subscription?.created_at)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-800/30 rounded-lg border border-zinc-700/30 p-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-700/30 rounded-lg flex items-center justify-center">
                            <Star className="w-6 h-6 text-white/50" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-medium mb-1">No active subscription</h3>
                            <p className="text-white/60 text-sm">
                              Upgrade to Premium to unlock all features and enhance your profile.
                            </p>
                          </div>
                          <Link
                            href="/pricing"
                            className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                          >
                            <Star className="w-4 h-4" />
                            Upgrade to Premium
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Sidebar - 1/3 der Breite auf großen Bildschirmen */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800/50">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-purple-400" />
                  Account Info
                </h2>
              </div>

              <div className="p-5 space-y-4">
                {/* Premium Status */}
                <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center">
                      <Star className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm text-white/60">Premium</span>
                  </div>
                  <span className={`text-sm font-medium flex items-center gap-1.5 ${contextUser?.has_premium ? 'text-purple-400' : 'text-white/60'}`}>
                    {contextUser?.has_premium ? (
                      <>
                        <Check size={16} />
                        Active
                      </>
                    ) : (
                      <>
                        <X size={16} />
                        Inactive
                      </>
                    )}
                  </span>
                </div>

                {/* MFA Status */}
                <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm text-white/60">2FA</span>
                  </div>
                  <span className={`text-sm font-medium flex items-center gap-1.5 ${contextUser?.mfa_enabled ? 'text-green-500' : 'text-white/60'}`}>
                    {contextUser?.mfa_enabled ? (
                      <>
                        <Check size={16} />
                        Enabled
                      </>
                    ) : (
                      <>
                        <X size={16} />
                        Disabled
                      </>
                    )}
                  </span>
                </div>

                {/* Registrierungsdatum */}
                <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm text-white/60">Member Since</span>
                  </div>
                  <span className="text-sm text-white/80">{formatDate(contextUser?.created_at)}</span>
                </div>

                <Link
                  href={`/${contextUser?.username}`}
                  target="_blank"
                  className="w-full mt-4 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm flex items-center justify-center gap-2 transition-colors font-medium"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Public Profile</span>
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800/50">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  Quick Actions
                </h2>
              </div>
              <div className="divide-y divide-zinc-800/50">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/30 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Key className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-white">Change Password</span>
                    <span className="text-xs text-white/60">Update your account password</span>
                  </div>
                </button>

                <button
                  onClick={() => setShowRedeemModal(true)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/30 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wand2 className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-white">Redeem Product</span>
                    <span className="text-xs text-white/60">Activate a product or premium</span>
                  </div>
                </button>

                <button
                  onClick={() => setShowSessionModal(true)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/30 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <LogOut className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-white">Manage Sessions</span>
                    <span className="text-xs text-white/60">Check active sessions and devices</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* MFA QR Code Modal */}
        {showMfaQR && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-black rounded-xl p-6 border border-zinc-800/50 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Setup Two-Factor Authentication</h3>
                </div>
                <button
                  onClick={() => setShowMfaQR(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-white/60">
                  Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy) and enter the
                  verification code below.
                </p>

                <div className="flex justify-center bg-white p-4 rounded-lg">
                  {qrCode && (
                    <Image
                      src={qrCode}
                      alt="MFA QR Code"
                      width={200}
                      height={200}
                      draggable="false"
                    />
                  )}
                </div>

                <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    MFA Secret (Manual Setup)
                  </label>
                  <input
                    type="text"
                    value={mfaSecret}
                    readOnly
                    className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-lg 
                  text-white focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-lg 
                  text-white focus:outline-none focus:border-purple-500/30"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowMfaQR(false)}
                    className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnableMfa}
                    disabled={isLoading || mfaCode.length !== 6}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable 2FA'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-black rounded-xl p-6 border border-zinc-800/50 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                    <Key className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Change Password</h3>
                </div>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-white/60">
                  Update your password to maintain account security. You'll be logged out after changing your password.
                </p>

                <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-lg 
                  text-white focus:outline-none focus:border-purple-500/30"
                  />
                </div>

                <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-lg 
                  text-white focus:outline-none focus:border-purple-500/30"
                  />
                </div>

                <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-lg 
                  text-white focus:outline-none focus:border-purple-500/30"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePassword}
                    disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Email-Modal mit lila Akzenten */}
        {showEmailModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-black rounded-xl p-6 border border-zinc-800/50 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Update Email Address</h3>
                </div>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailStep('email');
                    setNewEmail('');
                    setEmailCode('');
                    setEmailError(null);
                  }}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {emailStep === 'email' ? (
                  <>
                    <p className="text-sm text-white/60">
                      Enter your new email address. We'll send a verification code to confirm it's yours.
                    </p>

                    <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        New Email Address
                      </label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter your new email"
                        className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-lg 
                      text-white focus:outline-none focus:border-purple-500/30"
                      />
                    </div>

                    {emailError && (
                      <div className="p-3 bg-red-900/20 border border-red-900/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-400">{emailError}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => setShowEmailModal(false)}
                        className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendEmailVerification}
                        disabled={isEmailLoading || !newEmail || !newEmail.includes('@')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isEmailLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4" />
                            Continue
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-white/60">
                      We've sent a verification code to <span className="text-white font-medium">{newEmail}</span>.
                      Please enter it below to confirm your email address.
                    </p>

                    <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="w-full px-4 py-3 bg-black/50 border border-zinc-800/50 rounded-lg 
                     text-white focus:outline-none focus:border-purple-500/30
                     tracking-wider text-center text-lg font-mono"
                      />
                      <div className="flex justify-center gap-1 mt-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${i < emailCode.length ? 'bg-purple-400' : 'bg-zinc-800'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {emailError && (
                      <div className="p-3 bg-red-900/20 border border-red-900/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-400">{emailError}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => setEmailStep('email')}
                        disabled={isEmailLoading}
                        className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleVerifyEmailCode}
                        disabled={isEmailLoading || !emailCode || emailCode.length < 6}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isEmailLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Verify
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Username-Modal mit lila Akzenten */}
        {showUsernameModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-black rounded-xl p-6 border border-zinc-800/50 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Change Username</h3>
                </div>
                <button
                  onClick={() => {
                    setShowUsernameModal(false);
                    setUsername(contextUser?.username || '');
                  }}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-white/60">
                  Your username is how people find you on haze.bio. Choose something memorable and unique.
                </p>

                <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                      placeholder="Enter username"
                      className="w-full pl-3 pr-28 py-2 bg-black/50 border border-zinc-800/50 rounded-lg 
                    text-white focus:outline-none focus:border-purple-500/30"
                    />
                    <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center justify-center text-xs font-medium text-white/40">
                      haze.bio/
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    Username can only contain letters, numbers, and underscores.
                  </p>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowUsernameModal(false);
                      setUsername(contextUser?.username || '');
                    }}
                    className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateUsername}
                    disabled={isLoading || !username || username === contextUser?.username || username.length < 3}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Username'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display Name Modal mit lila Akzenten */}
        {showDisplayNameModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-black rounded-xl p-6 border border-zinc-800/50 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Change Display Name</h3>
                </div>
                <button
                  onClick={() => {
                    setShowDisplayNameModal(false);
                    setDisplayName(contextUser?.display_name || '');
                  }}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-white/60">
                  Your display name is shown on your profile and helps people recognize you.
                </p>

                <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-lg 
                  text-white focus:outline-none focus:border-purple-500/30"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowDisplayNameModal(false);
                      setDisplayName(contextUser?.display_name || '');
                    }}
                    className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateDisplayName}
                    disabled={isLoading || displayName === contextUser?.display_name}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Display Name'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alias Modal mit lila Akzenten */}
        {showAliasModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-black rounded-xl p-6 border border-zinc-800/50 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                    <AtSign className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Change Profile Alias</h3>
                </div>
                <button
                  onClick={() => {
                    setShowAliasModal(false);
                    setAlias(contextUser?.alias || '');
                  }}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-white/60">
                  An alias can help people find your profile using a different name.
                  Leave this blank if you don't want to set an alias.
                </p>

                <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Profile Alias
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                      placeholder="Enter optional alias"
                      className="w-full pl-3 pr-28 py-2 bg-black/50 border border-zinc-800/50 rounded-lg 
                    text-white focus:outline-none focus:border-purple-500/30"
                    />
                    <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center justify-center text-xs font-medium text-white/40">
                      haze.bio/
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    Alias can only contain letters, numbers, and underscores.
                  </p>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAliasModal(false);
                      setAlias(contextUser?.alias || '');
                    }}
                    className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateAlias}
                    disabled={isLoading || alias === contextUser?.alias}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Alias'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirmModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-black rounded-xl p-6 border border-zinc-800/50 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-800/20 rounded-lg flex items-center justify-center">
                    <Trash className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Delete Account</h3>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-red-900/20 border border-red-800/30 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium mb-1">Warning: This action cannot be undone</p>
                      <p className="text-sm text-white/70">
                        Deleting your account will permanently remove all your data, including your profile,
                        social links, and customizations. This action is immediate and irreversible.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-white/60">
                  To confirm, please type <span className="text-white font-medium">delete my account</span> below.
                </p>

                <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Confirmation
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type 'delete my account'"
                    className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-lg 
            text-white focus:outline-none focus:border-red-500/30"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowDeleteConfirmModal(false);
                      setDeleteConfirmText('');
                    }}
                    className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount || deleteConfirmText !== 'delete my account'}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isDeletingAccount ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash className="w-4 h-4" />
                        Delete Forever
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showExportPasswordModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-black rounded-xl p-6 border border-zinc-800/50 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-900/20 rounded-lg flex items-center justify-center">
                    <Download className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Download Data Export</h3>
                </div>
                <button
                  onClick={() => {
                    setShowExportPasswordModal(false);
                    setExportPassword('');
                  }}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-white/60">
                  Enter the password that was sent to your email to download your data export.
                </p>

                <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Export Password
                  </label>
                  <input
                    type="password"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    placeholder="Enter password from email"
                    className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-lg 
            text-white focus:outline-none focus:border-amber-500/30"
                  />
                </div>

                <div className="p-4 bg-amber-900/20 border border-amber-800/30 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium mb-1">Security Notice</p>
                      <p className="text-sm text-white/70">
                        The password was sent to your email address. This helps ensure that only you can access your personal data.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowExportPasswordModal(false);
                      setExportPassword('');
                    }}
                    className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDownloadExport}
                    disabled={isExportLoading || !exportPassword}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isExportLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions-Modal */}
        {showSessionModal && (
          <SessionModal
            isOpen={showSessionModal}
            onClose={() => setShowSessionModal(false)}
            sessions={sessions}
            onLogoutSession={handleLogoutSession}
            onLogoutAllSessions={handleLogoutAllSessions}
            isLoading={isLoading}
          />
        )}

        {/* Redeem Modal */}
        {showRedeemModal && (
          <RedeemProductModal
            onClose={() => setShowRedeemModal(false)}
          />
        )}
      </div>
    </DashboardLayout >
  );
}