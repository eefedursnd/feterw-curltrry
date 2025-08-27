import { User, UserWidget, UserProfile } from 'haze.bio/types';
import { discordAPI, widgetAPI } from 'haze.bio/api';
import DiscordPresenceWidget from './DiscordPresenceWidget';
import DiscordServerWidget from './DiscordServerWidget';
import GitHubWidget from './GitHubWidget';
import ValorantStatsWidget from './ValorantStatsWidget';
import SpotifyWidget from './SpotifyWidget';
import AudioPlayerWidget from './AudioPlayerWidget';
import ButtonWidget from './ButtonWidget';

interface WidgetContainerProps {
  widget: UserWidget;
  user: User;
}

const WidgetContainer = async ({ widget, user }: WidgetContainerProps) => {
  try {
    const widgetData = JSON.parse(widget.widget_data);
    const widgetType = widgetData.type;
    const settings = widgetData.settings || {};

    const renderWidget = async () => {
      switch (widgetType) {
        case 'discord_presence': {
          try {
            const presenceData = await discordAPI.getDiscordPresence(Number(user?.uid || 0));
            return (
              <DiscordPresenceWidget 
                profile={user.profile} 
                UID={Number(user?.uid || 0)} 
                presenceData={presenceData} 
              />
            );
          } catch (error) {
            console.error("Error fetching Discord presence:", error);
            return (
              <DiscordPresenceWidget 
                profile={user.profile} 
                UID={Number(user?.uid || 0)} 
                presenceData={null} 
              />
            );
          }
        }
        
        case 'discord_server': {
          try {
            const serverData = await discordAPI.getDiscordServer(settings.inviteLink);
            return (
              <DiscordServerWidget 
                inviteLink={settings.inviteLink} 
                profile={user.profile} 
                serverData={serverData} 
              />
            );
          } catch (error) {
            console.error("Error fetching Discord server:", error);
            return (
              <DiscordServerWidget 
                inviteLink={settings.inviteLink} 
                profile={user.profile} 
                serverData={null} 
              />
            );
          }
        }
        
        case 'github_profile': {
          try {
            const githubData = await widgetAPI.getGithubData(settings.username);
            return (
              <GitHubWidget 
                username={settings.username} 
                profile={user.profile} 
                githubData={githubData} 
              />
            );
          } catch (error) {
            console.error("Error fetching GitHub data:", error);
            return (
              <GitHubWidget 
                username={settings.username} 
                profile={user.profile} 
                githubData={null} 
              />
            );
          }
        }
        
        case 'valorant_stats': {
          try {
            const valorantData = await widgetAPI.getValorantData(settings.username, settings.tag);
            return (
              <ValorantStatsWidget 
                username={settings.username} 
                tag={settings.tag} 
                profile={user.profile} 
                valorantData={valorantData} 
              />
            );
          } catch (error) {
            console.error("Error fetching Valorant stats:", error);
            return (
              <ValorantStatsWidget 
                username={settings.username} 
                tag={settings.tag} 
                profile={user.profile} 
                valorantData={null} 
              />
            );
          }
        }
        
        case 'spotify':
          return (
            <SpotifyWidget
              spotifyUrl={settings.spotifyUrl || ''}
              layout={settings.layout || 'detailed'}
              useProfileColors={settings.useProfileColors !== undefined ? settings.useProfileColors : true}
              profile={user.profile}
            />
          );
          
        case 'audio_player':
          return (
            <AudioPlayerWidget
              title={settings.title || 'Now Playing'}
              style={settings.style || 'compact'}
              showCoverArt={settings.showCoverArt !== undefined ? settings.showCoverArt : true}
              profile={user.profile}
            />
          );
        
        case 'button':
          if (!user.has_premium) {
            return (
              <div className="backdrop-blur-sm border border-purple-500/10 rounded-lg p-4">
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-purple-400 font-medium">Premium Feature</span>
                  <p className="text-xs text-white/60 mt-1">
                    Custom Button is only available for Premium users
                  </p>
                </div>
              </div>
            );
          }
          
          return (
            <ButtonWidget
              buttonText={settings.buttonText || 'Click Me'}
              url={settings.url || ''}
              style={settings.style || 'filled'}
              shape={settings.shape || 'rounded'}
              size={settings.size || 'medium'}
              buttonColor={settings.buttonColor || '#8B5CF6'}
              textColor={settings.textColor || '#FFFFFF'}
              iconUrl={settings.iconUrl || ''}
              fullWidth={settings.fullWidth || false}
              glowEffect={settings.glowEffect || false}
              pulseAnimation={settings.pulseAnimation || false}
              profile={user.profile}
            />
          );
          
        default:
          return (
            <div className="backdrop-blur-sm border border-white/10 rounded-lg p-4 text-zinc-400 text-sm">
              Unknown Widget Type: {widgetType}
            </div>
          );
      }
    };

    const widgetContent = await renderWidget();

    return (
      <div className="w-full">
        {widgetContent}
      </div>
    );
  } catch (error) {
    console.error("Error parsing widget JSON:", error);
    return (
      <div className="backdrop-blur-sm border border-red-500/10 rounded-lg p-4 text-red-400 text-sm">
        Invalid Widget Data
      </div>
    );
  }
};

export default WidgetContainer;