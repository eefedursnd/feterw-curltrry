export interface SocialPlatformInfo {
  available: boolean;
  supportedTypes: {
    redirect: boolean;
    copy_text: boolean;
  };
  defaultType: 'redirect' | 'copy_text';
}

export const Socials: Record<string, SocialPlatformInfo> = {
  snapchat: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  youtube: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  discord: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  spotify: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  instagram: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  x: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  tiktok: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  telegram: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  github: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  roblox: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  gitlab: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  twitch: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  namemc: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  steam: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  kick: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  behance: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  litecoin: {
    available: true,
    supportedTypes: { redirect: false, copy_text: true },
    defaultType: 'copy_text'
  },
  bitcoin: {
    available: true,
    supportedTypes: { redirect: false, copy_text: true },
    defaultType: 'copy_text'
  },
  ethereum: {
    available: true,
    supportedTypes: { redirect: false, copy_text: true },
    defaultType: 'copy_text'
  },
  monero: {
    available: true,
    supportedTypes: { redirect: false, copy_text: true },
    defaultType: 'copy_text'
  },
  solana: {
    available: true,
    supportedTypes: { redirect: false, copy_text: true },
    defaultType: 'copy_text'
  },
  paypal: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  reddit: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  facebook: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  'ko-fi': {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  email: {
    available: true,
    supportedTypes: { redirect: false, copy_text: true },
    defaultType: 'copy_text'
  },
  pinterest: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
  custom: {
    available: true,
    supportedTypes: { redirect: true, copy_text: true },
    defaultType: 'redirect'
  },
};

export function isSocialTypeSupported(platform: string, type: 'redirect' | 'copy_text'): boolean {
  const platformInfo = Socials[platform.toLowerCase()];
  if (!platformInfo) return false;
  return platformInfo.supportedTypes[type];
}

export function getDefaultSocialType(platform: string): 'redirect' | 'copy_text' {
  const platformInfo = Socials[platform.toLowerCase()];
  if (!platformInfo) return 'redirect';
  return platformInfo.defaultType;
}