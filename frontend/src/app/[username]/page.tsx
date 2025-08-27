import { notFound } from 'next/navigation';
import Image from "next/image";
import { ArrowLeft, Link, UserX } from "lucide-react";
import { Template, User } from "haze.bio/types";
import * as SocialIcons from '../../socials/Socials';
import { profileAPI, templateAPI } from "haze.bio/api";
import ViewCounter from 'haze.bio/components/ViewCounter';
import DefaultTemplate from 'haze.bio/components/templates/DefaultTemplate';
import ModernTemplate from 'haze.bio/components/templates/ModernTemplate';
import DOMPurify from 'isomorphic-dompurify';
import { cookies } from 'next/headers';
import MediaPlayer from 'haze.bio/components/widgets/audio/MediaPlayer';
import ClientEffectsContainer from 'haze.bio/components/ui/ClientEffectsContainer';
import MinimalisticTemplate from 'haze.bio/components/templates/MinimalisticTemplate';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { user } = await getProfileData(username);

  if (!user || !user.profile) return {};

  const title = `${user.display_name || user.username} | cutz.lol`;
  const description = user.profile?.description || 'All your links, in one place';

  let imageUrl;
  imageUrl = `https://api.haze.bio/api/images/user/${user.uid}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
          url: `https://cutz.lol/${username}`,
    siteName: "cutz.lol",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${user.display_name || user.username}'s cutz.lol profile`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

async function getProfileData(username: string, previewTemplateId?: string): Promise<{ user: User | null, previewTemplate: Template | null }> {
  try {
    const user = await profileAPI.getPublicProfile(username);
    let previewTemplate = null;

    if (previewTemplateId) {
      try {
        const cookieStore = await cookies();
        previewTemplate = await templateAPI.getTemplateById(parseInt(previewTemplateId), cookieStore.toString());
      } catch (templateError) {
        console.error("Error fetching preview template:", templateError);
      }
    }

    if (user?.profile?.description) {
      const config = {
        ALLOWED_TAGS: ['p', 'b', 'i', 'u', 'code', 'strike', 'strong', 'em', 'br'],
        ALLOWED_ATTR: [],
      };
      user.profile.description = DOMPurify.sanitize(user.profile.description, config);
    }

    return { user, previewTemplate };
  } catch (error) {
    console.error("Error fetching user or profile:", error);
    return { user: null, previewTemplate: null };
  }
}

