"use client";

import { useState } from 'react';
import Image from 'next/image';
import RedirectModal from '../../modals/RedirectModal';
import * as SocialIcons from '../../../socials/Socials';
import Tooltip from '../Tooltip';
import toast from 'react-hot-toast';
import { analyticsAPI } from 'haze.bio/api';

interface CustomSocialLinkProps {
    link: string;
    imageUrl?: string;
    glowSocials?: boolean;
    iconColor?: string;
    socialType?: string;
    uid?: number;
}

const CustomSocialLink = ({
    link,
    imageUrl,
    glowSocials,
    iconColor,
    socialType = 'redirect',
    uid
}: CustomSocialLinkProps) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [currentUrl, setCurrentUrl] = useState('');

    const handleCustomSocialClick = (e: React.MouseEvent) => {
        e.preventDefault();

        if (uid) {
            try {
                analyticsAPI.trackSocialClick(uid, "custom");
            } catch (error) {
                console.error("Failed to track social click:", error);
            }
        }

        if (socialType === 'copy_text') {
            navigator.clipboard.writeText(link);
            toast.success('Copied to clipboard!');
        } else {
            setCurrentUrl(link);
            setModalOpen(true);
        }
    };

    const handleRedirectConfirm = () => {
        window.open(currentUrl, '_blank', 'noopener,noreferrer');
        setModalOpen(false);
    };

    const commonStyle = {
        filter: glowSocials ? `drop-shadow(0px 0px 6px ${iconColor || "#ffffff"})` : "none"
    };

    const iconElement = imageUrl ? (
        <Image
            src={imageUrl}
            alt="Custom social icon"
            width={35}
            height={35}
            className="w-[24px] h-[24px] object-contain"
            draggable="false"
        />
    ) : (
        <SocialIcons.CustomIcon
            color={iconColor}
        />
    );

    return (
        <>
            {socialType === 'copy_text' ? (
                <Tooltip text={'Copy Text'} position="top">
                    <button
                        onClick={handleCustomSocialClick}
                        className="p-1 rounded-xl transition-all duration-300 hover:bg-white/10 social-icon"
                        style={{
                            ...commonStyle,
                            color: iconColor
                        }}
                    >
                        {iconElement}
                    </button>
                </Tooltip>
            ) : (
                <button
                    onClick={handleCustomSocialClick}
                    className="p-1 rounded-xl transition-all duration-300 hover:bg-white/10 social-icon"
                    style={{
                        ...commonStyle,
                        color: iconColor
                    }}
                >
                    {iconElement}
                </button>
            )}

            {socialType !== 'copy_text' && (
                <RedirectModal
                    url={currentUrl}
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onConfirm={handleRedirectConfirm}
                />
            )}
        </>
    );
};

export default CustomSocialLink;