'use client';

import { Palette, Image as ImageIcon, Sparkles, Layers, Eye, Type, Code2, Strikethrough, LinkIcon, Wand2, Sliders, Shield, Radio, BoxSelect, Globe, Music4, Upload, Circle, Square, X, Music, Film, FileIcon, Briefcase } from 'lucide-react';
import {
    ghostCursor,
    followingDotCursor,
    bubbleCursor,
    snowflakeCursor,
    CursorEffectResult
} from 'cursor-effects';
import FileUpload, { useFileUpload } from 'haze.bio/components/FileUpload';
import { UserProfile } from 'haze.bio/types';
import EffectsDropdown from './dropdowns/EffectsDropdown';
import FontDropdown from './dropdowns/FontDropdown';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState, useRef } from 'react';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Code from '@tiptap/extension-code';
import Strike from '@tiptap/extension-strike';
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined } from 'react-icons/md';
import { DiscordIcon } from 'haze.bio/socials/Socials';
import CursorEffectDropdown from './dropdowns/CursorEffectDropdown';
import { useUser } from 'haze.bio/context/UserContext';
import Image from 'next/image';
import { fileAPI } from 'haze.bio/api';
import toast from 'react-hot-toast';

interface CustomizationSettingsProps {
    profile: UserProfile;
    handleSettingChange: (key: keyof UserProfile, value: any) => Promise<void>;
    handleFileUpload: (type: 'avatar_url' | 'background_url' | 'audio_url' | 'banner_url') => (fileName: string) => Promise<void>;
    getEffectClass: (effect: string | undefined | null) => { className: string; style?: React.CSSProperties };
}

const useAvatarFileUpload = (
    onUpload: (fileName: string) => void,
    currentUrl: string | undefined
) => {
    return useFileUpload(
        onUpload,
        { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] },
        'avatar_url',
        undefined,
        currentUrl
    );
};

