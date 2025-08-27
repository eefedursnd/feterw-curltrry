'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from 'haze.bio/context/UserContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (requireAuth && !user) {
      // Get current path for redirect
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    } else {
      setIsChecking(false);
    }
  }, [user, requireAuth, router]);

  // Add a small delay to allow UserContext to initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isChecking && !user) {
        setIsChecking(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, isChecking]);

  // Show loading spinner while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is not required or user is authenticated, render children
  if (!requireAuth || user) {
    return <>{children}</>;
  }

  // This should not be reached, but just in case
  return null;
}
