export type WidgetSettingType = 'text' | 'dropdown' | 'checkbox' | 'color' | 'number';

export interface WidgetSettingField {
  type: WidgetSettingType;
  label: string;
  key: string;
  defaultValue: string | number | boolean;
  options?: Array<{ value: string, label: string }>;
  placeholder?: string;
  helpText?: string;
}

export interface WidgetDefinition {
  name: string;
  description: string;
  type: string;
  settings?: WidgetSettingField[];
}

export const availableWidgets: WidgetDefinition[] = [
  {
    name: "Discord Presence",
    description: "Display your Discord status on your profile.",
    type: "discord_presence",
  },
  {
    name: "Discord Server",
    description: "Display your Discord server invite link.",
    type: "discord_server",
    settings: [
      {
        type: 'text',
        label: 'Invite Link',
        key: 'inviteLink',
        defaultValue: '',
        placeholder: 'discord.gg/your-invite',
        helpText: 'Enter your Discord server invite link'
      }
    ],
  },
  {
    name: "GitHub Profile",
    description: "Display your GitHub profile on your profile.",
    type: "github_profile",
    settings: [
      {
        type: 'text',
        label: 'Username',
        key: 'username',
        defaultValue: '',
        placeholder: 'Your GitHub username',
        helpText: 'Enter your GitHub username without @'
      }
    ],
  },
  {
    name: "Valorant Stats",
    description: "Display your Valorant stats on your profile.",
    type: "valorant_stats",
    settings: [
      {
        type: 'text',
        label: 'Username',
        key: 'username',
        defaultValue: '',
        placeholder: 'Your Valorant username'
      },
      {
        type: 'text',
        label: 'Tag',
        key: 'tag',
        defaultValue: '',
        placeholder: 'Your Valorant tag (without #)'
      }
    ],
  },
  {
    name: "Audio Player",
    description: "Display an audio player on your profile synced with your audio.",
    type: "audio_player",
    settings: [
      {
        type: 'text',
        label: 'Title',
        key: 'title',
        defaultValue: 'Now Playing',
        placeholder: 'Audio title'
      },
      {
        type: 'dropdown',
        label: 'Style',
        key: 'style',
        defaultValue: 'compact',
        options: [
          { value: 'compact', label: 'Compact' },
          { value: 'detailed', label: 'Detailed' }
        ],
        helpText: 'Select how the audio player should appear'
      }
    ],
  },
  {
    name: "Spotify",
    description: "Display Spotify tracks, albums, or playlists on your profile.",
    type: "spotify",
    settings: [
      {
        type: 'text',
        label: 'Spotify URL',
        key: 'spotifyUrl',
        defaultValue: '',
        placeholder: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
        helpText: 'Paste a Spotify link to a track, album, or playlist'
      },
      {
        type: 'dropdown',
        label: 'Layout',
        key: 'layout',
        defaultValue: 'detailed',
        options: [
          { value: 'detailed', label: 'Detailed' },
          { value: 'compact', label: 'Compact' }
        ],
        helpText: 'Select how the Spotify widget should appear'
      },
      // {
      //   type: 'checkbox',
      //   label: 'Use Profile Colors',
      //   key: 'useProfileColors',
      //   defaultValue: true,
      //   helpText: 'Use your profile accent and text colors in the widget'
      // }
    ],
  },
  {
    name: "Custom Button",
    description: "Add a customizable button that links to any URL with your own style.",
    type: "button",
    settings: [
      {
        type: 'text',
        label: 'Button Text',
        key: 'buttonText',
        defaultValue: 'Click Me',
        placeholder: 'Enter button text',
        helpText: 'Text displayed on the button'
      },
      {
        type: 'text',
        label: 'URL',
        key: 'url',
        defaultValue: '',
        placeholder: 'https://example.com',
        helpText: 'Link destination when button is clicked'
      },
      {
        type: 'dropdown',
        label: 'Button Style',
        key: 'style',
        defaultValue: 'filled',
        options: [
          { value: 'filled', label: 'Filled' },
          { value: 'outline', label: 'Outline' },
          { value: 'ghost', label: 'Ghost' },
          { value: 'glass', label: 'Glass Effect' }
        ],
        helpText: 'Select the button appearance style'
      },
      {
        type: 'dropdown',
        label: 'Button Shape',
        key: 'shape',
        defaultValue: 'rounded',
        options: [
          { value: 'rounded', label: 'Rounded' },
          { value: 'pill', label: 'Pill' },
          { value: 'square', label: 'Square' }
        ],
        helpText: 'Choose the button corner style'
      },
      {
        type: 'dropdown',
        label: 'Button Size',
        key: 'size',
        defaultValue: 'medium',
        options: [
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' }
        ],
        helpText: 'Set the button size'
      },
      {
        type: 'color',
        label: 'Button Color',
        key: 'buttonColor',
        defaultValue: '#8B5CF6',
        helpText: 'Choose a color for your button'
      },
      {
        type: 'color',
        label: 'Text Color',
        key: 'textColor',
        defaultValue: '#FFFFFF',
        helpText: 'Choose a color for the button text'
      },
      {
        type: 'checkbox',
        label: 'Full Width',
        key: 'fullWidth',
        defaultValue: false,
        helpText: 'Make the button take up the full width available'
      },
      {
        type: 'checkbox',
        label: 'Glow Effect',
        key: 'glowEffect',
        defaultValue: false,
        helpText: 'Add a glow effect to the button'
      },
      {
        type: 'checkbox',
        label: 'Pulse Animation',
        key: 'pulseAnimation',
        defaultValue: false,
        helpText: 'Add a subtle pulsing animation to the button'
      }
    ],
  },
];