'use client';

import React from 'react';
import Tooltip from '../Tooltip';
import toast from 'react-hot-toast';
import { analyticsAPI } from 'haze.bio/api';

interface SocialLinkProps {
    id: number;
    link: string;
    platform: string;
    icon: React.ReactNode;
    socialType?: string;
    iconColor?: string;
    glowSocials?: boolean;
    isMonochrome?: boolean;
    uid?: number; // Add UID prop
}

const SocialLink = ({
    id,
    link,
    platform,
    icon,
    socialType = 'redirect',
    iconColor,
    glowSocials,
    isMonochrome,
    uid
}: SocialLinkProps) => {
    const handleCopyText = () => {
        if (uid) {
            try {
                analyticsAPI.trackSocialClick(uid, platform.toLowerCase());
            } catch (error) {
                console.error("Failed to track social click:", error);
            }
        }

        navigator.clipboard.writeText(link);
        toast.success('Copied to clipboard!');
    };

    const handleSocialClick = (e: React.MouseEvent) => {
        if (uid) {
            try {
                analyticsAPI.trackSocialClick(uid, platform.toLowerCase());
            } catch (error) {
                console.error("Failed to track social click:", error);
            }
        }
    };

    if (socialType === 'copy_text') {
        return (
            <Tooltip text="Copy Text" position="top">
                <button
                    onClick={handleCopyText}
                    className="p-1 rounded-xl transition-all duration-300 hover:bg-white/10 social-icon"
                    style={{
                        color: isMonochrome ? iconColor : iconColor,
                        filter: glowSocials ? `drop-shadow(0px 0px 6px ${isMonochrome ? iconColor : iconColor})` : "none"
                    }}
                >
                    {icon}
                </button>
            </Tooltip>
        );
    }

    return (
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleSocialClick}
            className="p-1 rounded-xl transition-all duration-300 hover:bg-white/10 social-icon"
            style={{
                color: isMonochrome ? iconColor : iconColor,
                filter: glowSocials ? `drop-shadow(0px 0px 6px ${isMonochrome ? iconColor : iconColor})` : "none"
            }}
        >
            {icon}
        </a>
    );
};

export default SocialLink;