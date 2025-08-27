'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, Trophy, Sparkles, Activity, ArrowRight, ExternalLink, Briefcase } from 'lucide-react';
import { DiscordIcon } from 'haze.bio/socials/Socials';
import Logo from './ui/Logo';

export default function Navigation({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 5); // Trigger earlier for a smoother effect
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial scroll position
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Base classes for nav links with smoother transitions
  const navLinkBaseClasses = "text-[15px] font-medium text-zinc-400 hover:text-white transition-all duration-300 flex items-center gap-1.5 px-3 py-2 rounded-md";
  const navLinkHoverClasses = "hover:bg-purple-600/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]";

  return (
    <div className={`w-full sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'py-1' : 'py-3'}`}>
      {/* Smoother background/blur/shadow effect on scroll */}
      <div className={`max-w-7xl mx-auto rounded-xl transition-all duration-500 border ${scrolled
        ? 'bg-black/80 backdrop-blur-xl border-purple-500/30 shadow-xl shadow-purple-900/15'
        : 'bg-black/30 backdrop-blur-sm border-transparent/5' // Subtle background even when not scrolled for better readability
        }`}>
        <div className="px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              {/* Logo image instead of text */}
              <Logo />
            </Link>
          </div>

          {/* Smoother hover effects for desktop nav links */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            <Link href="/pricing" className={`${navLinkBaseClasses} ${navLinkHoverClasses}`}>
              <Sparkles className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
              Pricing
            </Link>
          </div>

          {/* Improved button styles with smoother transitions */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-800 border border-purple-500/50 hover:border-purple-400/80
                        text-white rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-lg shadow-purple-900/20
                        hover:shadow-xl hover:shadow-purple-800/30 hover:from-purple-500 hover:to-purple-700 transform hover:-translate-y-0.5"
              >
                <User className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-zinc-900/50 border border-zinc-700/60 hover:border-purple-500/50 hover:bg-purple-900/20
                          text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-md hover:shadow-purple-900/15"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="group px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-xl hover:shadow-purple-800/30
                          transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2 border border-purple-500/40 hover:border-purple-400/60
                          hover:from-purple-500 hover:to-purple-600 transform hover:-translate-y-0.5"
                >
                  Create page
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button with smoother hover effect */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-purple-300 hover:bg-purple-900/20 focus:outline-none border border-transparent hover:border-purple-500/30 transition-all duration-300"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">{mobileMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
              {mobileMenuOpen ? (
                <X className="block h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="block h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Smoother Mobile Menu transition */}
        <div className={`md:hidden transition-all duration-500 ease-in-out overflow-hidden ${mobileMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-2 pt-2 pb-4 space-y-1 border-t border-purple-500/20 bg-black/80 backdrop-blur-lg rounded-b-xl">
            <a
              href="https://discord.gg/hazebio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-3 text-zinc-300 hover:text-white hover:bg-purple-600/10 rounded-lg transition-all duration-300 border border-transparent hover:border-purple-500/20"
            >
              <DiscordIcon className="w-4 h-4 text-purple-400" color="currentColor" />
              Discord Community
              <ExternalLink className="w-3 h-3 opacity-60 ml-auto" />
            </a>

            <Link
              href="/pricing"
              className="flex items-center gap-2 px-3 py-3 text-zinc-300 hover:text-white hover:bg-purple-600/10 rounded-lg transition-all duration-300 border border-transparent hover:border-purple-500/20"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              Pricing
            </Link>

            <div className="border-t border-purple-500/20 my-2 pt-3 space-y-3">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-3 text-white bg-gradient-to-r from-purple-600 to-purple-800 border border-purple-500/50
                            rounded-lg transition-all duration-300 w-full justify-center font-medium shadow-lg shadow-purple-900/20 hover:from-purple-500 hover:to-purple-700"
                >
                  <User className="w-4 h-4" />
                  Dashboard
                </Link>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-3 py-3 text-zinc-300 bg-zinc-900/60 border border-zinc-700/60
                              rounded-lg transition-all duration-300 w-full justify-center font-medium hover:border-purple-500/50 hover:bg-purple-900/20 hover:text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-2 px-3 py-3 text-white bg-gradient-to-r from-purple-600 to-purple-700
                              rounded-lg transition-all duration-300 w-full justify-center font-medium border border-purple-500/40
                              shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-800/30 hover:from-purple-500 hover:to-purple-600"
                  >
                    Create your page
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}