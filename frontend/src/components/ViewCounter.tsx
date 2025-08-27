'use client';

import { viewAPI } from 'haze.bio/api';
import { useEffect } from 'react';

export default function ViewCounter({ uid }: { uid: number }) {
  useEffect(() => {
    const addView = async () => {
      try {
        await viewAPI.incrementViewCount(uid);
      } catch (error) {
        console.error('Failed to add view:', error);
      }
    };

    addView();
  }, [uid]);

  return null;
}