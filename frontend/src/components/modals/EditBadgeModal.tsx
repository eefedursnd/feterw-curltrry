import React from "react";
import { Info, Loader2, Settings, X, Upload, Shield, CreditCard, PencilIcon, CheckIcon } from "lucide-react";
import FileUpload, { useFileUpload } from "../FileUpload";
import { UserBadge } from "haze.bio/types";
import Image from "next/image";

interface EditBadgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    badge: UserBadge;
    onFileUpload: (fileName: string) => void;
    newBadgeName: string;
    setNewBadgeName: (name: string) => void;
    newMediaURL: string;
    onSaveChanges: () => void;
    isLoading: boolean;
    creditsLeft: number;
}

const useEditBadgeFileUpload = (
    onUpload: (fileName: string) => void,
    badgeId: number,
    newMediaURL: string
) => {
    return useFileUpload(
        onUpload,
        { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] },
        'custom_badge',
        badgeId,
        newMediaURL
    );
};

export default function EditBadgeModal({ isOpen, onClose, badge, onFileUpload, newBadgeName, setNewBadgeName, newMediaURL, onSaveChanges, isLoading, creditsLeft }: EditBadgeModalProps) {
    if (!isOpen) return null;

    const { openFileUploadDialog, isUploading, uploadProgress } = useEditBadgeFileUpload(
        onFileUpload,
        badge.badge_id,
        newMediaURL
    );

    const addCacheBuster = (url: string) => {
        if (!url) return '';
        return `${url}?${new Date().getTime()}`;
    };

    const hasChanges = newBadgeName !== badge.badge.name || newMediaURL !== badge.badge.media_url;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                            <PencilIcon className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">Edit Custom Badge</h3>
                            <p className="text-xs text-white/60">Customize your badge appearance</p>
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
                <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Credits Display */}
                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <CreditCard className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="w-full">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="text-sm font-medium text-white">Available Credits</h4>
                                    <span className="text-lg font-bold text-white">{creditsLeft}</span>
                                </div>
                                <p className="text-xs text-white/60">
                                    Each badge edit consumes 1 credit. You'll need at least 1 credit to save changes.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Badge Image Upload */}
                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Shield className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="w-full">
                                <h4 className="text-sm font-medium text-white mb-1">Badge Image</h4>
                                <p className="text-xs text-white/60 mb-4">
                                    Upload a square image for your badge (PNG recommended).
                                </p>
                                
                                <div className="flex flex-col items-center bg-black/50 border border-zinc-800/50 rounded-lg p-4">
                                    <div
                                        onClick={openFileUploadDialog}
                                        className="w-20 h-20 bg-black/40 rounded-lg border border-zinc-800/50 flex items-center justify-center 
                                                overflow-hidden cursor-pointer hover:border-purple-500/30 transition-colors mb-3"
                                    >
                                        {newMediaURL || badge.badge.media_url ? (
                                            <Image
                                                src={addCacheBuster(newMediaURL || badge.badge.media_url)}
                                                alt="Badge Preview"
                                                width={80}
                                                height={80}
                                                draggable="false"
                                                className="object-contain"
                                            />
                                        ) : (
                                            <Upload className="w-8 h-8 text-white/30" />
                                        )}
                                        {isUploading && (
                                          <div className="absolute bottom-0 left-0 w-full h-1 bg-black/50">
                                            <div 
                                              className="h-full bg-purple-600/50" 
                                              style={{ width: `${uploadProgress}%` }}
                                            />
                                          </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={openFileUploadDialog}
                                        className="px-3 py-1.5 bg-zinc-800/70 hover:bg-zinc-700/50 text-white text-xs rounded-md
                                                transition-colors border border-zinc-800/50 flex items-center gap-2"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        {newMediaURL ? 'Change Image' : 'Upload Image'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Badge Name */}
                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Settings className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="w-full">
                                <h4 className="text-sm font-medium text-white mb-1">Badge Name</h4>
                                <p className="text-xs text-white/60 mb-3">
                                    Give your badge a descriptive name.
                                </p>
                                
                                <input
                                    type="text"
                                    value={newBadgeName}
                                    onChange={(e) => setNewBadgeName(e.target.value)}
                                    placeholder="Enter badge name"
                                    className="w-full bg-black/50 border border-zinc-800/50 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/30"
                                    maxLength={30}
                                />
                                <p className="text-xs text-white/40 mt-1">
                                    {newBadgeName.length}/30 characters
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Warning about credit usage */}
                    {hasChanges && (
                        <div className="bg-zinc-800/30 rounded-lg border border-amber-800/20 p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 bg-amber-950/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Info className="w-4 h-4 text-amber-300" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-white mb-1">Changes Detected</h4>
                                    <p className="text-xs text-white/60">
                                        Saving these changes will use 1 badge edit credit. This action cannot be undone.
                                    </p>
                                    {creditsLeft <= 0 && (
                                        <p className="text-xs text-amber-300 mt-2">
                                            You don't have enough credits to save these changes.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Usage Info */}
                    <div className="flex items-center gap-2 bg-zinc-800/30 border border-zinc-800/50 rounded-lg p-3">
                        <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <p className="text-xs text-white/60">
                            Custom badges appear on your profile alongside earned badges. You can reorder them in the badge management section.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    
                    <button
                        onClick={onSaveChanges}
                        disabled={isLoading || !hasChanges || creditsLeft <= 0}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckIcon className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}