import Link from 'next/link';
import { ExternalLink, Mail, Twitter, Github } from 'lucide-react';
import Logo from './Logo';
import React from 'react';
import { DiscordIcon, GithubIcon, XIcon } from 'haze.bio/socials/Socials';

interface FooterLink {
    name: string;
    href: string;
    icon?: React.ReactElement;
    external?: boolean;
}

interface FooterSection {
    title: string;
    links: FooterLink[];
}

interface SocialIcon {
    name: string;
    href: string;
    icon: React.ReactElement;
}


export default function Footer() {
    const currentYear = new Date().getFullYear();

    const sections: FooterSection[] = [
        {
            title: 'Links',
            links: [
                { name: 'Pricing', href: '/pricing' },
            ],
        },
        {
            title: 'Community',
            links: [
                { name: 'Discord', href: 'https://discord.gg/cutz', external: true },
                { name: 'GitHub', href: 'https://github.com/haze-bio', external: true },
            ],
        },
        {
            title: 'Legal',
            links: [
                { name: 'Privacy Policy', href: '/legal/policy' },
                { name: 'Terms of Service', href: '/legal/tos' },
            ],
        },
    ];

    const socialIcons: SocialIcon[] = [
        { name: 'Discord', href: 'https://discord.gg/cutz', icon: <DiscordIcon className="w-5 h-5" /> },
        { name: 'GitHub', href: 'https://github.com/haze-bio', icon: <GithubIcon className="w-5 h-5" /> },
    ];

    return (
        <footer className="bg-gradient-to-b from-transparent to-black/90 backdrop-blur-sm border-t border-zinc-800/30 text-zinc-400 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Decorative elements for smoother integration */}
                <div className="absolute left-0 right-0 pointer-events-none overflow-hidden opacity-10">
                    <div className="absolute top-[-80px] left-[10%] w-[200px] h-[200px] rounded-full bg-purple-900/10 blur-[80px]"></div>
                    <div className="absolute top-[-120px] right-[15%] w-[300px] h-[300px] rounded-full bg-purple-800/10 blur-[100px]"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 relative z-10">
                    {/* Logo and Description */}
                    <div className="md:col-span-2 lg:col-span-2 mb-6 md:mb-0">
                        <Link href="/" className="inline-block mb-4 group">
                            {/* Logo image instead of text */}
                            <div className="relative h-7 w-auto transition-opacity duration-300 group-hover:opacity-90">
                                <Logo />
                            </div>
                        </Link>
                        <p className="text-sm max-w-xs mb-6 text-zinc-500">
                            All your links, in one place. Create your own customizable profile page and share it with the world.
                        </p>
                        <div className="flex space-x-5">
                            {socialIcons.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-zinc-500 hover:text-purple-400 transition-colors duration-300"
                                    aria-label={social.name}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link Sections with smoother hover effects */}
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 border-b border-zinc-800/30 pb-2">
                                {section.title}
                            </h3>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            target={link.external ? '_blank' : undefined}
                                            rel={link.external ? 'noopener noreferrer' : undefined}
                                            className="text-sm text-zinc-500 hover:text-purple-400 transition-all duration-300 flex items-center group"
                                        >
                                            <span className="border-b border-transparent hover:border-purple-400/30 pb-0.5 transition-all duration-300">
                                                {link.name}
                                            </span>
                                            {link.icon}
                                            {link.external && (
                                                <ExternalLink className="w-3 h-3 ml-1.5 opacity-50 group-hover:opacity-80 transition-opacity duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </footer>
    );
}