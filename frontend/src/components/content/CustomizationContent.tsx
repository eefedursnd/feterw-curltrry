'use client';

import { useState, useRef, useEffect } from 'react';
import { Eye, Loader2, Palette, Wand2, Sliders, Image as ImageIcon, Type, Sparkles, Link, Settings, Plus, Gem, ArrowRight, PenSquare } from 'lucide-react';
import { User, UserProfile } from 'haze.bio/types';
import { profileAPI } from 'haze.bio/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../dashboard/Layout';
import ColorPickerPortal from 'haze.bio/components/ui/ColorPickerPortal';
import CustomizationSettings from '../customization/CustomizationSettings';
import PremiumCustomizationSettings from '../customization/PremiumCustomizationSettings';
import { useUser } from 'haze.bio/context/UserContext';
import ProfilePreview from '../customization/preview/ProfilePreview';
import { PremiumBadge } from 'haze.bio/badges/Badges';

interface CustomizationContentProps {
}

export default function CustomizationContent({ }: CustomizationContentProps) {
    const { user: contextUser, updateUser } = useUser();

    const [profile, setProfile] = useState<UserProfile>(contextUser?.profile || {} as UserProfile);
    const [activeColor, setActiveColor] = useState<'accent' | 'text' | 'background' | 'icon' | 'gradient_from' | 'gradient_to' | null>(null);
    const [colorPickerRect, setColorPickerRect] = useState<DOMRect | null>(null);
    const [colorButtonsRef] = useState<Record<string, HTMLDivElement | null>>({});
    const colorPickerRef = useRef<HTMLDivElement>(null);
    const [showPremiumSettings, setShowPremiumSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [modifiedFields, setModifiedFields] = useState<Partial<UserProfile>>({});

    useEffect(() => {
        if (contextUser?.profile) {
            setProfile(contextUser?.profile);
        }
    }, [contextUser]);

    const handleSettingChange = async (key: keyof UserProfile, value: any) => {
        if (profile[key] === value) {
            return;
        }

        setProfile((prevState) => ({
            ...prevState,
            [key]: value,
        }));

        if (contextUser) {
            updateUser({
                profile: {
                    ...contextUser.profile,
                    [key]: value,
                }
            });
        }

        setModifiedFields(prev => ({
            ...prev,
            [key]: value === null ? undefined : value,
        }));
    };

    const handleColorClick = (key: typeof activeColor, event: React.MouseEvent) => {
        event.stopPropagation();
        if (activeColor === key) {
            setActiveColor(null);
            setColorPickerRect(null);
            return;
        }
        const buttonRect = colorButtonsRef[key || '']?.getBoundingClientRect() || null;
        setActiveColor(key);
        setColorPickerRect(buttonRect);
    };

    const handleFileUpload = (type: 'avatar_url' | 'background_url' | 'audio_url' | 'banner_url') => async (fileName: string) => {
        if (!fileName) {
            toast.success(`${type === 'avatar_url' ? 'Avatar' : type === 'background_url' ? 'Background' : type === 'audio_url' ? 'Audio' : 'Banner'} removed successfully`);
            handleSettingChange(type, null);
            return;
        }

        try {
            handleSettingChange(type, fileName);
            toast.success(`${type === 'avatar_url' ? 'Avatar' : type === 'background_url' ? 'Background' : type === 'audio_url' ? 'Audio' : 'Banner'} uploaded successfully`);
        } catch (error) {
            console.error('Error handling file upload:', error);
            toast.error(`Failed to upload ${type === 'avatar_url' ? 'avatar' : type === 'background_url' ? 'background' : type === 'audio_url' ? 'audio' : 'banner'}`);
        }
    };

    const handleSaveChanges = async () => {
        try {
            setIsLoading(true);

            if (Object.keys(modifiedFields).length === 0) {
                toast.success('No changes to save');
                return;
            }

            console.log('Saving changes:', modifiedFields);

            const updatedFields = await profileAPI.updateProfile(modifiedFields as UserProfile);

            if (contextUser) {
                updateUser({
                    profile: {
                        ...contextUser.profile,
                        ...updatedFields
                    }
                });
            }

            toast.success('Profile settings updated successfully');

            setModifiedFields({});
        } catch (error: any) {
            console.error('Error updating profile settings:', error);
            toast.error(error.message || 'Failed to update profile settings');
        } finally {
            setIsLoading(false);
        }
    };

    const getEffectClass = (effect: string | undefined | null): { className: string; style?: React.CSSProperties } => {
        if (!contextUser?.has_premium && (effect === 'hacker')) {
            return { className: 'text-zinc-500 italic' };
        }

        switch (effect) {
            case 'gradient':
                return {
                    className: 'bg-clip-text text-transparent',
                    style: {
                        backgroundImage: `linear-gradient(to right, ${contextUser?.profile.gradient_from_color}, ${contextUser?.profile.gradient_to_color})`
                    }
                };
            case 'rainbow':
                return {
                    className: 'bg-[linear-gradient(to_right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] bg-clip-text text-transparent animate-rainbow'
                };
            case 'glitch':
                return {
                    className: 'animate-glitch text-white'
                };
            case 'cyber':
                return {
                    className: 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]'
                };
            case 'retro':
                return {
                    className: 'animate-retro'
                };
            case '3d':
                return {
                    className: 'animate-3d text-white',
                    style: { display: 'inline-block' }
                };
            case 'hacker':
                return {
                    className: 'animate-hacker',
                    style: { display: 'inline-block' }
                };
            default:
                return {
                    className: 'text-white'
                };
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[100rem] mx-auto space-y-6">
                {/* Hero Section with Header */}
                <div className="bg-[#0E0E0E] rounded-xl p-8 border border-zinc-800/50 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"></div>

                    <div className="relative z-10 max-w-3xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">Customize Your Profile</h1>
                                    {contextUser?.has_premium && (
                                        <div className="px-3 py-1 bg-purple-900/20 rounded-full border border-purple-800/30 flex items-center gap-1.5">
                                            <PremiumBadge size={14} />
                                            <span className="text-sm font-medium text-white/80">Premium</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-white/70 text-sm md:text-base mt-1">
                                    Customize your profile with colors, effects, and more.
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
                        {contextUser?.has_premium && (
                            <div className="flex gap-2 border-t border-zinc-800/50 pt-4">
                                <button
                                    onClick={() => setShowPremiumSettings(false)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                    ${!showPremiumSettings
                                            ? 'bg-purple-600 text-white'
                                            : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Sliders className="w-4 h-4" />
                                    Basic Settings
                                </button>
                                <button
                                    onClick={() => setShowPremiumSettings(true)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                    ${showPremiumSettings
                                            ? 'bg-purple-600 text-white'
                                            : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                >
                                    <PremiumBadge size={16} />
                                    Premium Settings
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area - Rearranged layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Column - Settings */}
                    <div className="lg:col-span-2 space-y-6">
                        {!showPremiumSettings ? (
                            <CustomizationSettings
                                profile={profile}
                                handleSettingChange={handleSettingChange}
                                handleFileUpload={handleFileUpload}
                                getEffectClass={getEffectClass}
                            />
                        ) : contextUser?.has_premium ? (
                            <PremiumCustomizationSettings
                                profile={profile}
                                handleSettingChange={handleSettingChange}
                            />
                        ) : null}
                    </div>

                    {/* Right Column - Color Picker and Preview */}
                    <div className="space-y-6">
                        {/* Colors Card */}
                        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800/50">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-purple-400" />
                                    Color Scheme
                                </h2>
                            </div>
                            <div className="p-5 space-y-4">
                                {[
                                    { key: 'accent', label: 'Accent Color', description: 'Used for highlights and interactive elements' },
                                    { key: 'text', label: 'Text Color', description: 'Main color for all text content' },
                                    { key: 'background', label: 'Background Color', description: 'Primary background color' },
                                    ...(profile.username_effects === 'gradient' ? [
                                        { key: 'gradient_from', label: 'Gradient Start', description: 'Starting color of username gradient' },
                                        { key: 'gradient_to', label: 'Gradient End', description: 'Ending color of username gradient' },
                                    ] : [])
                                ].map(({ key, label, description }) => (
                                    <div
                                        key={key}
                                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300"
                                    >
                                        <div
                                            ref={el => { colorButtonsRef[key] = el; }}
                                            className="w-10 h-10 rounded-lg border border-zinc-800/50 cursor-pointer
                                            flex-shrink-0 transition-transform hover:scale-105 hover:border-purple-500/30 shadow-md"
                                            style={{
                                                backgroundColor: String(profile[`${key}_color` as keyof UserProfile])
                                            }}
                                            onClick={(e) => handleColorClick(key as any, e)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-white">{label}</span>
                                                <div className="flex items-center gap-1 bg-[#0E0E0E]/40 px-2 py-1 rounded-md border border-zinc-800/50">
                                                    <span className="text-xs text-white/60">#</span>
                                                    <span className="text-xs text-white/90">
                                                        {String(profile[`${key}_color` as keyof UserProfile])
                                                            .replace('#', '')}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/60">{description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Visibility Card */}
                        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800/50">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-purple-400" />
                                    Visibility Settings
                                </h2>
                            </div>
                            <div className="p-5 space-y-4">
                                {[
                                    {
                                        key: 'hide_joined_date',
                                        label: 'Hide Join Date',
                                        description: 'Hide when you joined the platform',
                                        premiumOnly: false
                                    },
                                    {
                                        key: 'hide_views_count',
                                        label: 'Hide View Count',
                                        description: 'Hide your profile view counter',
                                        premiumOnly: false
                                    },
                                ].map(({ key, label, description, premiumOnly }) => (
                                    <div
                                        key={key}
                                        className={`flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg 
                                        ${premiumOnly && !contextUser?.has_premium ? 'border border-zinc-800/30' : 'border border-zinc-800/50 hover:border-purple-500/20'}
                                        transition-all duration-300`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className={`text-sm font-medium ${premiumOnly && !contextUser?.has_premium ? 'text-white/40' : 'text-white'}`}>
                                                    {label}
                                                </h3>
                                                {premiumOnly && !contextUser?.has_premium && (
                                                    <span className="text-xs font-medium text-white/70 bg-purple-900/30 px-2 py-0.5 rounded-full border border-purple-800/30">
                                                        Premium
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-white/60">
                                                {description}
                                            </p>
                                        </div>
                                        <label className={`relative inline-flex items-center ${premiumOnly && !contextUser?.has_premium ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={profile[key as keyof UserProfile] as boolean}
                                                onChange={(e) => {
                                                    if (premiumOnly && !contextUser?.has_premium && !e.target.checked) {
                                                        toast.error("You need Premium to disable this setting");
                                                        return;
                                                    }
                                                    handleSettingChange(key as keyof UserProfile, e.target.checked);
                                                }}
                                                disabled={premiumOnly && !contextUser?.has_premium && !profile[key as keyof UserProfile] as boolean}
                                            />
                                            <div className={`w-11 h-6 
                                            ${premiumOnly && !contextUser?.has_premium ? 'bg-zinc-800' : 'bg-zinc-700'} 
                                            peer-focus:outline-none rounded-full peer
                                            peer-checked:after:translate-x-full peer-checked:after:border-white
                                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                            after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                                            peer-checked:bg-purple-600`} />
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preview Card */}
                        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-purple-400" />
                                    Profile Preview
                                </h2>
                                <div className="flex items-center">
                                    <span className="px-2 py-0.5 bg-purple-900/30 border border-purple-800/30 rounded-full text-[10px] font-medium text-purple-300 animate-pulse">
                                        BETA
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                <ProfilePreview profile={profile} user={contextUser} />
                            </div>
                        </div>

                        {/* Premium Upgrade Card */}
                        {!contextUser?.has_premium && (
                            <div className="bg-gradient-to-br from-purple-900/30 to-black rounded-xl border border-purple-800/20 overflow-hidden p-5 relative">
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>
                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                                            <PremiumBadge size={18} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">Upgrade to Premium</h3>
                                    </div>
                                    <p className="text-sm text-white/70 mb-4">
                                        Unlock premium effects, advanced features, and enhance your profile with Premium.
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 text-xs text-white/70 mb-4">
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
                                            <span>Exclusive Badges</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 bg-purple-800/30 rounded-full flex items-center justify-center">
                                                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M20 6L9 17L4 12" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <span>Special Effects</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 bg-purple-800/30 rounded-full flex items-center justify-center">
                                                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M20 6L9 17L4 12" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <span>Rich Text Editor</span>
                                        </div>
                                    </div>

                                    <a href="/pricing" className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm font-medium">
                                        <Gem className="w-4 h-4" />
                                        Upgrade to Premium
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {activeColor && (
                    <ColorPickerPortal
                        color={String(profile[`${activeColor}_color` as keyof UserProfile])}
                        onChange={(color) => {
                            if (color === profile[`${activeColor}_color` as keyof UserProfile]) {
                                return;
                            }
                            handleSettingChange(`${activeColor}_color` as keyof UserProfile, color);
                        }}
                        onClose={() => {
                            setActiveColor(null);
                            setColorPickerRect(null);
                        }}
                        targetRect={colorPickerRect}
                        ref={colorPickerRef}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}