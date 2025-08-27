'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Client3DWrapperProps {
    enable3DHover?: boolean;
    children: React.ReactNode;
    layoutMaxWidth: number;
    isPreview?: boolean;
}

const Client3DWrapper: React.FC<Client3DWrapperProps> = ({ enable3DHover, children, layoutMaxWidth, isPreview = false }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isMouseWithinBounds, setIsMouseWithinBounds] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    useEffect(() => {
        if (!enable3DHover || !cardRef.current || isMobile) return;

        const card = cardRef.current;
        let targetRotateX = 0;
        let targetRotateY = 0;
        let animationFrameId: number;

        const smoothTransition = () => {
            let currentRotateX = parseFloat(card.style.transform.replace(/.*rotateX\((.*?)deg\).*/, '$1')) || 0;
            let currentRotateY = parseFloat(card.style.transform.replace(/.*rotateY\((.*?)deg\).*/, '$1')) || 0;

            const easing = 0.2;

            currentRotateX += (targetRotateX - currentRotateX) * easing;
            currentRotateY += (targetRotateY - currentRotateY) * easing;

            card.style.transform = `perspective(1000px) rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg) scale3d(1, 1, 1)`;

            if (isMouseWithinBounds || Math.abs(currentRotateX) > 0.05 || Math.abs(currentRotateY) > 0.05) {
                animationFrameId = requestAnimationFrame(smoothTransition);
            } else {
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();

            if (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            ) {
                setIsMouseWithinBounds(true);

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const offsetX = (mouseX - centerX) / centerX;
                const offsetY = (mouseY - centerY) / centerY;

                const intensity = 11;

                targetRotateX = -offsetY * intensity;
                targetRotateY = offsetX * intensity;

                if (!animationFrameId) {
                     animationFrameId = requestAnimationFrame(smoothTransition);
                }

            } else {
                setIsMouseWithinBounds(false);
                targetRotateX = 0;
                targetRotateY = 0;
                 if (!animationFrameId) {
                     animationFrameId = requestAnimationFrame(smoothTransition);
                }
            }
        };

        const handleMouseLeave = () => {
            setIsMouseWithinBounds(false);
            targetRotateX = 0;
            targetRotateY = 0;
             if (!animationFrameId) {
                 animationFrameId = requestAnimationFrame(smoothTransition);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            card.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, [enable3DHover, isMobile, isMouseWithinBounds]);

    return (
        <div
            ref={cardRef}
            className={`mx-auto ${enable3DHover && !isMobile ? 'transform-3d' : ''}`}
            style={{
                willChange: enable3DHover && !isMobile ? 'transform' : undefined,
                transition: 'none',
                transform: enable3DHover && !isMobile ? 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)' : undefined,
                width: '100%',
                maxWidth: `${layoutMaxWidth}px`,
                position: isPreview ? 'relative' : (isMobile ? 'relative' : 'fixed'),
            }}
        >
            {children}
        </div>
    );
};

export default Client3DWrapper;
