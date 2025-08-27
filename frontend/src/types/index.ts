export interface User {
  uid: number;
  email: string | null;
  username: string;
  display_name: string;
  alias: string | null;
  password?: string;
  staff_level: number; //0=User, 1=Trial Mod, 2=Mod, 3=Head Mod, 4=Admin
  badge_edit_credits: number;
  mfa_secret?: string | null;
  mfa_enabled: boolean;
  login_with_discord: boolean;
  discord_id: string | null;
  linked_at: string | null;
  created_at: string;
  email_verified: boolean;

  /* relations */
  profile: UserProfile;
  badges: UserBadge[];
  socials: UserSocial[];
  widgets: UserWidget[];
  punishments: Punishment[] | null;
  sessions: UserSession[] | null;
  subscription: UserSubscription | null;

  /* virtual fields */
  has_premium: boolean;
  experimental_features: string[] | null;

  username_cooldown?: number;
  alias_cooldown?: number;
  display_name_cooldown?: number;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  subscription_type: string; // e.g., "monthly", "lifetime"
  status: string; // e.g., "active", "canceled"
  next_payment_date: string;
  created_at: string;
  updated_at: string;
}

export interface ShopProduct {
  id: number;
  name: string;
  description: string;
  price_eur: number;
  price_glow: number;
  duration: string;
  type: string;
  requires_premium: boolean;
  display_in_shop: boolean;
  preview_available: boolean;
}

export interface UserProfile {
  uid: number;
  views: number;
  description: string | null;
  location: string | null;
  occupation: string | null;
  avatar_url: string | null;
  background_url: string | null;
  audio_url: string | null;
  cursor_url: string | null;
  banner_url: string | null;
  decoration_url: string | null;
  accent_color: string | null;
  text_color: string | null;
  background_color: string | null;
  gradient_from_color: string | null;
  gradient_to_color: string | null;
  icon_color: string | null;
  badge_color: string | null;
  page_enter_text: string | null;
  page_transition: string | null;
  page_transition_duration: number;
  text_font: string | null;
  avatar_shape: string | null;
  template: string | null; // default or modern
  monochrome_icons: boolean;
  monochrome_badges: boolean;
  hide_joined_date: boolean;
  hide_views_count: boolean;
  card_opacity: number;
  card_blur: number;
  card_border_radius: number;
  background_blur: number;
  parallax_effect: boolean;
  layout_max_width: number;
  username_effects: string | null;
  background_effects: string | null;
  cursor_effects: string | null;
  glow_username: boolean;
  glow_badges: boolean;
  glow_socials: boolean;
  show_widgets_outside: boolean;
  views_animation: boolean;
  use_discord_avatar: boolean;
  use_discord_decoration: boolean;
}

export interface LoginResponse {
  error?: string;
  userID?: number;
  requiresMfa?: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
}

export interface UserSocial {
  id: number;
  uid: number;
  platform: string;
  link: string;
  sort: number;
  hidden: boolean;
  social_type: string; // redirect or copy_text
  image_url?: string;
}

export interface UserWidget {
  id: number;
  uid: number;
  widget_data: string;
  sort: number;
  hidden: boolean;
}

export interface Status {
  id: number;
  type: string;
  reason: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface DiscordPresence {
  avatar: string;
  username: string;
  status: string;
  description: string;
  emoji: string;
  emoji_id: string;
  emoji_name: string;
  emoji_animated: boolean;
  activity: string;
  state: string;
  details: string;
  cover_image: string;
  large_text: string;
  badges: {
    name: string;
    url: string;
  }[];
}

export interface DiscordServer {
  name: string;
  avatar: string;
  online_count: number;
  total_count: number;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  followers: number;
  public_repos: number;
}

export interface ValorantUser {
  name: string;
  tag: string;
  region: string;
  rank: string;
  rr: number;
}

export interface UserBadge {
  id: number;
  uid: number;
  badge_id: number;
  sort: number;
  hidden: boolean;
  badge: Badge;
}

export interface UserSession {
  id: number;
  user_id: number;
  session_token: string;
  user_agent: string;
  ip_address: string;
  location: string;
  current_session: boolean;
  expires_at: string;
  created_at: string;
}

export interface Badge {
  id: number;
  name: string;
  media_url: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface Punishment {
  id: number;
  user_id: number;
  staff_id: number;
  reason: string;
  details: string;
  created_at: string;
  end_date: string | null;
  active: boolean;
  punishment_type: string;

  staff_name: string;
}

export interface ModerationAction {
  id: number;
  type: string;
  username: string;
  reason: string;
  timestamp: string;
  staffMember: string;
}

export interface Report {
  id: number;
  reported_user_id: number;
  reporter_user_id: number;
  reason: string;
  details: string;
  handled: boolean;
  handled_by: number;
  created_at: string;
}

export interface ReportWithDetails extends Report {
  reported_username: string;
  reported_display_name: string;
  reporter_username: string;
  total_reports: number;
  has_active_punishment: boolean;
  other_reporters: string[];
}

export interface PunishmentWithUser {
  id: number;
  userId: number;
  reason: string;
  details: string;
  createdAt: string;
  expiresAt: string | null;
  active: boolean;
  createdBy: number;
  punishmentType: string;
  username: string;
  staffUsername: string;
}

export interface Template {
  id: number;
  creator_id: number;
  name: string;
  uses: number;
  shareable: boolean;
  premium_required: boolean;
  tags: string[];
  template_data: string;
  banner_url: string;
  created_at: string;
  updated_at: string;

  creator_username?: string;
  creator_avatar?: string;
}

export interface View {
  user_id: number;
  views_data: string;
}

export interface MarqueeUser {
  username: string;
  display_name: string;
  avatar_url: string;
}

export interface LeaderboardUser {
  username: string;
  display_name: string;
  avatar_url: string;
  views: number;
  badges: number;
}

export interface SiteStats {
  users: number;
  premium: number;
  total_views: number;
  discord_linked: number;
}