export default async function UserProfilePage(props: { params: Promise<{ username: string }>, searchParams: Promise<{ previewTemplateId: string }> }) {
  const params = await props.params;
  const { username } = params;

  const searchParams = await props.searchParams;
  const previewTemplateId = searchParams.previewTemplateId;

  const { user, previewTemplate } = await getProfileData(username, previewTemplateId);

  if (!user || !user.profile) {
    return notFound();
  }

  if (previewTemplate) {
    try {
      const templateData = JSON.parse(previewTemplate.template_data);
      const {
        uid,
        views,
        description,
        ...restTemplateData
      } = templateData;

      user.profile = {
        ...user.profile,
        ...restTemplateData,
      };
    } catch (error) {
      console.error("Error parsing or applying template data:", error);
    }
  }

  if (user.username.includes("deleted_user_") || user.display_name?.includes("Deleted User ")) {
    return notFound();
  }

  try {
    if (user.punishments && Object.keys(user.punishments).length > 0 && user.punishments[0].punishment_type === 'full') {
      return (
        <div className="min-h-screen relative flex flex-col">
          {/* Background Elements and Gradients */}
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Base dark background */}
            <div className="absolute inset-0 bg-black"></div>

            {/* Purple gradient elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-800/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-30%] left-[-10%] w-[500px] h-[500px] bg-purple-700/10 rounded-full blur-[90px]"></div>

            {/* Additional subtle gradients */}
            <div className="absolute top-[-10%] left-[-10%] right-[-10%] bottom-[-10%] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-900/5 via-transparent to-transparent"></div>
            <div className="absolute top-[-10%] right-[-10%] left-[20%] bottom-[-10%] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-800/5 via-transparent to-transparent"></div>

            {/* Animated elements */}
            <div className="absolute top-[10%] left-[20%] w-[600px] h-[200px] rounded-full bg-purple-500/5 blur-[100px] animate-float-slow"></div>
            <div className="absolute top-[50%] right-[20%] w-[500px] h-[300px] rounded-full bg-purple-600/5 blur-[100px] animate-float-slow animation-delay-2000"></div>
          </div>

          {/* Content Container */}
          <div className="relative z-10 flex-grow flex flex-col">
            {/* Content Area */}
            <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 flex-1 flex items-center justify-center">
              <div className="w-full space-y-6">
                {/* Error Card */}
                <div className="relative overflow-hidden bg-black/80 backdrop-blur-md rounded-xl border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>

                  <div className="relative p-8">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 bg-purple-800/20 rounded-full flex items-center justify-center">
                        <UserX className="w-8 h-8 text-purple-400" />
                      </div>
                    </div>

                    <div className="text-center">
                      <h2 className="text-xl font-bold text-white mb-4">
                        Account Unavailable
                      </h2>
                      <p className="text-zinc-300 mb-6">
                        This user profile has been restricted and cannot be accessed.
                      </p>

                      {user.punishments[0].reason && (
                        <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20 mb-6">
                          <p className="text-purple-300 text-sm">
                            Reason: {user.punishments[0].reason}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center gap-3 justify-center mt-6">
                        <a
                          href="/"
                          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-800 text-white 
                                  rounded-lg hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all text-sm font-medium
                                  flex items-center justify-center gap-2 border border-purple-500/20"
                        >
                          Return Home
                        </a>
                        <a
                          href="https://discord.gg/hazebio"
                          className="w-full sm:w-auto px-6 py-2.5 bg-black/60 border border-white/10 hover:border-purple-500/30
                                  text-white rounded-lg text-sm font-medium transition-all hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]
                                  flex items-center justify-center gap-2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Contact Support
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="relative z-10 py-6 border-t border-purple-500/10 backdrop-blur-sm mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
              <p className="text-zinc-500 text-sm">
                © {new Date().getFullYear()} cutz.lol | All rights reserved
              </p>
            </div>
          </footer>
        </div>
      );
    }
  } catch (error) {
    console.error("Error fetching punishment:", error);
  }

  const socialIcons: { [key: string]: React.FC<{ size?: number; color?: string; className?: string }> } = {
    snapchat: SocialIcons.SnapchatIcon,
    youtube: SocialIcons.YoutubeIcon,
    discord: SocialIcons.DiscordIcon,
    spotify: SocialIcons.SpotifyIcon,
    instagram: SocialIcons.InstagramIcon,
    x: SocialIcons.XIcon,
    tiktok: SocialIcons.TiktokIcon,
    telegram: SocialIcons.TelegramIcon,
    github: SocialIcons.GithubIcon,
    roblox: SocialIcons.RobloxIcon,
    gitlab: SocialIcons.GitlabIcon,
    twitch: SocialIcons.TwitchIcon,
    namemc: SocialIcons.NamemcIcon,
    steam: SocialIcons.SteamIcon,
    kick: SocialIcons.KickIcon,
    behance: SocialIcons.BehanceIcon,
    litecoin: SocialIcons.LitecoinIcon,
    bitcoin: SocialIcons.BitcoinIcon,
    ethereum: SocialIcons.EthereumIcon,
    monero: SocialIcons.MoneroIcon,
    solana: SocialIcons.SolanaIcon,
    paypal: SocialIcons.PaypalIcon,
    reddit: SocialIcons.RedditIcon,
    facebook: SocialIcons.FacebookIcon,
    'ko-fi': SocialIcons.KofiIcon,
    email: SocialIcons.EmailIcon,
    pinterest: SocialIcons.PinterestIcon,
    custom: SocialIcons.CustomIcon,
  };

  const getColorFromIcon = (icon: string) => {
    switch (icon) {
      case "snapchat":
        return "#fffc00";
      case "youtube":
        return "red";
      case "discord":
        return "#5865f2";
      case "spotify":
        return "#1ed760";
      case "instagram":
        return "#d62976";
      case "x":
        return "#292929";
      case "tiktok":
        return "#f7f7f7";
      case "telegram":
        return "#2aabee";
      case "github":
        return "white";
      case "roblox":
        return "#97a6b4";
      case "gitlab":
        return "#FC6D26";
      case "twitch":
        return "#9146FF";
      case "namemc":
        return "#080808";
      case "steam":
        return "#ebebeb";
      case "kick":
        return "#52fa17";
      case "behance":
        return "#1769ff";
      case "litecoin":
        return "#1769ff";
      case "bitcoin":
        return "#f7931a";
      case "ethereum":
        return "#3c3c3d";
      case "monero":
        return "#F60";
      case "solana":
        return "white";
      case "paypal":
        return "#00457C";
      case "reddit":
        return "#FF4500";
      case "facebook":
        return "#1877F2";
      case "ko-fi":
        return "#FF5E5B";
      case "email":
        return "#FFFFFF";
      case "pinterest":
        return "#E60023";
      case "custom":
        return "#929292";
      default:
        return "black";
    }
  }

  const formatJoinedAt = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) {
      return `joined ${years} year${years > 1 ? "s" : ""} ago`;
    } else if (months > 0) {
      return `joined ${months} month${months > 1 ? "s" : ""} ago`;
    } else if (days > 0) {
      return `joined ${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `joined ${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (minutes > 0) {
      return `joined ${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else {
      return `joined ${seconds} second${seconds > 1 ? "s" : ""} ago`;
    }
  }

  const getEffectClass = (effect: string | undefined | null): { className: string; style?: React.CSSProperties } => {
    if (!user.has_premium && (effect === 'hacker')) {
      return { className: 'text-zinc-500 italic' };
    }

    const textColor = user.profile?.text_color || '#ffffff';
    const accentColor = user.profile?.accent_color || '#00ff41';

    switch (effect) {
      case 'gradient':
        return {
          className: 'bg-clip-text text-transparent',
          style: {
            backgroundImage: `linear-gradient(to right, ${user.profile.gradient_from_color}, ${user.profile.gradient_to_color})`
          }
        };
      case 'rainbow':
        return {
          className: 'bg-[linear-gradient(to_right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] bg-clip-text text-transparent animate-rainbow'
        };
      case 'glitch':
        return {
          className: 'animate-glitch text-white'
        };
      case 'cyber':
        return {
          className: 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]'
        };
      case 'retro':
        return {
          className: 'animate-retro'
        };
      case '3d':
        return {
          className: 'animate-3d text-white',
          style: { display: 'inline-block' }
        };
      case 'hacker':
        return {
          className: 'animate-hacker',
          style: {
            display: 'inline-block',
            '--text-color': textColor,
            '--accent-color': accentColor
          } as React.CSSProperties
        };
      default:
        return {
          className: 'text-white'
        };
    }
  };

  const effect = getEffectClass(user.profile.username_effects);
  function hasAudioGif(url: string): boolean {
    const lowerCaseUrl = url.toLowerCase();
    return (
      lowerCaseUrl.endsWith(".gif") ||
      lowerCaseUrl.endsWith(".mp4") ||
      lowerCaseUrl.endsWith(".mov") ||
      lowerCaseUrl.endsWith(".webm") ||
      lowerCaseUrl.endsWith(".ogg") ||
      lowerCaseUrl.endsWith(".avi") ||
      lowerCaseUrl.endsWith(".wmv") ||
      lowerCaseUrl.endsWith(".flv") ||
      lowerCaseUrl.endsWith(".mkv")
    );
  }

  const sortedWidgets = user.widgets ? [...user.widgets].sort((a, b) => a.sort - b.sort) : [];
  const renderTemplate = () => {
    switch (user.profile?.template) {
      case 'modern':
        return (
          <ModernTemplate
            layoutMaxWidth={user.profile?.layout_max_width}
            socialIcons={socialIcons}
            getColorFromIcon={getColorFromIcon}
            formatJoinedAt={formatJoinedAt}
            getEffectClass={getEffectClass}
            sortedWidgets={sortedWidgets}
            previewTemplate={previewTemplate}
            user={user}
          />
        );
      case 'minimalistic':
        return (
          <MinimalisticTemplate
            layoutMaxWidth={user.profile?.layout_max_width}
            socialIcons={socialIcons}
            getColorFromIcon={getColorFromIcon}
            formatJoinedAt={formatJoinedAt}
            getEffectClass={getEffectClass}
            sortedWidgets={sortedWidgets}
            previewTemplate={previewTemplate}
            user={user}
          />
        );
      default:
        return (
          <DefaultTemplate
            layoutMaxWidth={user.profile?.layout_max_width}
            socialIcons={socialIcons}
            getColorFromIcon={getColorFromIcon}
            formatJoinedAt={formatJoinedAt}
            getEffectClass={getEffectClass}
            sortedWidgets={sortedWidgets}
            previewTemplate={previewTemplate}
            user={user}
          />
        );
    }
  };

  return (
    <ClientEffectsContainer
      cursorEffect={user.profile?.cursor_effects}
      isPremium={user.has_premium}
      profileUsername={user.username}
      user={user}
    >
      <div
        className={`min-h-screen w-full flex items-center justify-center p-4 relative font-${user.profile?.text_font || 'poppins'}`}
        style={{
          background: user.profile?.background_url ? undefined : user.profile?.background_color || '',
        }}
      >
        <ViewCounter uid={user.uid} />
        <div className="absolute inset-0 w-full h-full">
          {user.profile?.background_url && !hasAudioGif(user.profile?.background_url) ? (
            <Image
              src={user.profile?.background_url}
              alt=""
              priority
              fill
              draggable="false"
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
          ) : null}
        </div>

        {user.profile?.background_url || user.profile?.audio_url ? (
          <MediaPlayer
            backgroundUrl={user.profile?.background_url || ""}
            audioUrl={user.profile?.audio_url || ""}
            overlayText={user.profile?.page_enter_text || 'click to enter...'}
            backgroundBlur={user.profile?.background_blur || 0}
          />
        ) : null}

        {renderTemplate()}
      </div>
    </ClientEffectsContainer>
  );
}