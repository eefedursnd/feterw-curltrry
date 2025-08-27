'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Loader2, Palette, Share2, Wand2, X, Upload, CreditCard, Award, BadgeCheck, Info, LinkIcon, Copy, Settings, Plus, ListRestart, Eye, ArrowRight } from 'lucide-react';
import * as SocialIcons from 'haze.bio/socials/Socials';
import { User, UserSocial, UserProfile } from 'haze.bio/types';
import toast from 'react-hot-toast';
import SocialsSort from 'haze.bio/components/sorting/SocialsSort';
import { profileAPI, socialAPI, fileAPI } from 'haze.bio/api';
import DashboardLayout from '../dashboard/Layout';
import ColorPickerPortal from '../ui/ColorPickerPortal';
import { getDefaultSocialType, Socials } from 'haze.bio/types/socials';
import Image from 'next/image';
import { useFileUpload } from '../FileUpload';
import { log } from 'console';
import Tooltip from '../ui/Tooltip';
import { useUser } from 'haze.bio/context/UserContext';
import Link from 'next/link';

interface SocialsContentProps {
}

const PLATFORM_LIMITS = {
    custom: 5,
    default: 2
} as const;

export default function SocialsContent({ }: SocialsContentProps) {
    const { user: contextUser, updateUser } = useUser();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [socials, setSocials] = useState<UserSocial[]>(contextUser?.socials || []);
    const [selectedPlatform, setSelectedPlatform] = useState('');
    const [socialUrl, setSocialUrl] = useState('');
    const [customFullUrl, setCustomFullUrl] = useState('');
    const [monochromeIcons, setMonochromeIcons] = useState(contextUser?.profile?.monochrome_icons || false);
    const [iconColor, setIconColor] = useState(contextUser?.profile?.icon_color || '#ffffff');
    const [isLoading, setIsLoading] = useState(false);
    const [editingSocial, setEditingSocial] = useState<UserSocial | null>(null);
    const [customIconUrl, setCustomIconUrl] = useState('');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [socialType, setSocialType] = useState<'redirect' | 'copy_text'>('redirect');
    const [colorPickerRect, setColorPickerRect] = useState<DOMRect | null>(null);
    const colorButtonRef = useRef<HTMLDivElement>(null);
    const colorPickerRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'manage' | 'available'>('manage');

    const handleCustomIconUpload = (fileUrl: string) => {
        setCustomIconUrl(fileUrl);
    };

    const { openFileUploadDialog, isUploading, uploadProgress } = useFileUpload(
        handleCustomIconUpload,
        { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] },
        'custom_social'
    );

    const getBaseUrl = (platform: string) => {
        if (platform.toLowerCase() === 'custom') {
            return '';
        }

        const platformLower = platform.toLowerCase();

        if (platformLower === 'youtube') {
            return 'https://youtube.com/@';
        }
        if (platformLower === 'tiktok') {
            return 'https://tiktok.com/@';
        }
        if (platformLower === 'steam') {
            return 'https://steamcommunity.com/id/';
        }

        const placeholder = getPlaceholder(platform);
        const parts = placeholder.split(/\/(username|id)/);
        let baseUrl = parts[0] + '/';

        if (baseUrl.endsWith('@/')) {
            baseUrl = baseUrl.slice(0, -2) + '/';
        }

        return baseUrl;
    }

    const handleAddSocial = async () => {
        try {
            let fullUrl;
            if (selectedPlatform.toLowerCase() === 'custom') {
                fullUrl = customFullUrl;
                if (socialType === 'redirect' && !fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
                    fullUrl = 'https://' + fullUrl;
                }
            } else {
                fullUrl = socialType === 'copy_text'
                    ? socialUrl
                    : getBaseUrl(selectedPlatform) + socialUrl;
            }

            const newSocial: Omit<UserSocial, 'uid' | 'id'> = {
                platform: selectedPlatform,
                link: fullUrl,
                sort: socials.length,
                hidden: false,
                social_type: socialType,
                image_url: selectedPlatform.toLowerCase() === 'custom' ? customIconUrl : undefined
            };
            const createdSocial = await socialAPI.createSocial(newSocial);
            const updatedSocials = [...socials, { ...newSocial, uid: createdSocial.uid, id: createdSocial.id }];
            setSocials(updatedSocials);

            if (contextUser) {
                updateUser({
                    socials: updatedSocials
                });
            }

            toast.success('Social link added successfully');
            handleCloseModal();
        } catch (error) {
            toast.error('Failed to add social link');
        }
    };

    const handleUpdateSocial = async () => {
        if (!editingSocial) return;
        try {
            let fullUrl;
            if (selectedPlatform.toLowerCase() === 'custom') {
                fullUrl = customFullUrl;
                if (socialType === 'redirect' && !fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
                    fullUrl = 'https://' + fullUrl;
                }
            } else {
                fullUrl = socialType === 'copy_text'
                    ? socialUrl
                    : getBaseUrl(selectedPlatform) + socialUrl;
            }

            const updateData: Partial<UserSocial> = {
                link: fullUrl,
                social_type: socialType
            };

            if (selectedPlatform.toLowerCase() === 'custom' && customIconUrl) {
                updateData.image_url = customIconUrl;
            }

            await socialAPI.updateSocial(editingSocial.id, updateData);
            const updatedSocials = socials.map((social) =>
                social.id === editingSocial.id
                    ? { ...social, ...updateData }
                    : social
            );

            setSocials(updatedSocials);

            if (contextUser) {
                updateUser({
                    socials: updatedSocials
                });
            }

            toast.success('Social link updated successfully');
            handleCloseModal();
        } catch (error) {
            toast.error('Failed to update social link');
        }
    };

    const handleDeleteSocial = async (socialId: number) => {
        try {
            await socialAPI.deleteSocial(socialId);
            const updatedSocials = socials.filter((social) => social.id !== socialId);
            setSocials(updatedSocials);

            if (contextUser) {
                updateUser({
                    socials: updatedSocials
                });
            }

            toast.success('Social link deleted successfully');
        } catch (error) {
            toast.error('Failed to delete social link');
        }
    };

    const handleReorder = (newSocials: UserSocial[]) => {
        setSocials(newSocials);

        if (contextUser) {
            updateUser({
                socials: newSocials
            });
        }
    };

    const getIconComponent = (platform: string) => {
        const platformName = platform === "ko-fi" ? "kofi" : platform;
        const iconName = `${platformName.charAt(0).toUpperCase()}${platformName.slice(1)}Icon`;
        return SocialIcons[iconName as keyof typeof SocialIcons];
    };

    const isUrlValid = (username: string) => {
        if (selectedPlatform.toLowerCase() === 'custom') {
            return customFullUrl.length > 0;
        }

        if (socialType === 'copy_text') {
            return username.length > 0;
        }

        return username.length > 0 && !username.includes('/');
    };

    const handleSaveChanges = async () => {
        try {
            setIsLoading(true);
            await profileAPI.updateProfile({ monochrome_icons: monochromeIcons, icon_color: iconColor });

            if (contextUser && contextUser.profile) {
                updateUser({
                    profile: {
                        ...contextUser.profile,
                        monochrome_icons: monochromeIcons,
                        icon_color: iconColor
                    }
                });
            }

            setMonochromeIcons(monochromeIcons);
            setIconColor(iconColor);
            toast.success('Social settings saved successfully');
        } catch (error) {
            toast.error('Failed to save social settings');
            console.error('Failed to update settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getPlaceholder = (platform: string) => {
        const placeholders: Record<string, string> = {
            snapchat: 'https://snapchat.com/add/username',
            youtube: '@username',
            discord: 'https://discord.com/users/id',
            spotify: 'https://open.spotify.com/user/username',
            instagram: 'https://instagram.com/username',
            x: 'https://x.com/username',
            tiktok: '@username',
            telegram: 'https://t.me/username',
            github: 'https://github.com/username',
            roblox: 'https://www.roblox.com/users/id',
            gitlab: 'https://gitlab.com/username',
            twitch: 'https://twitch.tv/username',
            namemc: 'https://namemc.com/profile/username',
            steam: 'username',
            kick: 'https://kick.com/username',
            behance: 'https://behance.net/username',
            litecoin: 'https://litecoin.net/',
            bitcoin: 'https://bitcoin.org/',
            ethereum: 'https://ethereum.org/en/',
            monero: 'https://getmonero.org/',
            solana: 'https://www.solana.com/',
            paypal: 'https://paypal.me/username',
            reddit: 'https://reddit.com/user/username',
            facebook: 'https://facebook.com/username',
            'ko-fi': 'https://ko-fi.com/username',
            email: 'mailto:example@email.com',
            pinterest: 'https://pinterest.com/username',
            custom: 'https://',
        };
        return placeholders[platform.toLowerCase()] || 'https://example.com';
    };

    const getInputLabel = (platform: string) => {
        if (platform.toLowerCase() === 'custom') {
            return 'URL';
        }
        return platform.toLowerCase() === 'discord' || platform.toLowerCase() === 'roblox' ? 'ID' : 'Username';
    };

    const handleOpenModal = (platform: string) => {
        const platformSocials = socials.filter(s => s.platform.toLowerCase() === platform.toLowerCase());
        const limit = platform.toLowerCase() === 'custom' ? PLATFORM_LIMITS.custom : PLATFORM_LIMITS.default;

        if (platformSocials.length >= limit) {
            toast.error(`You can only add up to ${limit} ${platform} links`);
            return;
        }

        setSelectedPlatform(platform);
        setSocialUrl('');
        setCustomFullUrl('');
        setCustomIconUrl('');
        const defaultType = getDefaultSocialType(platform.toLowerCase());
        setSocialType(defaultType);
        setEditingSocial(null);
        setIsModalOpen(true);
    };

    const handleEditSocial = (social: UserSocial) => {
        setSelectedPlatform(social.platform);
        setSocialType(social.social_type as 'redirect' | 'copy_text');

        if (social.platform.toLowerCase() === 'custom') {
            setCustomFullUrl(social.link);
            setCustomIconUrl(social.image_url || '');
        } else {
            if (social.social_type === 'copy_text') {
                setSocialUrl(social.link);
            } else {
                const baseUrl = getBaseUrl(social.platform);
                setSocialUrl(social.link.replace(baseUrl, ''));
            }
        }

        setEditingSocial(social);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPlatform('');
        setSocialUrl('');
        setCustomFullUrl('');
        setCustomIconUrl('');
        setEditingSocial(null);
    };

    const handleCloseColorPicker = () => {
        setShowColorPicker(false);
    };

    const handleColorClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        const buttonRect = colorButtonRef.current?.getBoundingClientRect() || null;
        setColorPickerRect(buttonRect);
        setShowColorPicker(!showColorPicker);
    };

    const addCacheBuster = (url: string) => {
        if (!url) return '';
        return `${url}?${new Date().getTime()}`;
    };

    const handleRemoveCustomIcon = async () => {
        try {
            if (!customIconUrl) return;

            await fileAPI.deleteFile(customIconUrl);
            setCustomIconUrl('');

            if (editingSocial) {
                setSocials(socials.map(social =>
                    social.platform === editingSocial.platform
                        ? { ...social, image_url: '' }
                        : social
                ));
            }

            toast.success('Custom icon removed successfully');
        } catch (error) {
            console.error('Error removing custom icon:', error);
            toast.error('Failed to remove custom icon');
        }
    };

    const PlatformButton = ({ platform }: { platform: string }) => {
        const IconComponent = getIconComponent(platform);
        const platformSocials = socials.filter(s => s.platform.toLowerCase() === platform.toLowerCase());
        const limit = platform.toLowerCase() === 'custom' ? PLATFORM_LIMITS.custom : PLATFORM_LIMITS.default;
        const count = platformSocials.length;
        const isConnected = count >= limit;

        const isDarkIcon = ['namemc'].includes(platform.toLowerCase());

        return (
            <button
                key={platform}
                onClick={() => !isConnected && handleOpenModal(platform)}
                disabled={isConnected}
                className={`p-3 rounded-lg border transition-all flex items-center gap-3
                    ${isConnected
                        ? 'bg-zinc-800/40 border-zinc-700/50 cursor-not-allowed'
                        : 'bg-zinc-800/30 border-zinc-800/50 hover:bg-zinc-800/40 hover:border-purple-500/20 cursor-pointer'
                    }`}
            >
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${isConnected
                    ? 'bg-zinc-700/50'
                    : isDarkIcon
                        ? 'bg-white/90'
                        : 'bg-purple-800/20'
                    }`}>
                    {IconComponent && (
                        <IconComponent
                            size={20}
                            className={
                                isConnected
                                    ? 'text-white/60'
                                    : isDarkIcon
                                        ? 'text-black'
                                        : 'text-purple-400'
                            }
                        />
                    )}
                </div>
                <div className="text-left flex-1 min-w-0">
                    <span className={`block text-sm font-medium truncate ${isConnected ? 'text-white/60' : 'text-white'}`}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </span>
                    <span className="text-xs text-white/60">
                        {count > 0 && `${count}/${limit} used`}
                    </span>
                </div>
            </button>
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-[100rem] mx-auto space-y-8 relative">
                {/* Hero Section with Header */}
                <div className="bg-[#0E0E0E] rounded-xl p-8 border border-zinc-800/50 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"></div>

                    <div className="relative z-10 max-w-3xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">Social Links</h1>
                                    <div className="px-3 py-1 bg-purple-900/20 rounded-full border border-purple-800/30 flex items-center gap-1.5">
                                        <LinkIcon className="w-3.5 h-3.5 text-purple-400" />
                                        <span className="text-sm font-medium text-white/80">
                                            {socials.length} Links
                                        </span>
                                    </div>
                                </div>
                                <p className="text-white/70 text-sm md:text-base mt-1">
                                    Manage your social links on your profile.
                                </p>
                            </div>
                            <button
                                onClick={handleSaveChanges}
                                disabled={isLoading}
                                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500
                                transition-colors font-medium disabled:opacity-50
                                disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex gap-2 border-t border-zinc-800/50 pt-4">
                            <button
                                onClick={() => setActiveTab('manage')}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                ${activeTab === 'manage'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                            >
                                <Settings className="w-4 h-4" /> Manage Links
                            </button>
                            <button
                                onClick={() => setActiveTab('available')}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                ${activeTab === 'available'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                            >
                                <Plus className="w-4 h-4" /> Add New Link
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'manage' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Social Links with SocialsSort */}
                            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <LinkIcon className="w-4 h-4 text-purple-400" />
                                        Your Social Links
                                    </h2>
                                    <span className="text-xs text-white/60">
                                        {socials.length} {socials.length === 1 ? 'Link' : 'Links'}
                                    </span>
                                </div>
                                <div className="p-5">
                                    <SocialsSort
                                        socials={socials}
                                        onReorder={handleReorder}
                                        onEdit={handleEditSocial}
                                        onDelete={handleDeleteSocial}
                                    />
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Info className="w-4 h-4 text-purple-400" />
                                        Social Tips
                                    </h2>
                                </div>
                                <div className="p-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                            <div className="flex items-start gap-3 mb-1">
                                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <ListRestart className="w-4 h-4 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-white">Reordering Links</h3>
                                                    <p className="text-xs text-white/60 mt-1">
                                                        Drag and drop your links to change their order on your profile. Most important links should be at the top.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                            <div className="flex items-start gap-3 mb-1">
                                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Copy className="w-4 h-4 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-white">Copy Text Links</h3>
                                                    <p className="text-xs text-white/60 mt-1">
                                                        Some links can be set to copy text instead of redirecting, perfect for Discord tags or wallet addresses.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Right Column - Side Content */}
                        <div className="space-y-6">
                            {/* Icon Settings */}
                            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Palette className="w-4 h-4 text-purple-400" />
                                        Icon Display
                                    </h2>
                                </div>
                                <div className="p-5 space-y-5">
                                    {/* Monochrome Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg
                                            border border-zinc-800/50 hover:border-purple-800/30 hover:bg-zinc-800/40 transition-all duration-300"
                                    >
                                        <div>
                                            <span className="block text-sm font-medium text-white">
                                                Monochrome Icons
                                            </span>
                                            <span className="text-xs text-white/60">
                                                Display icons in a single color
                                            </span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={monochromeIcons}
                                                onChange={(e) => setMonochromeIcons(e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer
                                                    peer-checked:after:translate-x-full peer-checked:after:border-white
                                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                                    after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                                                    peer-checked:bg-purple-600"
                                            />
                                        </label>
                                    </div>

                                    {/* Color Picker */}
                                    <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-800/30 hover:bg-zinc-800/40 transition-all duration-300">
                                        <label className="block text-sm font-medium text-white mb-3">
                                            Icon Color
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <div
                                                ref={colorButtonRef}
                                                onClick={handleColorClick}
                                                className="w-12 h-12 rounded-lg border border-zinc-700/50 cursor-pointer
                                                    transition-transform hover:scale-105 hover:border-purple-500/30 shadow-md"
                                                style={{ backgroundColor: iconColor }}
                                            />
                                            <div className="flex items-center gap-1 bg-[#0E0E0E]/40 px-3 py-2 rounded-lg border border-zinc-800/50">
                                                <span className="text-xs text-white/60">#</span>
                                                <span className="text-sm text-white">
                                                    {iconColor.replace('#', '')}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-white/60 mt-2">
                                            This color will be used when the monochrome setting is enabled
                                        </p>
                                    </div>

                                    {/* Preview */}
                                    <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                                        <h3 className="text-sm font-medium text-white mb-3">Preview</h3>
                                        <div className="bg-[#0E0E0E]/40 rounded-lg border border-zinc-800/60 p-3 flex flex-wrap gap-2 justify-center">
                                            {['instagram', 'github', 'discord', 'x'].map(platform => {
                                                const IconComponent = getIconComponent(platform);
                                                return IconComponent ? (
                                                    <div key={platform} className="flex flex-col items-center gap-1">
                                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-zinc-800/50">
                                                            <IconComponent 
                                                                size={20} 
                                                                className={monochromeIcons ? "text-current" : ""}
                                                                color={monochromeIcons ? iconColor : undefined} 
                                                            />
                                                        </div>
                                                        <span className="text-xs text-white/40">{platform}</span>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Settings className="w-4 h-4 text-purple-400" />
                                        Quick Actions
                                    </h2>
                                </div>
                                <div className="divide-y divide-zinc-800/50">
                                    <button
                                        onClick={() => setActiveTab('available')}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/30 transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Plus className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-medium text-white">Add New Link</span>
                                            <span className="text-xs text-white/60">Connect a new social account</span>
                                        </div>
                                    </button>
                                    
                                    <Link
                                        href={`/${contextUser?.username}`}
                                        target="_blank"
                                        className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Eye className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-medium text-white">View Profile</span>
                                            <span className="text-xs text-white/60">See how your links look to visitors</span>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'available' && (
                    <div className="space-y-6">
                        {/* Available Social Platforms */}
                        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800/50">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <Award className="w-4 h-4 text-purple-400" />
                                    Add Social Link
                                </h2>
                            </div>
                            <div className="p-5 space-y-6">
                                {/* Popular Platforms */}
                                <div>
                                    <h3 className="text-sm font-medium text-white/80 mb-3 pl-1">Popular Platforms</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                                        {['instagram', 'x', 'reddit', 'tiktok', 'youtube', 'facebook', 'discord', 'twitch', 'steam', 'roblox', 'namemc', 'kick'].map((platform) => (
                                            <PlatformButton key={platform} platform={platform} />
                                        ))}
                                    </div>
                                </div>

                                {/* Crypto Platforms */}
                                <div>
                                    <h3 className="text-sm font-medium text-white/80 mb-3 pl-1">Crypto</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                                        {['bitcoin', 'ethereum', 'litecoin', 'monero', 'solana'].map((platform) => (
                                            <PlatformButton key={platform} platform={platform} />
                                        ))}
                                    </div>
                                </div>

                                {/* Other Platforms */}
                                <div>
                                    <h3 className="text-sm font-medium text-white/80 mb-3 pl-1">Other Platforms</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                                        {['snapchat', 'spotify', 'telegram', 'github', 'gitlab', 'behance', 'pinterest', 'ko-fi', 'email', 'paypal', 'custom'].map((platform) => (
                                            <PlatformButton key={platform} platform={platform} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Help Section */}
                        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden p-6 relative">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.15),transparent_70%)]"></div>
                            
                            <div className="relative flex flex-col md:flex-row gap-6 items-center">
                                <div className="w-16 h-16 bg-purple-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <LinkIcon className="w-8 h-8 text-purple-400" />
                                </div>
                                
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-white mb-2">Need a different platform?</h3>
                                    <p className="text-white/70 mb-0 md:mb-0 max-w-2xl">
                                        If you need a social platform that's not listed, you can use the "Custom" option to add any link or create a feature request on our Discord.
                                    </p>
                                </div>
                                
                                <a
                                    href="https://discord.gg/cutz"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all text-sm font-medium flex items-center gap-2 flex-shrink-0"
                                >
                                    Request Platform
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Modal for Adding/Editing Social Link */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Backdrop with blur */}
                        <div
                            className="fixed inset-0 bg-[#0E0E0E]/70 backdrop-blur-sm"
                            onClick={handleCloseModal}
                        />

                        {/* Modal content */}
                        <div className="relative bg-[#0E0E0E] rounded-xl border border-zinc-800/50 w-full max-w-md max-h-[85vh] overflow-y-auto m-4 z-10">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center">
                                        <Share2 className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-white">{editingSocial ? 'Edit Social Link' : 'Add Social Link'}</h3>
                                        <p className="text-xs text-white/50">Connect your online presence</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Platform Selection */}
                                <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                    <label className="block text-sm font-medium text-white mb-3">
                                        Platform
                                    </label>
                                    <div className="flex items-center gap-3 p-2.5 bg-[#0E0E0E]/40 rounded-lg border border-zinc-800/60">
                                        {getIconComponent(selectedPlatform) &&
                                            React.createElement(getIconComponent(selectedPlatform), {
                                                size: 22,
                                                className: "flex-shrink-0 text-purple-400"
                                            })
                                        }
                                        <span className="text-white capitalize">{selectedPlatform}</span>
                                    </div>
                                </div>

                                {Socials[selectedPlatform.toLowerCase()] &&
                                    Socials[selectedPlatform.toLowerCase()].supportedTypes.redirect &&
                                    Socials[selectedPlatform.toLowerCase()].supportedTypes.copy_text && (
                                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <label className="text-sm font-medium text-white">
                                                    Social Type
                                                </label>
                                                <Tooltip
                                                    text="<strong>Redirect:</strong> Clicking the link will take visitors directly to the page.<br /><br /><strong>Copy Text:</strong> Clicking will copy text to the clipboard instead of redirecting."
                                                    position="top"
                                                    html={true}
                                                >
                                                    <div className="cursor-help">
                                                        <Info className="w-4 h-4 text-white/40 hover:text-white/70 transition-colors" />
                                                    </div>
                                                </Tooltip>
                                            </div>
                                            <div className="flex space-x-2">
                                                {Socials[selectedPlatform.toLowerCase()]?.supportedTypes.redirect && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSocialType('redirect')}
                                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border 
                                                        ${socialType === 'redirect'
                                                            ? 'bg-purple-600 text-white border-purple-700'
                                                            : 'bg-[#0E0E0E]/40 border-zinc-800/60 text-white/70 hover:bg-zinc-800/40'
                                                        } transition-colors`}
                                                    >
                                                        <LinkIcon className="w-4 h-4" />
                                                        Redirect
                                                    </button>
                                                )}
                                                {Socials[selectedPlatform.toLowerCase()]?.supportedTypes.copy_text && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSocialType('copy_text')}
                                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border 
                                                        ${socialType === 'copy_text'
                                                            ? 'bg-purple-600 text-white border-purple-700'
                                                            : 'bg-[#0E0E0E]/40 border-zinc-800/60 text-white/70 hover:bg-zinc-800/40'
                                                        } transition-colors`}
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                        Copy Text
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {selectedPlatform.toLowerCase() === 'custom' ? (
                                    <>
                                        {/* Custom Icon Upload */}
                                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                            <label className="block text-sm font-medium text-white mb-3">
                                                Custom Icon
                                            </label>
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="relative group">
                                                    <div
                                                        className="w-16 h-16 bg-black/50 rounded-lg border border-zinc-800/60 flex items-center justify-center overflow-hidden cursor-pointer group-hover:border-purple-500/30 transition-colors"
                                                        onClick={openFileUploadDialog}
                                                    >
                                                        {customIconUrl ? (
                                                            <>
                                                                <Image
                                                                    src={addCacheBuster(customIconUrl)}
                                                                    alt="Custom Icon"
                                                                    width={64}
                                                                    height={64}
                                                                    draggable="false"
                                                                    className="object-cover"
                                                                />
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRemoveCustomIcon();
                                                                    }}
                                                                    className="absolute top-1 right-1 p-1 bg-black/80 rounded-full 
                                                                    hover:bg-black transition-colors opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <X className="w-3 h-3 text-white" />
                                                                </button>
                                                            </>
                                                        ) : isUploading ? (
                                                            <div className="flex flex-col items-center justify-center">
                                                                <div className="w-10 h-10 relative">
                                                                    <div className="absolute inset-0 rounded-full border-2 border-zinc-700 border-opacity-25"></div>
                                                                    <div 
                                                                        className="absolute inset-0 rounded-full border-2 border-purple-500 border-t-transparent" 
                                                                        style={{ 
                                                                            transform: 'rotate(0deg)',
                                                                            animation: 'spin 1s linear infinite' 
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                                <span className="mt-2 text-xs text-white/70">{uploadProgress}%</span>
                                                            </div>
                                                        ) : (
                                                            <Upload className="w-6 h-6 text-purple-400" />
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-white/50 mt-2">
                                                    Upload custom icon (optional)
                                                </p>
                                            </div>
                                        </div>

                                        {/* Custom URL Input */}
                                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                            <label className="block text-sm font-medium text-white mb-3">
                                                {socialType === 'copy_text' ? 'Text to Copy' : 'URL'}
                                            </label>

                                            {socialType === 'copy_text' ? (
                                                <input
                                                    type="text"
                                                    value={customFullUrl}
                                                    onChange={(e) => setCustomFullUrl(e.target.value)}
                                                    placeholder="Enter text to copy"
                                                    className="w-full px-3 py-2.5 bg-[#0E0E0E]/40 border border-zinc-800/60 rounded-lg 
                                                    text-white text-sm placeholder-white/30 focus:outline-none
                                                    focus:border-purple-500/30 transition-colors"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={customFullUrl}
                                                    onChange={(e) => setCustomFullUrl(e.target.value)}
                                                    placeholder="Enter full URL (e.g. https://example.com)"
                                                    className="w-full px-3 py-2.5 bg-[#0E0E0E]/40 border border-zinc-800/60 rounded-lg 
                                                    text-white text-sm placeholder-white/30 focus:outline-none
                                                    focus:border-purple-500/30 transition-colors"
                                                />
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <label className="block text-sm font-medium text-white mb-3">
                                            {socialType === 'copy_text' ? 'Text to Copy' : getInputLabel(selectedPlatform)}
                                        </label>

                                        {socialType === 'copy_text' ? (
                                            <input
                                                type="text"
                                                value={socialUrl}
                                                onChange={(e) => setSocialUrl(e.target.value)}
                                                placeholder="Enter text to copy"
                                                className="w-full px-3 py-2.5 bg-[#0E0E0E]/40 border border-zinc-800/60 rounded-lg 
                                                text-white text-sm placeholder-white/30 focus:outline-none
                                                focus:border-purple-500/30 transition-colors"
                                            />
                                        ) : (
                                            <div className="flex items-center w-full bg-[#0E0E0E]/40 border border-zinc-800/60 rounded-lg overflow-hidden focus-within:border-purple-500/30 transition-colors">
                                                <div className="px-3 py-2.5 bg-zinc-800/80 text-white/50 text-sm border-r border-zinc-800/60 max-w-[50%] truncate">
                                                    {getBaseUrl(selectedPlatform)}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={socialUrl}
                                                    onChange={(e) => setSocialUrl(e.target.value)}
                                                    placeholder={getInputLabel(selectedPlatform).toLowerCase()}
                                                    className="flex-1 px-3 py-2.5 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-3">
                                    <button 
                                        className="flex-1 py-2.5 px-4 rounded-lg bg-zinc-800/50 text-white hover:bg-zinc-700/50 transition-colors"
                                        onClick={handleCloseModal}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2
                                            ${isUrlValid(socialUrl) || (selectedPlatform.toLowerCase() === 'custom' && customFullUrl.length > 0)
                                                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                                : 'bg-purple-600/30 text-white/50 cursor-not-allowed'
                                            } transition-colors`}
                                        disabled={!isUrlValid(socialUrl) && !(selectedPlatform.toLowerCase() === 'custom' && customFullUrl.length > 0)}
                                        onClick={editingSocial ? handleUpdateSocial : handleAddSocial}
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        {editingSocial ? 'Save Changes' : 'Add Link'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Color Picker Portal */}
                {showColorPicker && (
                    <ColorPickerPortal
                        color={iconColor}
                        onChange={setIconColor}
                        onClose={handleCloseColorPicker}
                        targetRect={colorPickerRect}
                        ref={colorPickerRef}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}