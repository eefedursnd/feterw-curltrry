'use client';

import { Eye, Layout, MousePointer, Sparkles, Circle, Square, Crown, Monitor, Gift, Palette, Lightbulb, Shield, Layers, User as UserIcon } from 'lucide-react';
import { User, UserProfile } from 'haze.bio/types';
import { useUser } from 'haze.bio/context/UserContext';
import { PremiumBadge } from 'haze.bio/badges/Badges';

interface PremiumCustomizationSettingsProps {
    profile: UserProfile;
    handleSettingChange: (key: keyof UserProfile, value: any) => Promise<void>;
}

export default function PremiumCustomizationSettings({ profile, handleSettingChange }: PremiumCustomizationSettingsProps) {
    const templates = [
        { id: 'default', name: 'Default Template', description: 'Classic template with alignment left', icon: Layout },
        { id: 'modern', name: 'Modern Template', description: 'Modern template with alignment center', icon: Monitor },
        { id: 'minimalistic', name: 'Minimalistic Template', description: 'Clean, elegant profile with focus on essentials', icon: UserIcon },
    ];

    return (
        <>
            {/* Template Selection */}
            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800/50">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <Layout className="w-4 h-4 text-purple-400" />
                        Template Selection
                    </h2>
                </div>
                <div className="p-5">
                    <p className="text-sm text-white/70 mb-4">
                        Choose a layout design for your profile page. Each template offers a unique look and feel.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {templates.map((templateOption) => {
                            const Icon = templateOption.icon;
                            return (
                                <div
                                    key={templateOption.id}
                                    className={`relative p-4 rounded-lg border transition-all cursor-pointer
                                        ${profile.template === templateOption.id
                                            ? 'bg-zinc-800/40 border-purple-500/30'
                                            : 'bg-zinc-800/30 border-zinc-800/50 hover:border-purple-500/20 hover:bg-zinc-800/40'
                                        }`}
                                    onClick={() => handleSettingChange('template', templateOption.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg
                                            ${profile.template === templateOption.id
                                                ? 'bg-purple-800/20 text-purple-400'
                                                : 'bg-zinc-800/50 text-white/60'}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-white mb-1">{templateOption.name}</h3>
                                            <p className="text-xs text-white/60">{templateOption.description}</p>
                                        </div>
                                        {profile.template === templateOption.id && (
                                            <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Template Preview with updated colors */}
                                    <div className={`mt-3 h-24 rounded-lg border p-3
                                        ${profile.template === templateOption.id
                                            ? 'border-purple-500/20 bg-[#0E0E0E]/40'
                                            : 'border-zinc-800/50 bg-[#0E0E0E]/30'}`}>
                                        {templateOption.id === 'default' ? (
                                            <div className="h-full flex flex-col items-start gap-2">
                                                <div className="w-1/3 h-3 bg-purple-500/20 rounded-full"></div>
                                                <div className="w-2/3 h-2 bg-white/10 rounded-full"></div>
                                                <div className="mt-2 flex gap-1">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="w-5 h-5 rounded-full bg-purple-500/15"></div>
                                                    ))}
                                                </div>
                                                <div className="mt-auto w-full flex gap-1">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className="flex-1 h-2 rounded-full bg-white/10"></div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : templateOption.id === 'modern' ? (
                                            <div className="h-full flex flex-col items-center gap-2">
                                                <div className="w-1/3 h-3 bg-purple-500/20 rounded-full"></div>
                                                <div className="w-1/2 h-2 bg-white/10 rounded-full"></div>
                                                <div className="mt-1 flex gap-1 justify-center">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="w-5 h-5 rounded-full bg-purple-500/15"></div>
                                                    ))}
                                                </div>
                                                <div className="mt-auto w-full flex justify-center gap-1">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className="w-6 h-2 rounded-full bg-white/10"></div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col gap-0.5">
                                                {/* Avatar on top */}
                                                <div className="w-6 h-6 rounded-lg bg-purple-500/20 mb-1"></div>

                                                {/* Username and badges */}
                                                <div className="flex items-center mb-1">
                                                    <div className="w-1/4 h-2.5 bg-purple-500/20 rounded-full mr-1"></div>
                                                    <div className="w-3 h-3 rounded-full bg-purple-500/30"></div>
                                                </div>

                                                {/* Views, Location, Occupation vertical stack */}
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center">
                                                        <div className="w-2 h-2 rounded-full bg-purple-500/30 mr-1"></div>
                                                        <div className="w-1/3 h-1.5 bg-white/10 rounded-full"></div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <div className="w-2 h-2 rounded-full bg-purple-500/30 mr-1"></div>
                                                        <div className="w-1/4 h-1.5 bg-white/10 rounded-full"></div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <div className="w-2 h-2 rounded-full bg-purple-500/30 mr-1"></div>
                                                        <div className="w-1/5 h-1.5 bg-white/10 rounded-full"></div>
                                                    </div>
                                                </div>

                                                {/* Social Icons (centered) */}
                                                <div className="flex justify-center gap-1 mt-auto">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className="w-4 h-4 rounded-full bg-purple-500/15"></div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Profile Size Settings */}
            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800/50">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-400" />
                        Layout Options
                    </h2>
                </div>
                <div className="p-5">
                    <p className="text-sm text-white/70 mb-4">
                        Fine-tune your profile layout settings to get the perfect look.
                    </p>

                    <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Layers className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white">Layout Max Width</label>
                                    <p className="text-xs text-white/60">Adjust the maximum width of your profile layout</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="400"
                                    max="1000"
                                    step="1"
                                    value={profile.layout_max_width || 776}
                                    onChange={(e) => handleSettingChange('layout_max_width', Number(e.target.value))}
                                    className="flex-1 h-2 bg-zinc-800/80 rounded-lg appearance-none cursor-pointer 
                outline-none border border-zinc-700/50
                
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:border-2 
                [&::-webkit-slider-thumb]:border-purple-300/20 [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:shadow-black/50
                [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150
                [&::-webkit-slider-thumb]:hover:bg-purple-400
                
                [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-2
                [&::-moz-range-thumb]:border-purple-300/20 [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:shadow-black/50
                [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150
                [&::-moz-range-thumb]:hover:bg-purple-400
                
                [&::-webkit-slider-runnable-track]:bg-gradient-to-r [&::-webkit-slider-runnable-track]:from-purple-500/50 
                [&::-webkit-slider-runnable-track]:to-purple-900/10 [&::-webkit-slider-runnable-track]:rounded-full
                
                [&::-moz-range-track]:bg-gradient-to-r [&::-moz-range-track]:from-purple-500/50
                [&::-moz-range-track]:to-purple-900/10 [&::-moz-range-track]:rounded-full"
                                />
                                <span className="text-sm text-white/80 w-16 text-right tabular-nums">
                                    {profile.layout_max_width || 776}px
                                </span>
                            </div>

                            {/* Width Visualization */}
                            <div className="h-6 relative border border-zinc-800/50 rounded-lg overflow-hidden bg-[#0E0E0E]/40">
                                <div
                                    className="absolute inset-y-0 left-0 bg-purple-500/20 rounded-l-lg"
                                    style={{
                                        width: `${Math.max(5, Math.min(100, ((profile.layout_max_width || 776) - 400) / 6))}%`
                                    }}
                                >
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs text-white/70 mix-blend-difference">Profile Width</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Premium Features */}
            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800/50">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <Crown className="w-4 h-4 text-purple-400" />
                        Premium Features
                    </h2>
                </div>
                <div className="p-5">
                    <p className="text-sm text-white/70 mb-4">
                        Additional premium features and options exclusive to premium members.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Parallax Effect Toggle */}
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Layers className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-medium text-white">Parallax Effect</h3>
                                        <div className="flex items-center gap-1">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={profile.parallax_effect || false}
                                                    onChange={(e) => handleSettingChange('parallax_effect', e.target.checked)}
                                                />
                                                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer
                                peer-checked:after:translate-x-full peer-checked:after:border-white
                                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                                peer-checked:bg-purple-600" />
                                            </label>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/60">Add depth with a subtle parallax scrolling effect</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium badge */}
                <div className="px-5 py-4 border-t border-zinc-800/50 bg-gradient-to-r from-purple-900/20 via-purple-800/10 to-purple-900/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-800/30 rounded-lg flex items-center justify-center">
                                <PremiumBadge size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Premium Features</p>
                                <p className="text-xs text-white/60">These settings are exclusive to premium accounts</p>
                            </div>
                        </div>
                        <a
                            href="/dashboard/settings?tab=billing"
                            className="text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-3 py-1.5 transition-colors"
                        >
                            Manage Subscription
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}