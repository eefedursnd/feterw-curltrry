import UserAPI from './user.api';
import ProfileAPI from './profile.api';
import SocialAPI from './social.api';
import MFAAPI from './mfa.api';
import DiscordAPI from './discord.api';
import WidgetAPI from './widget.api';
import BadgeAPI from './badge.api';
import FileAPI from './file.api';
import PunishAPI from './punish.api';
import ViewAPI from './view.api';
import RedeemAPI from './redeem.api';
import SessionAPI from './session.api';
import PublicAPI from './public.api';
import StatusAPI from './status.api';
import EmailAPI from './email.api';
import PasswordAPI from './password.api';
import TemplateAPI from './template.api';
import AnalyticsAPI from './analytics.api';
import ReportAPI from './report.api';
import ApplyAPI from './apply.api';

import DataAPI from './data.api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.cutz.lol/api';
if (!API_BASE) {
    throw new Error("API_BASE is not defined");
}

export const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

export async function handleApiError(response: Response, json: any): Promise<never> {
    const error = new Error(json?.message || 'Unknown error occurred');
    (error as any).status = response.status;
    throw error;
}

export async function parseJson(response: Response) {
    const json = await response.json();
    if (!json || typeof json !== 'object') {
        throw new Error('Invalid JSON response');
    }
    return json.data ?? json;
}

export const userAPI = new UserAPI(API_BASE);
export const profileAPI = new ProfileAPI(API_BASE);
export const socialAPI = new SocialAPI(API_BASE);
export const mfaAPI = new MFAAPI(API_BASE);
export const discordAPI = new DiscordAPI(API_BASE);
export const widgetAPI = new WidgetAPI(API_BASE);
export const badgeAPI = new BadgeAPI(API_BASE);
export const fileAPI = new FileAPI(API_BASE);
export const punishAPI = new PunishAPI(API_BASE);
export const viewAPI = new ViewAPI(API_BASE);
export const redeemAPI = new RedeemAPI(API_BASE);
export const sessionAPI = new SessionAPI(API_BASE);
export const publicAPI = new PublicAPI(API_BASE);
export const statusAPI = new StatusAPI(API_BASE);
export const emailAPI = new EmailAPI(API_BASE);
export const passwordAPI = new PasswordAPI(API_BASE);
export const templateAPI = new TemplateAPI(API_BASE);
export const analyticsAPI = new AnalyticsAPI(API_BASE);
export const reportAPI = new ReportAPI(API_BASE);
export const applyAPI = new ApplyAPI(API_BASE);

export const dataAPI = new DataAPI(API_BASE);

export * from './user.api';
export * from './profile.api';
export * from './social.api';
export * from './mfa.api';
export * from './discord.api';
export * from './widget.api';
export * from './badge.api';
export * from './file.api';
export * from './punish.api';
export * from './view.api';
export * from './redeem.api';
export * from './session.api';
export * from './public.api';
export * from './status.api';
export * from './email.api';
export * from './password.api';
export * from './template.api';
export * from './analytics.api';
export * from './report.api';
export * from './apply.api';

export * from './data.api';
