'use client';

import { useEffect, useRef } from 'react';
import {
    ghostCursor,
    followingDotCursor,
    bubbleCursor,
    snowflakeCursor,
    CursorEffectResult
} from 'cursor-effects';

interface CursorEffectProviderProps {
    effect: string | null | undefined;
    isPremium: boolean;
}

export default function CursorEffectProvider({ effect, isPremium }: CursorEffectProviderProps) {
    const cursorEffectRef = useRef<CursorEffectResult | null>(null);

    useEffect(() => {
        if (cursorEffectRef.current) {
            try {
                cursorEffectRef.current.destroy();
                cursorEffectRef.current = null;
            } catch (error) {
                console.error("Error destroying cursor effect:", error);
            }
        }

        const currentEffect = effect || 'none';
        if (currentEffect === 'none') return;

        const isPremiumEffect = ['bubble', 'snowflake'].includes(currentEffect);
        if (isPremiumEffect && !isPremium) {
            return;
        }

        try {
            switch (currentEffect) {
                case 'ghost':
                    cursorEffectRef.current = ghostCursor();
                    break;
                case 'dot':
                    cursorEffectRef.current = followingDotCursor();
                    break;
                case 'bubble':
                    cursorEffectRef.current = bubbleCursor();
                    break;
                case 'snowflake':
                    cursorEffectRef.current = snowflakeCursor();
                    break;
            }
        } catch (error) {
            console.error(`Error initializing cursor effect '${currentEffect}':`, error);
        }

        return () => {
            if (cursorEffectRef.current) {
                try {
                    cursorEffectRef.current.destroy();
                } catch (error) {
                    console.error("Error cleaning up cursor effect:", error);
                }
            }
        };
    }, [effect, isPremium]);

    return null;
}