export default function CustomizationSettings({
    profile,
    handleSettingChange,
    handleFileUpload,
    getEffectClass,
}: CustomizationSettingsProps) {
    const { user: contextUser } = useUser();

    const [description, setDescription] = useState(profile.description || '');
    const [pageEnterText, setPageEnterText] = useState(profile.page_enter_text || '');

    const descriptionEditor = useEditor({
        extensions: [
            StarterKit,
            Bold,
            Italic,
            Underline,
            Code,
            Strike,
        ],
        content: description,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            setDescription(html);
            handleSettingChange('description', html);
        },
    });

    const pageEnterTextEditor = useEditor({
        extensions: [
            StarterKit,
            Bold,
            Italic,
            Underline,
            Code,
            Strike,
        ],
        content: pageEnterText,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            setPageEnterText(html);
            handleSettingChange('page_enter_text', html);
        },
    });

    useEffect(() => {
        setDescription(profile.description || '');
        setPageEnterText(profile.page_enter_text || '');
    }, [profile.description, profile.page_enter_text]);

    const descriptionToolbar = descriptionEditor ? (
        <div className="flex gap-2 mb-2">
            <button
                onClick={() => descriptionEditor.chain().focus().toggleBold().run()}
                className={`p-1 rounded-md hover:bg-purple-600/10 ${descriptionEditor.isActive('bold') ? 'bg-purple-600/20 text-white' : 'text-white/60'}`}
            >
                <MdFormatBold className="w-4 h-4" />
            </button>
            <button
                onClick={() => descriptionEditor.chain().focus().toggleItalic().run()}
                className={`p-1 rounded-md hover:bg-purple-600/10 ${descriptionEditor.isActive('italic') ? 'bg-purple-600/20 text-white' : 'text-white/60'}`}
            >
                <MdFormatItalic className="w-4 h-4" />
            </button>
            <button
                onClick={() => descriptionEditor.chain().focus().toggleUnderline().run()}
                className={`p-1 rounded-md hover:bg-purple-600/10 ${descriptionEditor.isActive('underline') ? 'bg-purple-600/20 text-white' : 'text-white/60'}`}
            >
                <MdFormatUnderlined className="w-4 h-4" />
            </button>
            <button
                onClick={() => descriptionEditor.chain().focus().toggleCode().run()}
                className={`p-1 rounded-md hover:bg-purple-600/10 ${descriptionEditor.isActive('code') ? 'bg-purple-600/20 text-white' : 'text-white/60'}`}
            >
                <Code2 className="w-4 h-4" />
            </button>
            <button
                onClick={() => descriptionEditor.chain().focus().toggleStrike().run()}
                className={`p-1 rounded-md hover:bg-purple-600/10 ${descriptionEditor.isActive('strike') ? 'bg-purple-600/20 text-white' : 'text-white/60'}`}
            >
                <Strikethrough className="w-4 h-4" />
            </button>
        </div>
    ) : null;

    const pageEnterTextToolbar = pageEnterTextEditor ? (
        <div className="flex gap-2 mb-2">
            <button
                onClick={() => pageEnterTextEditor.chain().focus().toggleBold().run()}
                className={`p-1 rounded-md hover:bg-purple-600/10 ${pageEnterTextEditor.isActive('bold') ? 'bg-purple-600/20 text-white' : 'text-white/60'}`}
            >
                <MdFormatBold className="w-4 h-4" />
            </button>
            <button
                onClick={() => pageEnterTextEditor.chain().focus().toggleItalic().run()}
                className={`p-1 rounded-md hover:bg-purple-600/10 ${pageEnterTextEditor.isActive('italic') ? 'bg-purple-600/20 text-white' : 'text-white/60'}`}
            >
                <MdFormatItalic className="w-4 h-4" />
            </button>
            <button
                onClick={() => pageEnterTextEditor.chain().focus().toggleUnderline().run()}
                className={`p-1 rounded-md hover:bg-purple-600/10 ${pageEnterTextEditor.isActive('underline') ? 'bg-purple-600/20 text-white' : 'text-white/60'}`}
            >
                <MdFormatUnderlined className="w-4 h-4" />
            </button>
            <button
                onClick={() => pageEnterTextEditor.chain().focus().toggleCode().run()}
                className={`p-1 rounded-md hover:bg-purple-600/10 ${pageEnterTextEditor.isActive('code') ? 'bg-purple-600/20 text-white' : 'text-white/60'}`}
            >
                <Code2 className="w-4 h-4" />
            </button>
            <button
                onClick={() => pageEnterTextEditor.chain().focus().toggleStrike().run()}
                className={`p-1 rounded-md hover:bg-purple-600/10 ${pageEnterTextEditor.isActive('strike') ? 'bg-purple-600/20 text-white' : 'text-white/60'}`}
            >
                <Strikethrough className="w-4 h-4" />
            </button>
        </div>
    ) : null;

    const cursorEffects = [
        { id: 'none', name: 'None', description: 'No cursor effect' },
        {
            id: 'ghost',
            name: 'Ghost Following',
            description: 'Trailing ghost cursors that follow your movement',
            premium: false
        },
        {
            id: 'dot',
            name: 'Following Dot',
            description: 'Smooth following dot that trails behind your cursor',
            premium: false
        },
        {
            id: 'bubble',
            name: 'Bubble Particles',
            description: 'Colorful bubble particles appear as you move',
            premium: true
        },
        {
            id: 'snowflake',
            name: 'Snowflake Particles',
            description: 'Snowflakes fall from your cursor as you move',
            premium: true
        },
    ];

    const cursorPreviewRef = useRef<HTMLDivElement>(null);
    const [previewCursor, setPreviewCursor] = useState<CursorEffectResult | null>(null);

    useEffect(() => {
        if (!cursorPreviewRef.current) return;

        if (previewCursor) {
            try {
                previewCursor.destroy();
            } catch (error) {
                console.error("Error destroying previous cursor effect:", error);
            }
        }

        if (profile.cursor_effects === 'none') {
            setPreviewCursor(null);
            return;
        }

        let newEffect: CursorEffectResult | null = null;

        try {
            switch (profile.cursor_effects) {
                case 'ghost':
                    newEffect = ghostCursor({
                        element: cursorPreviewRef.current,
                    });
                    break;
                case 'dot':
                    newEffect = followingDotCursor({
                        element: cursorPreviewRef.current,
                    });
                    break;
                case 'bubble':
                    newEffect = bubbleCursor({
                        element: cursorPreviewRef.current,
                    });
                    break;
                case 'snowflake':
                    newEffect = snowflakeCursor({
                        element: cursorPreviewRef.current,
                    });
                    break;
            }

            setPreviewCursor(newEffect);
        } catch (error) {
            console.error(`Error initializing cursor effect '${profile.cursor_effects}':`, error);
        }

        return () => {
            if (newEffect) {
                try {
                    newEffect.destroy();
                } catch (error) {
                    console.error("Error cleaning up cursor effect:", error);
                }
            }
        };
    }, [profile.cursor_effects]);

    const {
        openFileUploadDialog: openAvatarUpload,
        isUploading: isAvatarUploading,
        uploadProgress: avatarUploadProgress
    } = useAvatarFileUpload(
        handleFileUpload('avatar_url'),
        profile?.avatar_url || ''
    );

    const addCacheBuster = (url: string) => {
        if (!url) return '';

        const baseUrl = url.split('?')[0];
        const cacheId = profile.uid || 'default';

        return `${baseUrl}?uid=${cacheId}`;
    };

    const getFileExtension = (url?: string) => {
        if (!url) return '';
        const baseUrl = url.split('?')[0];
        const extension = baseUrl.split('.').pop()?.toLowerCase() || '';
        return extension;
    };

    const getFileIcon = (extension: string) => {
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
            return <ImageIcon className="w-5 h-5 text-purple-400" />;
        }
        if (['mp4', 'webm'].includes(extension)) {
            return <Film className="w-5 h-5 text-purple-400" />;
        }
        if (['mp3', 'wav', 'ogg'].includes(extension)) {
            return <Music className="w-5 h-5 text-purple-400" />;
        }
        return <FileIcon className="w-5 h-5 text-purple-400" />;
    };

    return (
        <>
            {/* Content & Identity */}
            <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800/50">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <Type className="w-4 h-4 text-purple-400" />
                        Content & Identity
                    </h2>
                </div>
                {/* Description and Location/Occupation */}
                <div className="p-5 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Description */}
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300 h-full flex flex-col">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Type className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white">
                                        Description
                                    </label>
                                    <p className="text-xs text-white/60">
                                        Tell others about yourself
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                {contextUser?.has_premium && descriptionEditor ? (
                                    <>
                                        {descriptionToolbar}
                                        <EditorContent editor={descriptionEditor} className={`w-full flex-1 bg-black/40 rounded-lg p-2 text-white text-sm placeholder:text-white/40 border border-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 min-h-[80px]`} />
                                    </>
                                ) : (
                                    <textarea
                                        value={description || ''}
                                        onChange={(e) => {
                                            setDescription(e.target.value);
                                            handleSettingChange('description', e.target.value);
                                        }}
                                        placeholder="Tell others about yourself..."
                                        className="w-full flex-1 bg-black/40 rounded-lg p-2 text-white text-sm
                                        placeholder:text-white/40 border border-zinc-800/50 focus:outline-none
                                        focus:ring-2 focus:ring-purple-500/30 resize-none min-h-[80px]"
                                        maxLength={150}
                                    />
                                )}
                                <div className="flex justify-end mt-2">
                                    <span className="text-xs text-white/60">
                                        {(description?.length || 0)}/150
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Welcome Text */}
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300 h-full flex flex-col">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Wand2 className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white">
                                        Welcome Text
                                    </label>
                                    <p className="text-xs text-white/60">
                                        Text shown before your profile loads
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                {contextUser?.has_premium && pageEnterTextEditor ? (
                                    <>
                                        {pageEnterTextToolbar}
                                        <EditorContent editor={pageEnterTextEditor} className={`w-full flex-1 bg-black/40 rounded-lg p-2 text-white text-sm placeholder:text-white/40 border border-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 min-h-[80px]`} />
                                    </>
                                ) : (
                                    <textarea
                                        value={profile.page_enter_text || ''}
                                        onChange={(e) => handleSettingChange('page_enter_text', e.target.value)}
                                        placeholder="click to enter..."
                                        className="w-full flex-1 bg-black/40 rounded-lg p-2 text-white text-sm
                                        placeholder:text-white/40 border border-zinc-800/50 focus:outline-none
                                        focus:ring-2 focus:ring-purple-500/30 resize-none min-h-[80px]"
                                        maxLength={50}
                                    />
                                )}
                                <div className="flex justify-end mt-2">
                                    <span className="text-xs text-white/60">
                                        {(profile.page_enter_text?.length || 0)}/50
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300 h-full flex flex-col">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Globe className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white">
                                        Location
                                    </label>
                                    <p className="text-xs text-white/60">
                                        Share where you're based
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <textarea
                                    value={profile.location || ''}
                                    onChange={(e) => handleSettingChange('location', e.target.value)}
                                    placeholder="Your location..."
                                    className="w-full flex-1 bg-black/40 rounded-lg p-2 text-white text-sm
                                    placeholder:text-white/40 border border-zinc-800/50 focus:outline-none
                                    focus:ring-2 focus:ring-purple-500/30 resize-none min-h-[80px]"
                                    maxLength={15}
                                />
                                <div className="flex justify-end mt-2">
                                    <span className="text-xs text-white/60">
                                        {(profile.location?.length || 0)}/15
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Occupation */}
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300 h-full flex flex-col">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Briefcase className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white">
                                        Occupation
                                    </label>
                                    <p className="text-xs text-white/60">
                                        What you do
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <textarea
                                    value={profile.occupation || ''}
                                    onChange={(e) => handleSettingChange('occupation', e.target.value)}
                                    placeholder="Your occupation..."
                                    className="w-full flex-1 bg-black/40 rounded-lg p-2 text-white text-sm
                                    placeholder:text-white/40 border border-zinc-800/50 focus:outline-none
                                    focus:ring-2 focus:ring-purple-500/30 resize-none min-h-[80px]"
                                    maxLength={25}
                                />
                                <div className="flex justify-end mt-2">
                                    <span className="text-xs text-white/60">
                                        {(profile.occupation?.length || 0)}/25
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Uploads */}
            <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800/50">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-400" />
                        Media Content
                    </h2>
                </div>
                <div className="p-5 space-y-5">
                    <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white">Profile Image</label>
                                <p className="text-xs text-white/60">Upload avatar and settings</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Avatar preview column */}
                            <div className="flex flex-col items-center gap-3">
                                <div
                                    onClick={openAvatarUpload}
                                    className="cursor-pointer relative w-28 h-28 flex-shrink-0 group"
                                >
                                    {profile?.avatar_url ? (
                                        <div className="relative group h-full">
                                            <Image
                                                src={addCacheBuster(profile.avatar_url)}
                                                alt="Profile Avatar"
                                                width={112}
                                                height={112}
                                                className={`${profile?.avatar_shape || 'rounded-2xl'}`}
                                                priority
                                                style={{
                                                    maxWidth: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                                draggable="false"
                                            />

                                            {/* Discord decoration overlay */}
                                            {profile?.use_discord_decoration && profile?.decoration_url && (
                                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                    <Image
                                                        src={profile.decoration_url}
                                                        alt="Discord Decoration"
                                                        width={220}
                                                        height={220}
                                                        priority
                                                        style={{
                                                            position: "absolute",
                                                            objectFit: "contain",
                                                            zIndex: 10,
                                                            transform: "scale(1.19)"
                                                        }}
                                                        draggable="false"
                                                    />
                                                </div>
                                            )}

                                            {/* FileUpload-style hover overlay */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Upload className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`flex flex-col items-center justify-center h-full ${profile?.avatar_shape || 'rounded-2xl'} bg-black/30 border border-zinc-800/50 hover:border-purple-500/30 transition-all`}>
                                            <div className="p-3 rounded-full bg-purple-800/10">
                                                <Upload className="w-6 h-6 text-purple-400" />
                                            </div>
                                        </div>
                                    )}

                                    {isAvatarUploading && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
                                            <div
                                                className="h-full bg-purple-500 transition-all duration-300"
                                                style={{ width: `${avatarUploadProgress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Buttons for Upload and Remove */}
                                <div className="flex gap-2 w-[100px]">
                                    {profile?.avatar_url && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    if (!profile.avatar_url) return;
                                                    await fileAPI.deleteFile(profile.avatar_url);
                                                    await handleFileUpload('avatar_url')('');
                                                } catch (error) {
                                                    toast.error('Failed to remove avatar');
                                                }
                                            }}
                                            className="flex-1 bg-red-900/20 hover:bg-red-900/30 text-red-400 text-xs py-1.5 px-2 rounded-md
                                        transition-colors border border-red-900/20 flex items-center justify-center gap-1.5"
                                        >
                                            <X className="w-3 h-3" />
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Avatar Shape options column */}
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-xs font-medium text-white">Avatar Shape</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'rounded-2xl', name: 'Rounded', icon: Square },
                                        { id: 'rounded-full', name: 'Circle', icon: Circle },
                                    ].map((shape) => {
                                        const Icon = shape.icon;
                                        return (
                                            <div
                                                key={shape.id}
                                                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-2
                                    ${profile.avatar_shape === shape.id
                                                        ? 'bg-black/40 border-purple-500/30'
                                                        : 'bg-black/30 border-zinc-800/50 hover:border-purple-500/20'
                                                    }`}
                                                onClick={() => handleSettingChange('avatar_shape', shape.id)}
                                            >
                                                <div className={`w-6 h-6 flex items-center justify-center rounded-lg
                                    ${profile.avatar_shape === shape.id
                                                        ? 'bg-purple-800/20 text-purple-400'
                                                        : 'bg-zinc-800/50 text-white/60'}`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-xs font-medium text-white">{shape.name}</span>
                                                {profile.avatar_shape === shape.id && (
                                                    <div className="w-3 h-3 rounded-full bg-purple-600 flex items-center justify-center ml-auto">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Spacer to make Discord options align better */}
                                <div className="mt-auto"></div>
                            </div>

                            {/* Discord Options column */}
                            <div className="flex flex-col h-full">
                                {contextUser?.discord_id ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-2">
                                            <DiscordIcon size={14} className="text-purple-400" />
                                            <span className="text-xs font-medium text-white">Discord Options</span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between bg-black/40 rounded-lg p-2.5 border border-zinc-800/50">
                                                <div className="flex items-center gap-2">
                                                    <DiscordIcon size={14} className="text-white/80" />
                                                    <span className="text-xs text-white">Discord Avatar</span>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={profile.use_discord_avatar || false}
                                                        onChange={(e) => handleSettingChange('use_discord_avatar', e.target.checked)}
                                                    />
                                                    <div className="w-8 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer
                                            peer-checked:after:translate-x-4 peer-checked:after:border-white
                                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                            after:bg-white after:border after:border-zinc-700/50 after:rounded-full after:h-3 after:w-3
                                            after:transition-all peer-checked:bg-purple-600" />
                                                </label>
                                            </div>

                                            <div className="flex items-center justify-between bg-black/40 rounded-lg p-2.5 border border-zinc-800/50">
                                                <div className="flex items-center gap-2">
                                                    <DiscordIcon size={14} className="text-white/80" />
                                                    <span className="text-xs text-white">Discord Decoration</span>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={profile.use_discord_decoration || false}
                                                        onChange={(e) => handleSettingChange('use_discord_decoration', e.target.checked)}
                                                    />
                                                    <div className="w-8 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer
                                            peer-checked:after:translate-x-4 peer-checked:after:border-white
                                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                            after:bg-white after:border after:border-zinc-700/50 after:rounded-full after:h-3 after:w-3
                                            after:transition-all peer-checked:bg-purple-600" />
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 mb-2">
                                            <DiscordIcon size={14} className="text-purple-400" />
                                            <span className="text-xs font-medium text-white">Discord Options</span>
                                        </div>

                                        <Link href="/dashboard/settings" className="flex items-center justify-between bg-black/40 rounded-lg p-3 border border-zinc-800/50 hover:border-purple-500/20 transition-all">
                                            <div className="flex items-center gap-2">
                                                <DiscordIcon size={16} className="text-purple-400" />
                                                <div>
                                                    <span className="text-xs font-medium text-white">Connect Discord</span>
                                                    <p className="text-[10px] text-white/60">
                                                        Use Discord avatar and decorations
                                                    </p>
                                                </div>
                                            </div>
                                            <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                            </svg>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Second row - Background, Banner, and Music in a row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Background Image */}
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <BoxSelect className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white">Background</label>
                                    <p className="text-xs text-white/60">Page background</p>
                                </div>
                            </div>

                            <FileUpload
                                onUpload={handleFileUpload('background_url')}
                                label="Upload"
                                currentUrl={profile.background_url || ''}
                                fileType="background_url"
                                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif'], 'video/*': ['.mp4'] }}
                            />
                        </div>

                        {/* Banner Image */}
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Shield className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white">Banner</label>
                                    <p className="text-xs text-white/60">Header banner</p>
                                </div>
                            </div>

                            <FileUpload
                                onUpload={handleFileUpload('banner_url')}
                                label="Upload"
                                currentUrl={profile.banner_url || ''}
                                fileType="banner_url"
                                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif'], 'video/*': ['.mp4'] }}
                            />
                        </div>

                        {/* Background Music */}
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Music4 className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white">Music</label>
                                    <p className="text-xs text-white/60">Background audio</p>
                                </div>
                            </div>

                            <FileUpload
                                onUpload={handleFileUpload('audio_url')}
                                label="Upload"
                                currentUrl={profile.audio_url || ''}
                                fileType="audio_url"
                                accept={{ 'audio/*': ['.mp3', '.wav', '.ogg'] }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Styling & Effects */}
            <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800/50">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Visual Styling & Effects
                    </h2>
                </div>
                <div className="p-5 space-y-6">
                    {/* Text Style & Cursor Effects */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Username Effect */}
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Type className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white">Username Effect</label>
                                    <p className="text-xs text-white/60">Special effect for your username</p>
                                </div>
                            </div>

                            <EffectsDropdown
                                profile={profile}
                                onEffectChange={(effect) => handleSettingChange('username_effects', effect)}
                                isPremium={!!contextUser?.has_premium}
                            />

                            <div className="bg-black/40 rounded-lg p-3 border border-zinc-800/50 mt-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/60">Preview:</span>
                                    {(() => {
                                        const effect = getEffectClass(profile.username_effects);
                                        const textColor = profile.text_color || '#ffffff';
                                        const accentColor = profile.accent_color || '#a855f7';

                                        const previewStyle = {
                                            ...effect.style
                                        };

                                        if (profile.username_effects === 'hacker') {
                                            (previewStyle as any)['--text-color'] = textColor;
                                            (previewStyle as any)['--accent-color'] = accentColor;
                                        }

                                        if (profile.username_effects === '3d' || profile.username_effects === 'hacker') {
                                            const characters = Array.from(contextUser?.display_name || '');

                                            return (
                                                <span
                                                    className={effect.className}
                                                    style={previewStyle as React.CSSProperties}
                                                >
                                                    {characters.map((char, i) => (
                                                        <span
                                                            key={i}
                                                            style={{
                                                                '--char-index': i,
                                                                ...(char === ' ' ? { marginRight: '-0.25em' } : {})
                                                            } as React.CSSProperties}
                                                        >
                                                            {char === ' ' ? '\u00A0' : char}
                                                        </span>
                                                    ))}
                                                </span>
                                            );
                                        }
                                        return (
                                            <span
                                                className={effect.className}
                                                style={previewStyle}
                                            >
                                                {contextUser?.display_name}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Font Selection */}
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Type className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white">Font Style</label>
                                    <p className="text-xs text-white/60">Choose a font for your profile</p>
                                </div>
                            </div>

                            <FontDropdown
                                profile={profile}
                                onFontChange={(font) => handleSettingChange('text_font', font)}
                                isPremium={!!contextUser?.has_premium}
                            />

                            <div className="bg-black/40 rounded-lg p-3 border border-zinc-800/50 mt-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/60">Preview:</span>
                                    {(() => {
                                        const getFontClass = (font: string | undefined | null) => {
                                            switch (font) {
                                                case 'poppins': return 'font-poppins';
                                                case 'chillax': return 'font-chillax';
                                                case 'minecraft': return 'font-minecraft';
                                                case 'jetbrains-mono': return 'font-jetbrains';
                                                case 'grand-theft-auto': return 'font-grand-theft-auto';
                                                case 'drippy': return 'font-drippy';
                                                default: return 'font-poppins';
                                            }
                                        };
                                        return (
                                            <p className={`${getFontClass(profile.text_font)} text-white`}>
                                                Welcome to cutz.lol!
                                            </p>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Cursor Effect Selection */}
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Radio className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white">Cursor Effect</label>
                                    <p className="text-xs text-white/60">Effect that follows the cursor</p>
                                </div>
                            </div>

                            <CursorEffectDropdown
                                profile={profile}
                                onCursorEffectChange={(effect) => handleSettingChange('cursor_effects', effect)}
                                isPremium={!!contextUser?.has_premium}
                            />

                            <div className="bg-black/40 rounded-lg p-3.5 flex items-center justify-center border border-zinc-800/50 mt-3 overflow-hidden relative h-20" ref={cursorPreviewRef}>
                                <div className="absolute inset-0" style={{ pointerEvents: "all" }}></div>
                                <p className="text-sm text-white/60 pointer-events-none">
                                    {profile.cursor_effects === 'none'
                                        ? 'No cursor effect selected'
                                        : `Move cursor here to see ${cursorEffects.find(e => e.id === profile.cursor_effects)?.name}`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sliders for Visual Effects */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                key: 'card_opacity',
                                label: 'Card Opacity',
                                description: 'Control the transparency of your profile card',
                                max: 100,
                                step: 1,
                                unit: '%',
                                transform: (v: number) => v / 100,
                                icon: <Sliders className="w-4 h-4 text-purple-400" />
                            },
                            {
                                key: 'card_blur',
                                label: 'Card Blur',
                                description: 'Add a frosted glass effect to your profile card',
                                max: 20,
                                step: 1,
                                unit: 'px',
                                icon: <Eye className="w-4 h-4 text-purple-400" />
                            },
                            {
                                key: 'card_border_radius',
                                label: 'Card Border Radius',
                                description: 'Change the border radius of your profile card',
                                max: 80,
                                min: 0,
                                step: 1,
                                unit: 'px',
                                icon: <Layers className="w-4 h-4 text-purple-400" />
                            },
                            {
                                key: 'background_blur',
                                label: 'Background Blur',
                                description: 'Add a frosted glass effect to your background',
                                min: 0,
                                max: 20,
                                step: 1,
                                unit: 'px',
                                icon: <Eye className="w-4 h-4 text-purple-400" />
                            },
                        ].map(({ key, label, description, max, step, unit, transform, min, icon }) => (
                            <div key={key} className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {icon}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white">{label}</label>
                                        <p className="text-xs text-white/60">{description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min={min ?? 0}
                                        max={max}
                                        step={step}
                                        value={transform
                                            ? ((profile[key as keyof UserProfile] as number) * 100)
                                            : (profile[key as keyof UserProfile] as number)}
                                        onChange={(e) => handleSettingChange(
                                            key as keyof UserProfile,
                                            transform ? transform(Number(e.target.value)) : Number(e.target.value)
                                        )}
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
                                    <span className="text-sm text-white/80 w-12 text-right tabular-nums">
                                        {transform
                                            ? Math.round((profile[key as keyof UserProfile] as number) * 100)
                                            : profile[key as keyof UserProfile] as number}
                                        {unit}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Toggle Effects Card */}
            <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800/50">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-purple-400" />
                        Additional Effects
                    </h2>
                </div>
                <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                key: 'views_animation',
                                label: 'Views Animation',
                                description: 'Animation on views counter',
                                icon: <Eye className="w-4 h-4 text-purple-400" />
                            },
                            {
                                key: 'glow_username',
                                label: 'Username Glow',
                                description: 'Add a glow effect to your username',
                                icon: <Sparkles className="w-4 h-4 text-purple-400" />
                            },
                            {
                                key: 'glow_badges',
                                label: 'Badge Glow',
                                description: 'Add a glow effect to your badges',
                                icon: <Shield className="w-4 h-4 text-purple-400" />
                            },
                            {
                                key: 'glow_socials',
                                label: 'Social Icons Glow',
                                description: 'Add a glow effect to your social icons',
                                icon: <LinkIcon className="w-4 h-4 text-purple-400" />
                            }
                        ].map(({ key, label, description, icon }) => (
                            <div key={key} className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-sm font-medium text-white">{label}</h3>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={profile[key as keyof UserProfile] as boolean}
                                                    onChange={(e) => handleSettingChange(key as keyof UserProfile, e.target.checked)}
                                                />
                                                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer
                                                            peer-checked:after:translate-x-full peer-checked:after:border-white
                                                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                                            after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                                                            peer-checked:bg-purple-600" />
                                            </label>
                                        </div>
                                        <p className="text-xs text-white/60">{description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}